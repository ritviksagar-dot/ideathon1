import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabaseClient } from '../supabaseClient';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // --- THIS IS THE ROBUST LOGOUT FUNCTION ---
  const signOut = async () => {
    try {
      // We try to sign out. This is the part that might throw the error.
      const { error } = await supabaseClient.auth.signOut();
      if (error) {
        // Even if it's not the session missing error, we log it.
        console.error('Error signing out:', error);
      }
    } catch (error) {
      // If it fails (e.g., AuthSessionMissingError), we catch it here so it
      // doesn't crash the app. We can log it for debugging.
      console.warn('Caught harmless error during sign out:', error);
    } finally {
      // This block runs NO MATTER WHAT. Whether the sign out succeeded or failed,
      // we ensure the local application state is cleared, which is the most
      // important step for redirecting the user to the login page.
      setSession(null);
      setUser(null);
    }
  };
  // --- END OF ROBUST LOGOUT FUNCTION ---

  const value = { session, user, isLoading, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


