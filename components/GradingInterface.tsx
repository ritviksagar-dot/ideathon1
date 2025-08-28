import React from 'react';
import { PROPOSAL_GUIDELINES_URL } from '../constants';
import type { Review, Team } from '../types';

interface GradingInterfaceProps {
  review: Review;
  team: Team;
  onSaveChanges: () => void;
}

const GradingInterface: React.FC<GradingInterfaceProps> = ({ review, team, onSaveChanges }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Grading: {team.candidate_id}</h2>
          <p className="text-slate-500 mt-1">Use the rubric below to score the proposal.</p>
        </div>

        <a
          href={PROPOSAL_GUIDELINES_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-white text-blue-600 font-semibold rounded-md border border-blue-200 hover:bg-blue-50 transition"
        >
          Proposal Guidelines
        </a>
      </div>

      <div className="p-8 bg-slate-50 rounded-lg">
        <p className="text-center text-slate-600">[Your Scoring Rubric UI]</p>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={onSaveChanges}
          className="px-6 py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700"
        >
          Save Review
        </button>
      </div>
    </div>
  );
};

export default GradingInterface;

