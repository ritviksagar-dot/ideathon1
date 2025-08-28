
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Review, Team, Mentor, CriterionScore, LeaderboardEntry, MentorProgress, AdminCommentData } from '../types';
import { CRITERIA } from '../constants';
import { supabaseClient } from '../supabaseClient';
import type { ToastData } from '../components/Toast';
import { User } from '@supabase/supabase-js';

export const useAppData = (user: User | null, showToast: (data: ToastData) => void) => {
  const [profile, setProfile] = useState<Mentor | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Represents ALL data loading
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const loadAllData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Step 1: Fetch the user's profile. This is the critical step that was failing.
        const { data: userProfile, error: profileError } = await supabaseClient
          .from('mentors')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw new Error(`Failed to load your profile. Details: ${profileError.message}`);
        setProfile(userProfile);

        // Step 2: Fetch the rest of the data based on the profile.
        const isAdmin = userProfile?.isInternal === true;

        if (isAdmin) {
          const [teamsResult, reviewsResult, mentorsResult] = await Promise.all([
            supabaseClient.from('teams').select('*'),
            supabaseClient.from('reviews').select('*'),
            supabaseClient.from('mentors').select('*'),
          ]);

          if (teamsResult.error) throw teamsResult.error;
          setTeams(teamsResult.data || []);
          if (reviewsResult.error) throw reviewsResult.error;
          setReviews(reviewsResult.data || []);
          if (mentorsResult.error) throw mentorsResult.error;
          setMentors(mentorsResult.data || []);
        } else {
          const { data: mentorReviews, error: reviewsError } = await supabaseClient
            .from('reviews').select('*').eq('mentorId', user.id);

          if (reviewsError) throw reviewsError;
          
          if (mentorReviews && mentorReviews.length > 0) {
            setReviews(mentorReviews);
            const teamIds = [...new Set(mentorReviews.map(r => r.teamId))];
            const { data: associatedTeams, error: teamsError } = await supabaseClient
              .from('teams').select('*').in('id', teamIds);
            if (teamsError) throw teamsError;
            setTeams(associatedTeams || []);
          }
        }
      } catch (e: any) {
        console.error("Failed to load application data:", e);
        setError(e.message || "An unknown error occurred while loading data.");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAllData();
  }, [user]);

  const addTeam = useCallback(async (team: Omit<Team, 'proposalDetails'> & { proposalDetails: string }): Promise<Team | null> => {
    if (!supabaseClient) return null;
    const { data, error } = await supabaseClient.from('teams').insert(team).select().single();
    if (error) {
      setError(error.message);
      showToast({ message: `Error: ${error.message}`, type: 'error' });
      return null;
    }
    if (data) {
      setTeams(prev => [...prev, data]);
      showToast({ message: `Team "${data.name}" added successfully!`, type: 'success' });
    }
    return data;
  }, [showToast]);

  const assignMentorToTeam = useCallback(async (teamId: string, mentorId: string) => {
    if (!supabaseClient) return;
    
    // Prevent duplicate assignments
    const existingAssignment = reviews.find(r => r.teamId === teamId && r.mentorId === mentorId);
    if (existingAssignment) {
      showToast({ message: "This mentor is already assigned to this team.", type: 'error' });
      return;
    }

    const newReview = {
      teamId,
      mentorId,
      scores: CRITERIA.map(c => ({ criterionId: c.id, score: null })),
      isCompleted: false,
      comment: null,
    };

    const { data: insertedReview, error } = await supabaseClient
      .from('reviews')
      .insert(newReview)
      .select()
      .single();

    if (error) {
      setError(error.message);
      showToast({ message: `Failed to create assignment: ${error.message}`, type: 'error' });
    } else if (insertedReview) {
      setReviews(prev => [...prev, insertedReview as Review]);
      showToast({ message: 'Assignment created successfully.', type: 'success' });
    }
  }, [reviews, showToast]);

  const unassignMentorFromTeam = useCallback(async (reviewId: number) => {
    if (!supabaseClient) return;

    const originalReviews = reviews;
    setReviews(prev => prev.filter(r => r.id !== reviewId)); // Optimistic update

    const { data, error } = await supabaseClient
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .select()
        .single();

    if (error || !data) {
        const errorMessage = error?.message || 'Record not found or you may not have permission.';
        setError(errorMessage);
        setReviews(originalReviews); // Rollback
        showToast({ message: `Failed to remove assignment: ${errorMessage}`, type: 'error' });
    } else {
        showToast({ message: 'Assignment removed successfully.', type: 'success' });
    }
  }, [reviews, showToast]);

  const saveReviewUpdate = useCallback(async (reviewId: number, newScores: CriterionScore[], newStatus: boolean, newComment: string): Promise<boolean> => {
    if (!user || !supabaseClient) {
        showToast({ message: "You must be logged in to save changes.", type: 'error'});
        return false;
    }

    // Update the database first
    const { data: updatedReview, error } = await supabaseClient
        .from('reviews')
        .update({ scores: newScores, isCompleted: newStatus, comment: newComment })
        .eq('id', reviewId)
        .eq('mentorId', user.id)
        .select()
        .single();
        
    if (error || !updatedReview) {
        const errorMessage = error?.message || "Failed to save. This might be due to a permissions issue or if the review does not belong to you.";
        showToast({ message: `Error: ${errorMessage}`, type: 'error'});
        return false;
    } else {
        // Update local state on success
        setReviews(prevReviews => 
            prevReviews.map(r => r.id === reviewId ? (updatedReview as Review) : r)
        );
        showToast({ message: 'Review saved!', type: 'success' });
        return true;
    }
  }, [showToast, user]);
  
  const getReviewsForMentor = useCallback((mentorId: string) => {
      return reviews.filter(review => review.mentorId === mentorId);
  }, [reviews]);
  
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
      if (review.isCompleted) {
        const weightedScore = calculateWeightedScore(review.scores as CriterionScore[]);
        teamScores[review.teamId].scores.push(weightedScore);
        if(mentor) {
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
    // This is based on leaderboardData to get the rank and team info easily
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

  return {
    profile,
    reviews,
    teams,
    mentors,
    isLoading,
    error,
    saveReviewUpdate,
    getReviewsForMentor,
    leaderboardData,
    mentorProgressData,
    adminCommentsData,
    addTeam,
    assignMentorToTeam,
    unassignMentorFromTeam
  };
};
