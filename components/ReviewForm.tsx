
import React, { useMemo, useState, useEffect } from 'react';
import type { Team, Review, Criterion, CriterionScore } from '../types';
import Modal from './Modal';

interface ReviewFormProps {
  team: Team;
  review: Review;
  criteria: Criterion[];
  onBack: () => void;
  onSaveReview: (scores: CriterionScore[], isCompleted: boolean, comment: string) => Promise<any>;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ team, review, criteria, onBack, onSaveReview }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localScores, setLocalScores] = useState<CriterionScore[]>(review.scores);
  const [comment, setComment] = useState(review.comment || '');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // When parent data changes (e.g., after a save), reset local state.
  useEffect(() => {
    setLocalScores(review.scores);
    setComment(review.comment || '');
    setIsDirty(false);
  }, [review]);

  const handleScoreChange = (criterionId: string, value: string) => {
    const numValue = parseInt(value, 10);
    let newScore: number | null = null;
    
    // Only parse valid numbers within the 1-5 range, otherwise treat as null.
    if (value !== '' && !isNaN(numValue) && numValue >= 1 && numValue <= 5) {
      newScore = numValue;
    }
    
    setLocalScores(prevScores => 
        prevScores.map(s => s.criterionId === criterionId ? { ...s, score: newScore } : s)
    );
    setIsDirty(true);
  };

  const weightedTotal = useMemo(() => {
    const total = localScores.reduce((acc, scoreItem) => {
      const criterion = criteria.find(c => c.id === scoreItem.criterionId);
      if (criterion && scoreItem.score !== null) {
        return acc + scoreItem.score * criterion.weight;
      }
      return acc;
    }, 0);
    return total.toFixed(2);
  }, [localScores, criteria]);

  const allScoresProvided = localScores.every(s => s.score !== null);
  
  const handleSubmit = async (isComplete: boolean) => {
    setIsSaving(true);
    try {
        await onSaveReview(localScores, isComplete, comment);
    } catch(e) {
        console.error("Error submitting review", e);
        // The data hook will show a toast error message
    } finally {
        setIsSaving(false);
    }
  };

  const renderSubmitButton = () => {
    if (isSaving) {
        return (
            <button
              disabled
              className="w-full sm:w-auto px-6 py-3 font-bold rounded-md transition duration-200 bg-slate-400 text-white flex items-center justify-center cursor-wait"
            >
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </button>
        );
    }
      
    // Case 1: Review is not yet completed.
    if (!review.isCompleted) {
      return (
        <button
          onClick={() => handleSubmit(true)}
          disabled={!allScoresProvided}
          className="w-full sm:w-auto px-6 py-3 font-bold rounded-md transition duration-200 bg-green-500 hover:bg-green-600 text-white disabled:bg-slate-300 disabled:cursor-not-allowed disabled:text-slate-500"
          title={!allScoresProvided ? "Please provide a score for all criteria first" : ""}
        >
          Mark as Complete
        </button>
      );
    }

    // Case 2: Review is completed, but has been modified locally.
    if (isDirty) {
      return (
        <button
          onClick={() => handleSubmit(true)}
          disabled={!allScoresProvided}
          className="w-full sm:w-auto px-6 py-3 font-bold rounded-md transition duration-200 bg-blue-500 hover:bg-blue-600 text-white disabled:bg-slate-300 disabled:cursor-not-allowed disabled:text-slate-500"
          title={!allScoresProvided ? "Cannot submit changes with missing scores" : "Submit your changes"}
        >
          Submit Changes
        </button>
      );
    }
    
    // Case 3: Review is completed and no local changes have been made.
    return (
        <div className="flex items-center gap-2 px-6 py-3 font-bold rounded-md bg-green-100 text-green-800 select-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>Submitted</span>
        </div>
    );
  };

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
            const scoreValue = localScores.find(s => s.criterionId === c.id)?.score;
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
        
        <div className="mt-8 pt-6 border-t border-slate-200">
            <label htmlFor="comment" className="block text-lg font-semibold text-slate-700 mb-2">
                Comments & Rationale
            </label>
            <p className="text-sm text-slate-500 mb-3">
                Optionally, explain the reasoning for your scores. This feedback is valuable for the review committee.
            </p>
            <textarea
                id="comment"
                value={comment}
                onChange={e => {
                    setComment(e.target.value);
                    setIsDirty(true);
                }}
                rows={5}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                placeholder="e.g., The proposal clearly identified the problem but the implementation plan lacked specific details..."
            />
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-xl font-bold text-slate-800">
            Total Weighted Score: <span className="text-blue-600">{weightedTotal} / 5.00</span>
          </div>
          {renderSubmitButton()}
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
