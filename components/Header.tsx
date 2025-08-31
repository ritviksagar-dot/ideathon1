// --- START OF FILE: src/components/Header.tsx ---
import React, { useState } from 'react';

interface HeaderProps {
  signOut: () => Promise<void>; // The function now returns a promise
}

const Header: React.FC<HeaderProps> = ({ signOut }) => {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    // No need to setIsSigningOut(false) because the component will unmount
    // when the user is redirected to the login page.
  };

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <h1 className="text-xl font-bold text-slate-800">Policy Proposal Review</h1>
          <button
            onClick={handleSignOut}
            disabled={isSigningOut} // Disable the button while signing out
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition disabled:bg-slate-300 disabled:cursor-wait"
          >
            {isSigningOut ? 'Signing Out...' : 'Logout'}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
// --- END OF FILE: src/components/Header.tsx ---