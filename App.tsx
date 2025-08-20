
import React, { useState, useEffect, useCallback } from 'react';
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
    setAuthLoading(true);

    const checkInitialSession = async () => {
      try {
        // The aggressive custom timeout was removed to rely on the Supabase client's
        // own network handling. This prevents premature timeouts on slow connections
        // and provides more specific error messages from the library itself.
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }
        
        if (session?.user) {
          const profile = await getOrCreateMentorProfile(session.user);
          if (profile) {
            setCurrentUser({ session, user: session.user, profile });
          } else {
            await supabaseClient.auth.signOut();
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("Error checking initial session:", error);
        showToast({ message: `Authentication failed: ${error instanceof Error ? error.message : String(error)}`, type: 'error' });
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    checkInitialSession();

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(async (_event, session) => {
        const user = session?.user ?? null;
        if (user) {
            const profile = await getOrCreateMentorProfile(user);
            setCurrentUser(profile ? { session: session!, user, profile } : null);
        } else {
            setCurrentUser(null);
        }
    });

    return () => subscription.unsubscribe();
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
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
      // Directly update state for a responsive UI instead of waiting for the listener.
      setCurrentUser(null);
      setSelectedTeamId(null);
      setView('dashboard');
    } catch (error) {
       console.error('Error logging out:', error);
       showToast({
         message: `Logout failed: ${error instanceof Error ? error.message : 'Please check your connection.'}`,
         type: 'error'
       });
    } finally {
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
        return <div>Your profile is being created. Please refresh in a moment.</div>;
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
