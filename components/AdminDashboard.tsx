import React, { useState } from 'react';
import type { LeaderboardEntry, MentorProgress, AdminCommentData } from '../types';

// The props are now clean: only display data and export functions.
interface AdminDashboardProps {
  leaderboardData: LeaderboardEntry[];
  mentorProgressData: MentorProgress[];
  adminCommentsData: AdminCommentData[];
  exportRankingsToCSV: () => void;
  exportCommentsToCSV: () => void;
}

type Tab = 'leaderboard' | 'mentors' | 'comments';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  leaderboardData, 
  mentorProgressData, 
  adminCommentsData, 
  exportRankingsToCSV, 
  exportCommentsToCSV 
}) => {
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
  
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold text-slate-800">Admin Dashboard</h2>

        {/* --- MERGED FEATURE: EXPORT BUTTONS --- */}
        <div className="flex items-center gap-2 flex-shrink-0">
            <button 
              onClick={exportRankingsToCSV}
              className="px-3 py-2 text-sm font-semibold bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition"
            >
              Export Rankings (CSV)
            </button>
            <button 
              onClick={exportCommentsToCSV}
              className="px-3 py-2 text-sm font-semibold bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition"
            >
              Export Comments (CSV)
            </button>
        </div>
      </div>

      {/* --- MERGED FEATURE: READ-ONLY TABS --- */}
      <div className="flex justify-end mb-6">
        <div className="flex space-x-2 p-1 bg-slate-200 rounded-lg">
          <button onClick={() => setActiveTab('leaderboard')} className={`px-4 py-2 text-sm font-semibold rounded-md transition ${activeTab === 'leaderboard' ? 'bg-white shadow text-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}>Team Leaderboard</button>
          <button onClick={() => setActiveTab('mentors')} className={`px-4 py-2 text-sm font-semibold rounded-md transition ${activeTab === 'mentors' ? 'bg-white shadow text-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}>Mentor Progress</button>
          <button onClick={() => setActiveTab('comments')} className={`px-4 py-2 text-sm font-semibold rounded-md transition ${activeTab === 'comments' ? 'bg-white shadow text-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}>Reviewer Comments</button>
        </div>
      </div>

      {activeTab === 'leaderboard' && renderLeaderboard()}
      {activeTab === 'mentors' && renderMentorProgress()}
      {activeTab === 'comments' && renderReviewerComments()}
    </div>
  );
};

export default AdminDashboard;
