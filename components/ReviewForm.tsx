
import React, { useMemo, useState } from 'react';
import type { Team, Review, Criterion, CriterionScore } from '../types';
import Modal from './Modal';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { SCORING_RUBRIC_URL } from '../constants';

interface ReviewFormProps {
  team: Team;
  review: Review;
  criteria: Criterion[];
  onBack: () => void;
  onUpdateScore: (criterionId: string, score: number | null) => void;
  onToggleComplete: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ team, review, criteria, onBack, onUpdateScore, onToggleComplete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleScoreChange = (criterionId: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (value === '') {
        onUpdateScore(criterionId, null);
    } else if (!isNaN(numValue) && numValue >= 1 && numValue <= 5) {
      onUpdateScore(criterionId, numValue);
    }
  };

  const weightedTotal = useMemo(() => {
    const total = review.scores.reduce((acc, scoreItem) => {
      const criterion = criteria.find(c => c.id === scoreItem.criterionId);
      if (criterion && scoreItem.score !== null) {
        return acc + scoreItem.score * criterion.weight;
      }
      return acc;
    }, 0);
    return total.toFixed(2);
  }, [review.scores, criteria]);

  const allScoresProvided = review.scores.every(s => s.score !== null);

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-6 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-2 px-4 rounded-md transition duration-200 flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Back to Dashboard
      </button>

      <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200">
        <div className="flex justify-between items-start mb-2">
            <div>
                <h2 className="text-3xl font-bold text-slate-900">Reviewing Proposal {team.id}</h2>
                <p className="text-slate-500 mt-1">Grade each criterion on a scale of 1 to 5.</p>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
                <a
                    href={SCORING_RUBRIC_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-slate-200 text-slate-800 hover:bg-slate-300 font-semibold py-2 px-4 rounded-md transition duration-200 flex items-center text-sm"
                >
                    <DocumentTextIcon className="h-5 w-5 mr-2" />
                    Scoring Rubric
                </a>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-100 text-blue-800 hover:bg-blue-200 font-semibold py-2 px-4 rounded-md transition duration-200 flex items-center text-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2-2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                    View Proposal
                </button>
            </div>
        </div>
        <div className="mb-8 mt-4 border-t border-slate-200"></div>
        
        <div className="space-y-6">
          {criteria.map(c => {
            const scoreValue = review.scores.find(s => s.criterionId === c.id)?.score;
            return (
              <div key={c.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <label htmlFor={`score-${c.id}`} className="font-semibold text-slate-700 md:col-span-2">
                  {c.name}
                  <span className="ml-2 text-sm text-slate-500 font-normal">({(c.weight * 100).toFixed(0)}% weight)</span>
                </label>
                <select
                  id={`score-${c.id}`}
                  value={scoreValue === null || scoreValue === undefined ? '' : scoreValue}
                  onChange={e => handleScoreChange(c.id, e.target.value)}
                  className="w-full md:w-48 px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                  aria-label={`Score for ${c.name}`}
                >
                  <option value="" disabled>-- Select a score --</option>
                  <option value="1">1 - Poor</option>
                  <option value="2">2 - Fair</option>
                  <option value="3">3 - Good</option>
                  <option value="4">4 - Very Good</option>
                  <option value="5">5 - Excellent</option>
                </select>
              </div>
            );
          })}
        </div>

        <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-xl font-bold text-slate-800">
            Total Weighted Score: <span className="text-blue-600">{weightedTotal} / 5.00</span>
          </div>
          <button
            onClick={onToggleComplete}
            disabled={!allScoresProvided}
            className={`w-full sm:w-auto px-6 py-3 font-bold rounded-md transition duration-200 ${
              review.isCompleted 
                ? 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            } disabled:bg-slate-300 disabled:cursor-not-allowed disabled:text-slate-500`}
            title={!allScoresProvided ? "Please provide a score for all criteria first" : ""}
          >
            {review.isCompleted ? 'Mark as In-Progress' : 'Mark as Complete'}
          </button>
        </div>
      </div>
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={`Proposal: ${team.id}`}>
        <div className="text-slate-600 whitespace-pre-wrap">
            {team.proposalDetails}
        </div>
      </Modal>
    </div>
  );
};

export default ReviewForm;