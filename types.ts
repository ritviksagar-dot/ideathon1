import { AuthSession, User } from '@supabase/supabase-js';

// Represents the score for one criterion
export type CriterionScore = {
  criterionId: string;
  score: number | null; // 1-5, null if not yet scored
}

export type Database = {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string;
          name: string;
          candidate_id: string;
          proposalDetails: string;
          proposal_link?: string | null;
        };
        Insert: {
          id: string;
          name: string;
          candidate_id: string;
          proposalDetails: string;
          proposal_link?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          candidate_id?: string;
          proposalDetails?: string;
          proposal_link?: string | null;
        };
        Relationships: [];
      };
      mentors: {
        Row: {
          id: string;
          name: string;
          isInternal: boolean;
        };
        Insert: {
          id: string;
          name: string;
          isInternal: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          isInternal?: boolean;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: number;
          teamId: string;
          mentorId: string;
          scores: any;
          isCompleted: boolean;
          comment: string | null;
        };
        Insert: {
          id?: number;
          teamId: string;
          mentorId: string;
          scores: any;
          isCompleted: boolean;
          comment?: string | null;
        };
        Update: {
          id?: number;
          teamId?: string;
          mentorId?: string;
          scores?: any;
          isCompleted?: boolean;
          comment?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};

export interface Criterion {
  id: string;
  name: string;
  weight: number; // e.g., 0.2 for 20%
}

// App-level types, derived from the database schema for consistency
export type Team = Database['public']['Tables']['teams']['Row'];
export type Mentor = Database['public']['Tables']['mentors']['Row'];

// A complete review by one mentor for one team.
export type Review = Database['public']['Tables']['reviews']['Row'];

export interface LeaderboardEntry {
  rank: number;
  team: Team;
  averageScore: number;
  reviewers: { name: string; score: number }[];
  completedReviews: number;
  totalReviews: number;
}

export interface MentorProgress {
  mentor: Mentor;
  completedReviews: number;
  totalReviews: number;
}

export interface AdminCommentData {
    rank: number;
    team: Team;
    comments: { mentorName: string; comment: string | null }[];
}

export interface CurrentUser {
  session: AuthSession;
  user: User;
  profile: Mentor | null;
}
