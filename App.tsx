
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAppData } from './hooks/useAppData';
import type { CurrentUser } from './types';
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

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
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

  const getOrCreateMentorProfile = useCallback(async (user: User) => {
    if (!supabaseClient) return null;
    const { data: existingProfile, error: selectError } = await supabaseClient
      .from('mentors')
      .select('*')
      .eq('id', user.id)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error("Error fetching mentor profile:", selectError);
      return null;
    }
    if (existingProfile) return existingProfile;

    let profileName = user.email || 'New Mentor';
    if (user.user_metadata?.role !== 'admin' && profileName.endsWith('@review.app')) {
      profileName = profileName.replace('@review.app', '');
    }

    const { data: newProfile, error: insertError } = await supabaseClient
      .from('mentors')
      .insert({
        id: user.id,
        name: profileName,
        isInternal: user.user_metadata?.role === 'admin'
      })
      .select()
      .single();
    
    if (insertError) {
      console.error("Error creating mentor profile:", insertError);
      return null;
    }
    return newProfile;
  }, []);

  useEffect(() => {
    // This effect should only run once to set up the auth subscription.
    // The authLoading state is managed internally and should not be a dependency.
    const authTimeout = setTimeout(() => {
      // The check on initialAuthCheckCompleted prevents this from firing
      // if the auth state has already been successfully determined.
      if (!initialAuthCheckCompleted.current) {
        setAuthLoading(false);
        showToast({
          message: "Authentication timed out. Please check your network and refresh.",
          type: 'error',
        });
      }
    }, 10000); // 10-second timeout

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(async (_event, session) => {
      clearTimeout(authTimeout);
      try {
        if (session?.user) {
          const profile = await getOrCreateMentorProfile(session.user);
          // Always set the user; the profile can be null if fetching/creation failed.
          setCurrentUser({ session, user: session.user, profile });
          
          if (!profile) {
            // This toast informs the user of the problem without logging them out.
            showToast({ message: "Could not load mentor profile. You may not have permission to view your data.", type: 'error' });
          }
        } else {
          // Handles SIGNED_OUT events and initial state if no session.
          setCurrentUser(null);
          setSelectedTeamId(null);
          setView('dashboard');
          setIsLoggingOut(false);
        }
      } catch (error) {
        console.error("Error during auth state change:", error);
        showToast({ message: `Authentication error: ${error instanceof Error ? error.message : String(error)}`, type: 'error' });
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

  // Proactively check session when the tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && supabaseClient) {
        // This helps refresh the token or detect an expired session
        // after the computer has been asleep or the tab was in the background.
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
    updateScore,
    toggleCompleteStatus,
    getReviewsForMentor,
    getLeaderboardData,
    getMentorProgressData,
    isLoading: isDataLoading,
    error,
    addTeam,
    assignMentorToTeam,
    unassignMentorFromTeam
  } = useAppData(currentUser, showToast);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    if (!supabaseClient) {
        setIsLoggingOut(false);
        return;
    }

    // Race signOut against a timeout to prevent getting stuck
    const logoutPromise = supabaseClient.auth.signOut();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Logout timed out')), 5000) // 5-second timeout
    );

    try {
      const { error } = await Promise.race([logoutPromise, timeoutPromise]) as { error: Error | null };
      if (error) {
        throw error; // Throw to be caught by the catch block
      }
      // On success, onAuthStateChange will handle the state change to logged-out.
      // The listener will also set isLoggingOut to false.
    } catch (error) {
      console.error('Error logging out:', error);
      showToast({
        message: `Logout failed or timed out. Redirecting to login screen.`,
        type: 'error'
      });
      
      // IMPORTANT: Even on failure/timeout, we must transition the user to a logged-out state
      // on the client to prevent them from being stuck.
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl font-semibold text-slate-700 animate-pulse">Authenticating...</div>
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
    if(error) {
        return <div className="text-center text-red-500 bg-red-100 p-4 rounded-md">{error}</div>;
    }

    if (isAdmin) {
      return (
        <AdminDashboard
          leaderboardData={getLeaderboardData()}
          mentorProgressData={getMentorProgressData()}
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
              onUpdateScore={(criterionId, score) => updateScore(selectedReview.id, criterionId, score)}
              onToggleComplete={() => toggleCompleteStatus(selectedReview.id)}
            />
          );
        }
        // Fallback to dashboard if something is wrong
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
        return (
            <div className="text-center bg-white p-12 rounded-xl shadow-md border border-red-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="mt-4 text-xl font-semibold text-slate-800">Profile Error</h3>
                <p className="mt-2 text-slate-500 max-w-lg mx-auto">
                    We couldn't load your mentor profile. This is likely due to a permissions issue. 
                    Please ensure that your Supabase Row Level Security (RLS) policies allow authenticated users to read and create their own profile in the <code className="bg-slate-200 text-sm p-1 rounded">mentors</code> table.
                </p>
                <p className="mt-4 text-sm text-slate-400">
                    If you are not the administrator, please contact them for assistance.
                </p>
            </div>
        );
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
