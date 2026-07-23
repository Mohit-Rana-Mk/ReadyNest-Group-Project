import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';

const GithubIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5a5.5 5.5 0 0 0-1.5-3.8 5.4 5.4 0 0 0-.1-3.8s-1.2-.4-3.9 1.4a12.8 12.8 0 0 0-7 0C6.2 1.4 5 1.8 5 1.8a5.4 5.4 0 0 0-.1 3.8A5.5 5.5 0 0 0 3 9.4c0 5 3 6.2 6 6.5a4.8 4.8 0 0 0-1 3.2v4"></path>
  </svg>
);

export function Footer() {
  return (
    <footer className="w-full py-6 mt-auto border-t border-slate-200 bg-transparent">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-sm text-slate-500 font-medium">
          &copy; 2026 HealTrack. All rights reserved.
        </div>
        
        <div className="flex items-center gap-6">
          <Link to="/feedback" className="text-sm text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1.5 font-medium">
            <MessageSquare className="w-4 h-4" />
            Feedback
          </Link>
          <a 
            href="https://github.com/Mohit-Rana-Mk/ReadyNest-Group-Project" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sm text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1.5 font-medium"
          >
            <GithubIcon className="w-4 h-4" />
            GitHub
          </a>
        </div>

        <div className="text-sm text-slate-500 font-medium">
          Designed with <span className="text-red-500">♥</span> by team <span className="font-bold text-slate-700">Code Titans</span>
        </div>
      </div>
    </footer>
  );
}
