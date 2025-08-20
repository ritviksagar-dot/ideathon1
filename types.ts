import { AuthSession, User } from '@supabase/supabase-js';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Represents the score for one criterion
export interface CriterionScore {
  criterionId: string;
  score: number | null; // 1-5, null if not yet scored
}

export interface Database {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string;
          name: string;
          proposalDetails: string;
        };
        Insert: {
          id: string;
          name: string;
          proposalDetails: string;
        };
        Update: {
          id?: string;
          name?: string;
          proposalDetails?: string;
        };
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
      };
      reviews: {
        Row: {
          id: number;
          teamId: string;
          mentorId: string;
          scores: Json;
          isCompleted: boolean;
        };
        Insert: {
          id?: number;
          teamId: string;
          mentorId: string;
          scores: Json;
          isCompleted: boolean;
        };
        Update: {
          id?: number;
          teamId?: string;
          mentorId?: string;
          scores?: Json;
          isCompleted?: boolean;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}

export interface Criterion {
  id: string;
  name: string;
  weight: number; // e.g., 0.2 for 20%
}

export interface Team {
  id: string;
  name: string;
  proposalDetails: string;
}

// Represents the user profile stored in the public 'mentors' table
export interface Mentor {
  id: string; // This is the UUID from auth.users
  name: string;
  isInternal: boolean;
}

// A complete review by one mentor for one team
export interface Review {
  id: number; // Primary key from the database
  teamId: string;
  mentorId: string;
  scores: CriterionScore[];
  isCompleted: boolean;
}

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

export interface CurrentUser {
  session: AuthSession;
  user: User;
  profile: Mentor | null;
}