import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// =================================================================================
// IMPORTANT: PLEASE REPLACE THE PLACEHOLDER VALUES BELOW
// =================================================================================
// To connect to your Supabase project, you need to replace the placeholder
// strings for `SUPABASE_URL` and `SUPABASE_ANON_KEY` with your actual
// Supabase Project URL and Anon Key.
//
// You can find these in your Supabase project settings under "API".
//
// For production, it's recommended to use environment variables to keep your
// keys secure.
// =================================================================================

const SUPABASE_URL = "https://your-project-url.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-key";


// --- DO NOT EDIT BELOW THIS LINE ---

let supabaseInstance: SupabaseClient<Database> | null = null;

// This function robustly creates the client, returning null if credentials are not set.
// The main App.tsx component will handle the null case and show a clear error message.
const createSupabaseClient = () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.includes("your-project-url")) {
    console.error("Supabase credentials are not set. Please update supabaseClient.ts with your project URL and anon key.");
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
