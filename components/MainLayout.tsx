// --- START OF FILE: src/components/MainLayout.tsx ---
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100">
      <Header signOut={signOut} />
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
// --- END OF FILE: src/components/MainLayout.tsx ---