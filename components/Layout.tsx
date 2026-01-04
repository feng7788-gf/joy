
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  onBack?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, title, onBack }) => {
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white overflow-hidden">
      <header className="px-6 py-4 flex items-center justify-between">
        {onBack ? (
          <button onClick={onBack} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
        ) : <div className="w-8" />}
        <h1 className="text-sm font-medium text-gray-300 uppercase tracking-[0.2em]">{title}</h1>
        <div className="w-8 h-8 rounded-full border border-gray-100 overflow-hidden grayscale">
          <img src="https://picsum.photos/32/32" alt="Avatar" />
        </div>
      </header>
      <main className="flex-1 overflow-y-auto px-6">
        {children}
      </main>
    </div>
  );
};
