
import React, { useState } from 'react';
import type { LeaderboardEntry, MentorProgress, Team, Mentor, Review, AdminCommentData } from '../types';
import Modal from './Modal';

interface AdminDashboardProps {
  leaderboardData: LeaderboardEntry[];
  mentorProgressData: MentorProgress[];
  adminCommentsData: AdminCommentData[];
  teams: Team[];
  mentors: Mentor[];
  reviews: Review[];
  onAddTeam: (team: Omit<Team, 'proposalDetails'> & { proposalDetails: string }) => Promise<Team | null>;
  onAssignMentor: (teamId: string, mentorId: string) => void;
  onUnassignMentor: (reviewId: number) => void;
}

type Tab = 'leaderboard' | 'mentors' | 'comments' | 'data';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ leaderboardData, mentorProgressData, adminCommentsData, teams, mentors, reviews, onAddTeam, onAssignMentor, onUnassignMentor }) => {
  const [activeTab, setActiveTab] = useState<Tab>('leaderboard');

  const renderLeaderboard = () => (
     <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Rank</th>
            <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Team Name</th>
            <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider text-center">Avg. Weighted Score</th>
            <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider text-center">Reviews Completed</th>
            <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Completed Reviewers & Scores</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {leaderboardData.map((entry) => (
            <tr key={entry.team.id} className="hover:bg-slate-50 transition">
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="font-bold text-lg text-slate-700">{entry.rank}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="font-semibold text-slate-800">{entry.team.name}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <span className={`px-3 py-1 text-sm font-bold rounded-full ${entry.averageScore > 3.5 ? 'bg-green-100 text-green-800' : entry.averageScore > 2 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                  {entry.averageScore.toFixed(2)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="text-slate-600">{entry.completedReviews} / {entry.totalReviews}</span>
              </td>
              <td className="px-6 py-4">
                {entry.reviewers.length > 0 ? (
                  <ul className="text-sm text-slate-600 space-y-1">
                    {entry.reviewers.map((reviewer, idx) => (
                      <li key={idx}>
                        {reviewer.name}: <span className="font-semibold">{reviewer.score.toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-sm text-slate-400 italic">No completed reviews yet</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderMentorProgress = () => (
     <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Mentor Name</th>
            <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider text-center">Completed Reviews</th>
            <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider w-1/3">Progress</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {mentorProgressData.map(({ mentor, completedReviews, totalReviews }) => {
            const progress = totalReviews > 0 ? (completedReviews / totalReviews) * 100 : 0;
            return (
              <tr key={mentor.id} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-semibold text-slate-800">{mentor.name}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="text-slate-600">{completedReviews} / {totalReviews}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-full bg-slate-200 rounded-full h-4 mr-4">
                      <div
                        className="bg-blue-600 h-4 rounded-full"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-slate-600 w-12 text-right">{progress.toFixed(0)}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
  
    const renderReviewerComments = () => {
    // Find the maximum number of comments for any team to create the table headers
    const maxComments = Math.max(0, ...adminCommentsData.map(d => d.comments.length));

    return (
        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Rank</th>
                        <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Team Name</th>
                        {/* Dynamically create a header for each potential reviewer */}
                        {Array.from({ length: maxComments }).map((_, i) => (
                            <th key={i} className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{`Reviewer ${i + 1} Comments`}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {adminCommentsData.map(entry => (
                        <tr key={entry.team.id} className="hover:bg-slate-50 transition">
                            <td className="px-6 py-4 whitespace-nowrap align-top">
                                <span className="font-bold text-lg text-slate-700">{entry.rank}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap align-top">
                                <span className="font-semibold text-slate-800">{entry.team.name}</span>
                            </td>
                            {/* Fill in comments for each reviewer, or leave blank */}
                            {Array.from({ length: maxComments }).map((_, i) => {
                                const commentData = entry.comments[i];
                                return (
                                    <td key={i} className="px-6 py-4 align-top text-sm text-slate-600">
                                        {commentData ? (
                                            <div>
                                                <p className="font-semibold text-slate-800">{commentData.mentorName}</p>
                                                <p className="mt-1 whitespace-pre-wrap">{commentData.comment || <span className="italic text-slate-400">No comment provided.</span>}</p>
                                            </div>
                                        ) : (
                                            <span className="italic text-slate-400">--</span>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
  };
  
  const ManageData = () => {
    const [selectedMentor, setSelectedMentor] = useState<{ [teamId: string]: string }>({});
    const [reviewToUnassign, setReviewToUnassign] = useState<Review | null>(null);

    const handleSelectMentor = (teamId: string, mentorId: string) => {
      setSelectedMentor(prev => ({ ...prev, [teamId]: mentorId }));
    };

    const handleAssign = (teamId: string) => {
        const mentorId = selectedMentor[teamId];
        if (!mentorId) {
            alert("Please select a mentor to assign.");
            return;
        }
        onAssignMentor(teamId, mentorId);
        setSelectedMentor(prev => ({ ...prev, [teamId]: '' }));
    };

    const handleConfirmUnassign = () => {
        if (reviewToUnassign) {
            onUnassignMentor(reviewToUnassign.id);
            setReviewToUnassign(null);
        }
    };

    return (
      <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Instructions */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
                <h3 className="text-xl font-bold mb-2">Data Management</h3>
                <p className="text-sm text-slate-600">
                    The primary method for adding and assigning teams is now via CSV import in your Supabase dashboard for consistency and bulk management.
                </p>
                <p className="mt-4 text-sm text-slate-600">
                    Use the panel on the right only for minor edits or corrections to mentor assignments.
                </p>
            </div>
          </div>
          
          {/* Right Column: Assignment Management (Unchanged) */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md border border-slate-200 p-6">
              <h3 className="text-xl font-bold mb-4">Assign & Unassign Reviewers</h3>
              <div className="space-y-6">
                {teams.length > 0 ? teams.map(team => {
                    const assignedReviews = reviews.filter(r => r.teamId === team.id);
                    const assignedMentorIds = new Set(assignedReviews.map(r => r.mentorId));
                    const unassignedMentors = mentors.filter(m => !assignedMentorIds.has(m.id));

                    return (
                        <div key={team.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50/50">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold text-slate-800">{team.name}</h4>
                                {team.proposal_link && (
                                    <a
                                        href={team.proposal_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-1 bg-slate-200 text-slate-800 text-sm font-semibold rounded-md hover:bg-slate-300 transition"
                                    >
                                        View Proposal
                                    </a>
                                )}
                            </div>
                            
                            <div className="mt-2">
                                <h5 className="text-sm font-semibold text-slate-600 mb-1">Assigned Reviewers:</h5>
                                {assignedReviews.length > 0 ? (
                                    <ul className="space-y-1">
                                        {assignedReviews.map(review => {
                                            const mentor = mentors.find(m => m.id === review.mentorId);
                                            return (
                                                <li key={review.id} className="flex justify-between items-center text-sm bg-white p-2 rounded-md border border-slate-200">
                                                    <span>{mentor?.name || 'Unknown Mentor'}</span>
                                                    <button 
                                                        onClick={() => setReviewToUnassign(review)}
                                                        className="text-red-500 hover:text-red-700 font-semibold text-xs uppercase"
                                                    >
                                                        Unassign
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-slate-400 italic mt-1">No reviewers assigned yet.</p>
                                )}
                            </div>

                            {unassignedMentors.length > 0 && (
                                <div className="mt-4 flex items-center gap-2">
                                    <select
                                        value={selectedMentor[team.id] || ''}
                                        onChange={e => handleSelectMentor(team.id, e.target.value)}
                                        className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="" disabled>-- Select a mentor to assign --</option>
                                        {unassignedMentors.map(mentor => (
                                            <option key={mentor.id} value={mentor.id}>{mentor.name}</option>
                                        ))}
                                    </select>
                                    <button 
                                        onClick={() => handleAssign(team.id)}
                                        className="bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 whitespace-nowrap"
                                    >
                                        Assign
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                }) : (
                  <p className="text-center text-slate-500 py-8">No teams found. Import them via CSV.</p>
                )}
              </div>
          </div>
        </div>
        
        {reviewToUnassign && (
            <Modal
                isOpen={!!reviewToUnassign}
                onClose={() => setReviewToUnassign(null)}
                title="Confirm Unassignment"
            >
                <div className="text-slate-600">
                    <p>Are you sure you want to unassign <span className="font-semibold">{mentors.find(m => m.id === reviewToUnassign.mentorId)?.name}</span> from the team <span className="font-semibold">{teams.find(t => t.id === reviewToUnassign.teamId)?.name}</span>?</p>
                    <p className="mt-2 text-sm">This action will permanently delete their review data.</p>
                    <div className="flex justify-end space-x-4 mt-6">
                        <button
                            onClick={() => setReviewToUnassign(null)}
                            className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmUnassign}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold"
                        >
                            Unassign
                        </button>
                    </div>
                </div>
            </Modal>
        )}
      </>
    );
  };


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-slate-800">Admin Dashboard</h2>
        <div className="flex space-x-2 p-1 bg-slate-200 rounded-lg">
          <button onClick={() => setActiveTab('leaderboard')} className={`px-4 py-2 text-sm font-semibold rounded-md transition ${activeTab === 'leaderboard' ? 'bg-white shadow text-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}>Team Leaderboard</button>
          <button onClick={() => setActiveTab('mentors')} className={`px-4 py-2 text-sm font-semibold rounded-md transition ${activeTab === 'mentors' ? 'bg-white shadow text-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}>Mentor Progress</button>
          <button onClick={() => setActiveTab('comments')} className={`px-4 py-2 text-sm font-semibold rounded-md transition ${activeTab === 'comments' ? 'bg-white shadow text-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}>Reviewer Comments</button>
          <button onClick={() => setActiveTab('data')} className={`px-4 py-2 text-sm font-semibold rounded-md transition ${activeTab === 'data' ? 'bg-white shadow text-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}>Manage Data</button>
        </div>
      </div>
      {activeTab === 'leaderboard' && renderLeaderboard()}
      {activeTab === 'mentors' && renderMentorProgress()}
      {activeTab === 'comments' && renderReviewerComments()}
      {activeTab === 'data' && <ManageData />}
    </div>
  );
};

export default AdminDashboard;
