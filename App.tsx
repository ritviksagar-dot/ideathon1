import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useAppData } from './hooks/useAppData';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './components/AdminDashboard';
import MentorDashboard from './components/MentorDashboard';
import ReviewForm from './components/ReviewForm';
import MainLayout from './components/MainLayout';
import DashboardSkeleton from './components/DashboardSkeleton';
import Toast from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import { CRITERIA } from './constants';
import type { Review, CriterionScore, ToastData } from './types';

const AuthLoadingScreen = () => (
  <div className="flex items-center justify-center h-screen bg-slate-50">
    <p className="text-xl font-semibold text-slate-700">Connecting...</p>
  </div>
);

const AuthenticatedApp = () => {
  const { user } = useAuth();
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [currentToast, setCurrentToast] = useState<ToastData | null>(null);
  
  const showToast = (data: ToastData) => {
    setCurrentToast(data);
  };

  const handleCloseToast = () => {
    setCurrentToast(null);
  };

  const appData = useAppData(user, showToast);

  const handleSelectReview = (review: Review) => setSelectedReview(review);
  const handleBackToDashboard = () => setSelectedReview(null);
  
  const handleSaveReview = async (scores: CriterionScore[], isCompleted: boolean, comment: string) => {
    if (!selectedReview) return false;
    const success = await appData.saveReviewUpdate(selectedReview.id, scores, isCompleted, comment);
    if (success) {
      handleBackToDashboard();
    }
    return success;
  };

  if (appData.isLoading) {
    return <DashboardSkeleton isAdmin={appData.profile?.isInternal || false} />;
  }

  if (appData.error) {
    return (
      <div className="flex items-center justify-center h-screen bg-red-50 p-4 text-center">
        <div>
          <h2 className="text-2xl font-bold text-red-800">Error Loading Data</h2>
          <p className="mt-2 text-slate-700">{appData.error}</p>
          <button onClick={() => window.location.reload()} className="mt-6 px-5 py-2 bg-blue-600 text-white rounded-md">Refresh Page</button>
        </div>
      </div>
    );
  }

  const isAdmin = appData.profile?.isInternal === true;

  // Find team safely for selected review
  const selectedTeam = selectedReview ? appData.teams.find(t => t.id === selectedReview.teamId) : null;
  
  // If we have a selected review but can't find the team, show error
  if (selectedReview && !selectedTeam) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64 bg-red-50 p-4 text-center rounded-xl">
          <div>
            <h2 className="text-xl font-bold text-red-800">Data Error</h2>
            <p className="mt-2 text-slate-700">Cannot find team data for this review.</p>
            <button 
              onClick={handleBackToDashboard}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <>
      <ErrorBoundary>
        <MainLayout>
          {selectedReview && !isAdmin ? (
            <ErrorBoundary>
              <ReviewForm
                review={selectedReview}
                team={selectedTeam} 
                criteria={CRITERIA}
                onBack={handleBackToDashboard}
                onSaveReview={handleSaveReview}
              />
            </ErrorBoundary>
          ) : isAdmin ? (
            <ErrorBoundary>
              <AdminDashboard
                leaderboardData={appData.leaderboardData}
                mentorProgressData={appData.mentorProgressData}
                adminCommentsData={appData.adminCommentsData}
                exportRankingsToCSV={appData.exportRankingsToCSV}
                exportCommentsToCSV={appData.exportCommentsToCSV}
              />
            </ErrorBoundary>
          ) : (
            <ErrorBoundary>
              <MentorDashboard
                assignedReviews={appData.getReviewsForMentor(user!.id)}
                teams={appData.teams}
                onSelectReview={handleSelectReview}
              />
            </ErrorBoundary>
          )}
        </MainLayout>
      </ErrorBoundary>
      <Toast toast={currentToast} onClose={handleCloseToast} />
    </>
  );
};

const AppContent = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  if (isAuthLoading) return <AuthLoadingScreen />;
  return user ? <AuthenticatedApp /> : <LoginPage />;
};

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
