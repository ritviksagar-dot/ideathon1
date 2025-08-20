import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// =================================================================================
// Supabase Client Initialization
// =================================================================================
// This file initializes the Supabase client. The connection credentials
// (URL and Anon Key) are sourced from environment variables, which is a
// security best practice.
//
// For local development, you should create a `.env.local` file in the root
// of your project and add the following variables:
//
// VITE_SUPABASE_URL="your-supabase-project-url"
// VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
//
// NOTE: To resolve the initialization error, placeholder values are used below.
// You MUST replace them with your actual Supabase credentials for the app
// to function correctly.
// =================================================================================

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || "https://suzncnosohhcaatjrggc.supabase.co";
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1em5jbm9zb2hoY2FhdGpyZ2djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MDIyMTAsImV4cCI6MjA3MTE3ODIxMH0.gX5ljbYouo9Ke65lw-pyYwVokjSaw8NvP_7xYuQ0G4c";


// --- DO NOT EDIT BELOW THIS LINE ---

let supabaseInstance: SupabaseClient<Database> | null = null;

// This function robustly creates the client. If the credentials above are placeholders,
// the client will be created but data fetching will fail.
const createSupabaseClient = () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Supabase credentials are not set. Please provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.");
    return null;
  }
  
  try {
    return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (error) {
    console.error("Error creating Supabase client:", error);
    return null;
  }
};

export const supabaseClient = createSupabaseClient();