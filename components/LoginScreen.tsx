import React, { useState } from 'react';
import { supabaseClient } from '../supabaseClient';

const LoginScreen: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseClient) return;

    setLoading(true);
    setError(null);
    
    // This allows mentors to use a simple username, while admins can use their full email.
    // If the input doesn't contain "@", we append a consistent domain.
    const loginIdentifier = username.includes('@') ? username : `${username}@review.app`;

    const { error } = await supabaseClient.auth.signInWithPassword({
      email: loginIdentifier,
      password,
    });
    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex justify-center items-start min-h-screen bg-slate-100 pt-16">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 text-center">Policy Proposal Review</h1>
        <h2 className="text-3xl font-bold text-center text-slate-800 mb-2 mt-6">Welcome Back</h2>
        <p className="text-center text-slate-500 mb-8">Please sign in to continue.</p>
        
        {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-6" role="alert">
                <p>{error}</p>
            </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-slate-900 placeholder-slate-400"
              required
              placeholder="Enter your assigned username"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-slate-900 placeholder-slate-400"
              required
              placeholder="••••••••"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition duration-200"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;