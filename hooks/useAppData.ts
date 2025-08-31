import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Review, Team, Mentor, CriterionScore, LeaderboardEntry, MentorProgress, AdminCommentData, ToastData } from '../types';
import { CRITERIA } from '../constants';
import { supabaseClient } from '../supabaseClient';
import { User } from '@supabase/supabase-js';

const escapeCsvValue = (value: any): string => {
  const stringValue = value === null || value === undefined ? '' : String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

export const useAppData = (user: User | null, showToast: (data: ToastData) => void) => {
  const [profile, setProfile] = useState<Mentor | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setIsLoading(false); return; }

    const loadAllData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let { data: userProfile, error: profileError } = await supabaseClient.from('mentors').select('*').eq('id', user.id).single();

        if (profileError && profileError.code === 'PGRST116') {
          const profileName = user.email?.split('@')[0] || 'New Mentor';
          const { data: newProfile, error: upsertError } = await supabaseClient.from('mentors').upsert({ id: user.id, name: profileName, isInternal: false }).select().single();
          if (upsertError) throw new Error(`Could not create profile: ${upsertError.message}`);
          userProfile = newProfile;
        } else if (profileError) {
          throw new Error(`Error fetching profile: ${profileError.message}`);
        }
        setProfile(userProfile);
        
        const isAdmin = userProfile?.isInternal === true;
        if (isAdmin) {
          // Load all data for admin users
          const [teamsResult, reviewsResult, mentorsResult] = await Promise.all([
            Promise.race([
              supabaseClient.from('teams').select('*'),
              new Promise<{ data: null; error: { message: string } }>((_, reject) => 
                setTimeout(() => reject({ data: null, error: { message: 'Teams query timeout' } }), 10000)
              )
            ]),
            Promise.race([
              supabaseClient.from('reviews').select('*'),
              new Promise<{ data: null; error: { message: string } }>((_, reject) => 
                setTimeout(() => reject({ data: null, error: { message: 'Reviews query timeout' } }), 10000)
              )
            ]),
            Promise.race([
              supabaseClient.from('mentors').select('*'),
              new Promise<{ data: null; error: { message: string } }>((_, reject) => 
                setTimeout(() => reject({ data: null, error: { message: 'Mentors query timeout' } }), 10000)
              )
            ])
          ]);

          if (teamsResult.error) throw new Error(`Failed to load teams: ${teamsResult.error.message}`);
          if (reviewsResult.error) throw new Error(`Failed to load reviews: ${reviewsResult.error.message}`);
          if (mentorsResult.error) throw new Error(`Failed to load mentors: ${mentorsResult.error.message}`);

          setTeams(teamsResult.data || []);
          setReviews(reviewsResult.data || []);
          setMentors(mentorsResult.data || []);
        } else {
          // Load mentor-specific data
          const reviewsPromise = Promise.race([
            supabaseClient.from('reviews').select('*').eq('mentorId', user.id),
            new Promise<{ data: null; error: { message: string } }>((_, reject) => 
              setTimeout(() => reject({ data: null, error: { message: 'Reviews query timeout' } }), 10000)
            )
          ]);

          const { data: mentorReviews, error: reviewsError } = await reviewsPromise;
          if (reviewsError) throw new Error(`Failed to load your reviews: ${reviewsError.message}`);

          if (mentorReviews && mentorReviews.length > 0) {
            setReviews(mentorReviews);
            const teamIds = [...new Set(mentorReviews.map(r => r.teamId))];
            
            const teamsPromise = Promise.race([
              supabaseClient.from('teams').select('*').in('id', teamIds),
              new Promise<{ data: null; error: { message: string } }>((_, reject) => 
                setTimeout(() => reject({ data: null, error: { message: 'Teams query timeout' } }), 10000)
              )
            ]);

            const { data: associatedTeams, error: teamsError } = await teamsPromise;
            if (teamsError) throw new Error(`Failed to load team data: ${teamsError.message}`);
            
            setTeams(associatedTeams || []);
          } else {
            // No reviews assigned - set empty arrays
            setReviews([]);
            setTeams([]);
          }
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAllData();
  }, [user]);

  const getReviewsForMentor = useCallback((mentorId: string) => reviews.filter(review => review.mentorId === mentorId), [reviews]);
  
  // --- FIXED OPTIMISTIC SAVE FUNCTION WITH ROLLBACK ---
  const saveReviewUpdate = useCallback(async (
    reviewId: number,
    scores: CriterionScore[],
    isCompleted: boolean,
    comment: string
  ): Promise<boolean> => {
    if (!user) {
      showToast({ message: "You must be logged in to save.", type: 'error' });
      return false;
    }

    // Store original state for potential rollback
    const originalReview = reviews.find(r => r.id === reviewId);
    if (!originalReview) {
      showToast({ message: "Review not found.", type: 'error' });
      return false;
    }

    try {
      // 1. OPTIMISTIC UPDATE: Update UI immediately for responsive feel
      setReviews(currentReviews =>
        currentReviews.map(r =>
          r.id === reviewId ? { ...r, scores, isCompleted, comment } : r
        )
      );

      // 2. DATABASE UPDATE: Attempt to persist to database
      const { error } = await supabaseClient
        .from('reviews')
        .update({ scores, isCompleted, comment })
        .eq('id', reviewId)
        .eq('mentorId', user.id); // Security check

      if (error) {
        throw error;
      }
      
      // 3. SUCCESS: Confirm save to user
      showToast({ message: 'Review saved successfully!', type: 'success' });
      return true;
    } catch (e: any) {
      console.error('Failed to save review:', e);
      
      // 4. ROLLBACK: Revert UI to original state on failure
      setReviews(currentReviews =>
        currentReviews.map(r =>
          r.id === reviewId ? originalReview : r
        )
      );
      
      showToast({ 
        message: `Failed to save review: ${e.message}. Please try again.`, 
        type: 'error' 
      });
      return false;
    }
  }, [user, showToast, reviews]);
  
  const calculateWeightedScore = useCallback((scores: CriterionScore[]): number => {
    const totalScore = scores.reduce((acc, currentScore) => {
      const criterion = CRITERIA.find(c => c.id === currentScore.criterionId);
      if (criterion && currentScore.score !== null) {
        return acc + currentScore.score * criterion.weight;
      }
      return acc;
    }, 0);
    return parseFloat(totalScore.toFixed(2));
  }, []);

  const leaderboardData = useMemo((): LeaderboardEntry[] => {
    const teamScores: { [key: string]: { scores: number[], reviewers: {name: string, score: number}[], totalReviews: number } } = {};

    reviews.forEach(review => {
      if (!teamScores[review.teamId]) {
        const totalReviewers = reviews.filter(r => r.teamId === review.teamId).length;
        teamScores[review.teamId] = { scores: [], reviewers: [], totalReviews: totalReviewers };
      }
      
      const mentor = mentors.find(m => m.id === review.mentorId);
      if (review.isCompleted && Array.isArray(review.scores)) {
        const weightedScore = calculateWeightedScore(review.scores as CriterionScore[]);
        teamScores[review.teamId].scores.push(weightedScore);
        if (mentor) {
          teamScores[review.teamId].reviewers.push({ name: mentor.name, score: weightedScore });
        }
      }
    });

    const leaderboard: Omit<LeaderboardEntry, 'rank'>[] = teams.map(team => {
      const data = teamScores[team.id];
      const sum = data ? data.scores.reduce((a, b) => a + b, 0) : 0;
      const count = data ? data.scores.length : 0;
      const averageScore = count > 0 ? parseFloat((sum / count).toFixed(2)) : 0;
      
      return {
        team,
        averageScore,
        reviewers: data ? data.reviewers : [],
        completedReviews: count,
        totalReviews: data ? data.totalReviews : 0,
      };
    });

    leaderboard.sort((a, b) => b.averageScore - a.averageScore);
    return leaderboard.map((entry, index) => ({ ...entry, rank: index + 1 }));
  }, [reviews, teams, mentors, calculateWeightedScore]);

  const mentorProgressData = useMemo((): MentorProgress[] => {
    return mentors.map(mentor => {
      const assignedReviews = reviews.filter(r => r.mentorId === mentor.id);
      const completedReviews = assignedReviews.filter(r => r.isCompleted).length;
      const totalReviews = assignedReviews.length;
      return {
        mentor,
        completedReviews,
        totalReviews,
      };
    });
  }, [reviews, mentors]);

  const adminCommentsData = useMemo((): AdminCommentData[] => {
    return leaderboardData.map(entry => {
      const teamReviews = reviews.filter(r => r.teamId === entry.team.id);
      const comments = teamReviews.map(review => {
        const mentor = mentors.find(m => m.id === review.mentorId);
        return {
          mentorName: mentor?.name || 'Unknown Mentor',
          comment: review.comment || null
        };
      }).sort((a, b) => a.mentorName.localeCompare(b.mentorName));

      return {
        rank: entry.rank,
        team: entry.team,
        comments: comments
      };
    });
  }, [leaderboardData, reviews, mentors]);

  const triggerCsvDownload = (csvContent: string, fileName: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportRankingsToCSV = useCallback(() => {
    if (leaderboardData.length === 0) {
      showToast({ message: 'No ranking data to export.', type: 'error' });
      return;
    }
    const headers = ['Rank', 'Team Name', 'Candidate ID', 'Average Score', 'Completed Reviews', 'Total Reviews'];
    const rows = leaderboardData.map(entry => [
      entry.rank, entry.team.name, entry.team.candidate_id, entry.averageScore.toFixed(2), entry.completedReviews, entry.totalReviews
    ].map(escapeCsvValue).join(','));
    const csvContent = [headers.join(','), ...rows].join('\n');
    triggerCsvDownload(csvContent, `team_rankings_${new Date().toISOString().split('T')[0]}.csv`);
  }, [leaderboardData, showToast]);

  const exportCommentsToCSV = useCallback(() => {
    if (adminCommentsData.length === 0) {
      showToast({ message: 'No comment data to export.', type: 'error' });
      return;
    }
    const headers = ['Rank', 'Team Name', 'Candidate ID', 'Mentor Name', 'Comment'];
    const rows = adminCommentsData.flatMap(teamEntry => 
      teamEntry.comments.map(comment => [
        teamEntry.rank, teamEntry.team.name, teamEntry.team.candidate_id, comment.mentorName, comment.comment || ''
      ].map(escapeCsvValue).join(','))
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    triggerCsvDownload(csvContent, `mentor_comments_${new Date().toISOString().split('T')[0]}.csv`);
  }, [adminCommentsData, showToast]);

  return { profile, reviews, teams, mentors, isLoading, error, leaderboardData, mentorProgressData, adminCommentsData, getReviewsForMentor, saveReviewUpdate, exportRankingsToCSV, exportCommentsToCSV };
};
