// --- START OF FILE: src/pages/LoginPage.tsx ---
import React, { useState } from 'react';
import { supabaseClient } from '../supabaseClient'; // Adjust path if needed

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault(); // Prevent the form from reloading the page
    if (!supabaseClient) {
      setError("Supabase client is not configured.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // --- THIS IS THE SIMPLIFIED LOGIC ---
      // We now use the email input directly, with no modifications.
      // Both mentors and admins must enter their full email address.
      const { error } = await supabaseClient.auth.signInWithPassword({
        email: email.trim(), // Use the direct input
        password: password,
      });
      // --- END OF SIMPLIFIED LOGIC ---

      if (error) {
        // Provide a user-friendly error message
        throw new Error("Invalid login credentials. Please check your email and password.");
      }
      
      // On success, the AuthContext will automatically handle the redirect.

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 px-4 py-8">
      {/* CrashFree India Branding */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-blue-600 tracking-wide">
          CrashFree India
        </h1>
        <div className="mt-2 w-24 sm:w-32 md:w-40 h-1 bg-blue-600 mx-auto rounded-full"></div>
      </div>

      <div className="w-full max-w-md p-6 sm:p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-800">
            Policy Proposal Review
          </h2>
          <p className="mt-2 text-center text-slate-600 text-sm sm:text-base">
            Please sign in with your provided credentials.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            {/* The label is now simply "Email Address" for clarity */}
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email Address
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-3 py-2 placeholder-slate-400 border border-slate-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-3 py-2 placeholder-slate-400 border border-slate-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            If you face any difficulties, contact{' '}
            <a 
              href="mailto:support.nextmile@crashfreeindia.org" 
              className="text-blue-600 hover:text-blue-800 underline"
            >
              support.nextmile@crashfreeindia.org
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
// --- END OF FILE: src/pages/LoginPage.tsx ---