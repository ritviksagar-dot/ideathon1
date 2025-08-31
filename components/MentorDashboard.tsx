// --- START OF FILE: src/components/MentorDashboard.tsx ---
import React from 'react';
import type { Review, Team } from '../types';
import { SCORING_RUBRIC_URL, PROPOSAL_GUIDELINES_URL, CRITERIA } from '../constants';

interface MentorDashboardProps {
  assignedReviews: Review[];
  teams: Team[];
  onSelectReview: (review: Review) => void;
}

const MentorDashboard: React.FC<MentorDashboardProps> = ({ assignedReviews, teams, onSelectReview }) => {
  if (assignedReviews.length === 0) {
    return (
      <div className="text-center p-8 bg-white rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-slate-800">No Proposals Assigned</h2>
        <p className="mt-2 text-slate-600">You do not have any proposals to review at this time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Your Assigned Proposals</h1>
      
      {/* Scoring Rubric and Guidelines Section */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h2 className="text-xl font-bold text-blue-800 mb-4">Review Guidelines & Scoring Rubric</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-3">Quick Reference Links</h3>
            <div className="space-y-2">
              <a
                href={SCORING_RUBRIC_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition mr-3"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 14H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                Scoring Rubric
              </a>
              <a
                href={PROPOSAL_GUIDELINES_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 14H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                Policy Guidelines
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-3">Scoring Criteria</h3>
            <div className="space-y-2 text-sm">
              {CRITERIA.map(criterion => (
                <div key={criterion.id} className="flex justify-between items-center bg-white px-3 py-2 rounded border">
                  <span className="font-medium text-slate-700">{criterion.name}</span>
                  <span className="text-blue-600 font-semibold">{(criterion.weight * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-blue-200">
          <h4 className="font-semibold text-slate-800 mb-2">Important Reminders:</h4>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>• All scores (1-5) and comments are <strong>required</strong> before submission</li>
            <li>• Use the scoring rubric to ensure consistent evaluation</li>
            <li>• Provide detailed feedback in comments to help teams improve</li>
            <li>• Review the policy guidelines to understand evaluation criteria</li>
          </ul>
        </div>
      </div>
      {assignedReviews.map(review => {
        const team = teams.find(t => t.id === review.teamId);
        if (!team) {
          console.warn(`Data integrity issue: Review ID ${review.id} references non-existent teamId '${review.teamId}'.`);
          return null;
        }

        return (
          <div key={review.id} className="bg-white rounded-xl shadow-md p-6 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800">{team.candidate_id}</h3>
              <p className={`mt-2 text-sm font-semibold ${review.isCompleted ? 'text-green-600' : 'text-yellow-600'}`}>
                Status: {review.isCompleted ? 'Completed' : 'Pending Review'}
              </p>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto flex-shrink-0">
              {team.proposal_link && (
                <a href={team.proposal_link} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto text-center px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-md border border-slate-300 hover:bg-slate-200 transition">
                  View Proposal
                </a>
              )}
              <button onClick={() => onSelectReview(review)} className="w-full sm:w-auto text-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition">
                {review.isCompleted ? 'Edit Review' : 'Start Review'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MentorDashboard;
// --- END OF FILE: src/components/MentorDashboard.tsx ---