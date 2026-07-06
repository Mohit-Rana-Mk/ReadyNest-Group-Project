import React from 'react';

export function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full px-4 py-3 bg-[#eef2f6] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-700 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    />
  );
}
