
import React from 'react';
import type { Mentor, Review, Team } from '../types';
import { CheckIcon } from './icons/CheckIcon';
import { PencilIcon } from './icons/PencilIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { SCORING_RUBRIC_URL } from '../constants';

interface MentorDashboardProps {
  mentor: Mentor;
  reviews: Review[];
  teams: Team[];
  onSelectTeam: (team: Team) => void;
}

const MentorDashboard: React.FC<MentorDashboardProps> = ({ mentor, reviews, teams, onSelectTeam }) => {
  const getTeamById = (id: string) => teams.find(t => t.id === id);

  if (reviews.length === 0) {
    return (
      <div className="text-center bg-white p-12 rounded-xl shadow-md border border-slate-200">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
        <h3 className="mt-4 text-xl font-semibold text-slate-800">No Proposals Assigned Yet</h3>
        <p className="mt-2 text-slate-500">
          Your dashboard is ready. As soon as the administrator generates the review assignments, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-slate-800">Your Assigned Proposals</h2>
        <a
          href={SCORING_RUBRIC_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-2 px-4 rounded-md transition duration-200 flex items-center"
        >
          <DocumentTextIcon className="h-5 w-5 mr-2" />
          View Scoring Rubric
        </a>
      </div>
      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <ul className="divide-y divide-slate-200">
          {reviews.map(review => {
            const team = getTeamById(review.teamId);
            if (!team) return null;

            return (
              <li key={review.teamId} className="p-4 sm:p-6 hover:bg-slate-50 transition duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`mr-4 p-2 rounded-full ${review.isCompleted ? 'bg-green-100' : 'bg-slate-200'}`}>
                      {review.isCompleted ? (
                        <CheckIcon className="h-6 w-6 text-green-600" />
                      ) : (
                        <PencilIcon className="h-6 w-6 text-slate-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{team.id}</p>
                      <p className={`text-sm font-medium ${review.isCompleted ? 'text-green-700' : 'text-slate-500'}`}>
                        Status: {review.isCompleted ? 'Completed' : 'Pending Review'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onSelectTeam(team)}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-5 rounded-md shadow-sm transition duration-200"
                  >
                    {review.isCompleted ? 'Edit Review' : 'Start Review'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default MentorDashboard;