import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// =================================================================================
// Supabase Client Initialization
// =================================================================================
// This file initializes the Supabase client. The connection credentials

// (URL and Anon Key) are sourced from Vite environment variables.
// Create a `.env.local` in the project root with:
// VITE_SUPABASE_URL="your-supabase-project-url"
// VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
// =================================================================================

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
	throw new Error("Supabase URL and Anon Key must be provided.");
}

// Make the client more tolerant of slow networks/cold starts by extending fetch timeout to 30s.
export const supabaseClient: SupabaseClient<Database> = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
	global: {
		fetch: (input: RequestInfo, init?: RequestInit) => {
			const timeoutMs = 30000;
			const controller = new AbortController();
			const { signal } = controller;
			const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
			return fetch(input as any, { ...init, signal }).finally(() => clearTimeout(timeoutId));
		},
	},
});

