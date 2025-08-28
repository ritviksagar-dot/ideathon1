
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAppData } from './hooks/useAppData';
import type { CurrentUser, Mentor, Review } from './types';
import LoginScreen from './components/LoginScreen';
import MentorDashboard from './components/MentorDashboard';
import ReviewForm from './components/ReviewForm';
import AdminDashboard from './components/AdminDashboard';
import { CRITERIA } from './constants';
import { supabaseClient } from './supabaseClient';
import { User } from '@supabase/supabase-js';
import Toast, { ToastData } from './components/Toast';
import DashboardSkeleton from './components/DashboardSkeleton';

type View = 'dashboard' | 'review';

const withTimeout = <T,>(promise: PromiseLike<T>, ms: number, errorMessage = 'Operation timed out'): Promise<T> => {
  const timeoutPromise = new Promise<T>((_, reject) => {
    setTimeout(() => {
      reject(new Error(errorMessage));
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]);
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [longLoadMessage, setLongLoadMessage] = useState<string | null>(null);
  
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [view, setView] = useState<View>('dashboard');
  const [toast, setToast] = useState<ToastData | null>(null);
  const initialAuthCheckCompleted = useRef(false);

  const showToast = useCallback((data: ToastData) => {
    setToast(data);
  }, []);

  if (!supabaseClient) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="text-center max-w-2xl bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
            <strong className="font-bold">Configuration Error!</strong>
            <p className="block sm:inline mt-2">Could not connect to Supabase. Please open <code>supabaseClient.ts</code> and replace the placeholder credentials with your actual Supabase URL and Anon Key.</p>
        </div>
      </div>
    );
  }

  const getOrCreateMentorProfile = useCallback(async (user: User): Promise<{ profile: Mentor | null, error: string | null }> => {
    if (!supabaseClient) return { profile: null, error: "Supabase client not initialized." };
  
    try {
      // 1. Try to fetch existing profile with timeout
      const selectQuery = supabaseClient
        .from('mentors')
        .select('*')
        .eq('id', user.id)
        .single();

      const { data: existingProfile, error: selectError } = await withTimeout(selectQuery, 30000, 'Fetching profile timed out.');

      if (selectError && selectError.code !== 'PGRST116') { // PGRST116: No rows found
        const message = `Failed to fetch your profile. This is often caused by a Row Level Security (RLS) policy in Supabase. Please ensure authenticated users have SELECT permission on the 'mentors' table for their own record.\n\nDetails: ${selectError.message}`;
        console.error("Error fetching mentor profile:", selectError);
        return { profile: null, error: message };
      }
  
      if (existingProfile) {
        return { profile: existingProfile, error: null };
      }
  
      // 2. If no profile, try to create one with timeout
      let profileName = user.email || 'New Mentor';
      if (user.user_metadata?.role !== 'admin' && profileName.endsWith('@review.app')) {
        profileName = profileName.replace('@review.app', '');
      }
  
      const insertQuery = supabaseClient
        .from('mentors')
        .insert({
          id: user.id,
          name: profileName,
          isInternal: user.user_metadata?.role === 'admin'
        })
        .select()
        .single();
      
      const { data: newProfile, error: insertError } = await withTimeout(insertQuery, 30000, 'Creating profile timed out.');
      
      if (insertError) {
        const message = `Failed to create your profile after login. This is often caused by a Row Level Security (RLS) policy. Please ensure authenticated users have INSERT permission on the 'mentors' table.\n\nDetails: ${insertError.message}`;
        console.error("Error creating mentor profile:", insertError);
        return { profile: null, error: message };
      }
  
      return { profile: newProfile, error: null };

    } catch (e: any) {
      const message = `A network error occurred while accessing your profile. Please check your internet connection and refresh the page.\n\nDetails: ${e.message}`;
      console.error("Error in getOrCreateMentorProfile:", e);
      return { profile: null, error: message };
    }
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (authLoading) {
      // After 4 seconds, show a more informative message.
      timer = setTimeout(() => {
        setLongLoadMessage("Waking up the database... This can take up to 30 seconds if the app has been inactive.");
      }, 4000);
    } else {
      // If loading finishes, clear the message.
      setLongLoadMessage(null);
    }
    return () => clearTimeout(timer);
  }, [authLoading]);

  useEffect(() => {
    const authTimeout = setTimeout(() => {
      if (!initialAuthCheckCompleted.current) {
        setAuthLoading(false);
        showToast({
          message: "Authentication timed out. Please check your network and refresh.",
          type: 'error',
        });
      }
    }, 10000);

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(async (_event, session) => {
      clearTimeout(authTimeout);
      setProfileError(null);
      try {
        if (session?.user) {
          // Immediately set basic auth state and end the blocking loading UI
          setCurrentUser({ session, user: session.user, profile: null });
          if (!initialAuthCheckCompleted.current) {
            setAuthLoading(false);
            initialAuthCheckCompleted.current = true;
          }

          // Fetch/create mentor profile in the background
          (async () => {
            const { profile, error } = await getOrCreateMentorProfile(session.user);
            if (error) {
              setProfileError(error);
            }
            setCurrentUser(prev => {
              if (!prev) return prev;
              if (prev.user.id !== session.user.id) return prev;
              return { ...prev, profile } as CurrentUser;
            });
          })();
        } else {
          setCurrentUser(null);
          setSelectedTeamId(null);
          setView('dashboard');
          setIsLoggingOut(false);
        }
      } catch (error) {
        console.error("Error during auth state change:", error);
        const errorMessage = `An unexpected authentication error occurred: ${error instanceof Error ? error.message : String(error)}`;
        setProfileError(errorMessage);
        setCurrentUser(null);
      } finally {
        if (!initialAuthCheckCompleted.current) {
          setAuthLoading(false);
          initialAuthCheckCompleted.current = true;
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(authTimeout);
    };
  }, [getOrCreateMentorProfile, showToast]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && supabaseClient) {
        supabaseClient.auth.getSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, []);

  const {
    reviews,
    teams,
    mentors,
    saveReviewUpdate,
    getReviewsForMentor,
    leaderboardData,
    mentorProgressData,
    adminCommentsData,
    isLoading: isDataLoading,
    error,
    addTeam,
    assignMentorToTeam,
    unassignMentorFromTeam
  } = useAppData(currentUser?.user || null, showToast);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    if (!supabaseClient) {
        setIsLoggingOut(false);
        return;
    }

    const logoutPromise = supabaseClient.auth.signOut();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Logout timed out')), 15000)
    );

    try {
      const { error } = await Promise.race([logoutPromise, timeoutPromise]) as { error: Error | null };
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error logging out:', error);
      showToast({
        message: `Logout failed or timed out. Redirecting to login screen.`,
        type: 'error'
      });
      
      setCurrentUser(null);
      setSelectedTeamId(null);
      setView('dashboard');
      setIsLoggingOut(false);
    }
  };

  const handleSelectTeam = (teamId: string) => {
    setSelectedTeamId(teamId);
    setView('review');
  };
  
  const handleBackToDashboard = () => {
    setSelectedTeamId(null);
    setView('dashboard');
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
            <div className="text-2xl font-semibold text-slate-700 animate-pulse">Authenticating...</div>
            {longLoadMessage && (
                <p className="mt-4 text-slate-500 max-w-sm">{longLoadMessage}</p>
            )}
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen />;
  }
  
  const isAdmin = currentUser.user.user_metadata?.role === 'admin';
  const selectedTeam = teams.find(t => t.id === selectedTeamId);
  const selectedReview = selectedTeamId ? reviews.find(r => r.teamId === selectedTeamId && r.mentorId === currentUser.user.id) : undefined;
  
  const renderContent = () => {
    if (isDataLoading) {
        return <DashboardSkeleton isAdmin={isAdmin} />;
    }

    if (profileError) {
        return (
            <div className="text-center bg-white p-12 rounded-xl shadow-md border border-red-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="mt-4 text-xl font-semibold text-slate-800">Authentication Error</h3>
                <p className="mt-3 text-slate-700 max-w-3xl mx-auto text-left whitespace-pre-wrap font-mono bg-red-50 p-4 rounded-md border border-red-200">
                  {profileError}
                </p>
                <p className="mt-4 text-sm text-slate-500">
                    You are successfully logged in, but the application cannot continue until this is resolved. 
                    If you are not the administrator, please forward this message to them.
                </p>
            </div>
        );
    }

    if(error) {
        return <div className="text-center text-red-500 bg-red-100 p-4 rounded-md">{error}</div>;
    }

    if (isAdmin) {
      return (
        <AdminDashboard
          leaderboardData={leaderboardData}
          mentorProgressData={mentorProgressData}
          adminCommentsData={adminCommentsData}
          teams={teams}
          mentors={mentors}
          reviews={reviews}
          onAddTeam={addTeam}
          onAssignMentor={assignMentorToTeam}
          onUnassignMentor={unassignMentorFromTeam}
        />
      );
    }
    
    // Mentor View
    switch (view) {
      case 'review':
        if (selectedTeam && selectedReview && currentUser.profile) {
          return (
            <ReviewForm
              team={selectedTeam}
              review={selectedReview}
              criteria={CRITERIA}
              onBack={handleBackToDashboard}
              onSaveReview={(scores, isCompleted, comment) => saveReviewUpdate(selectedReview.id, scores, isCompleted, comment)}
            />
          );
        }
        handleBackToDashboard();
        return null;
      
      case 'dashboard':
      default:
        if (currentUser.profile) {
            return (
                <MentorDashboard
                mentor={currentUser.profile}
                reviews={getReviewsForMentor(currentUser.user.id)}
                teams={teams}
                onSelectTeam={(team) => handleSelectTeam(team.id)}
                />
            );
        }
        // If profile is null but no error, it means it's still being processed
        // or there was another issue. A skeleton is a safe fallback.
        return <DashboardSkeleton isAdmin={false} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900">Policy Proposal Review</h1>
          <div className="flex items-center space-x-4">
            <span className="text-slate-600">Welcome, {currentUser.profile?.name || currentUser.user.email}</span>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-md transition duration-200 disabled:bg-red-300 disabled:cursor-wait"
            >
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {renderContent()}
      </main>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default App;
