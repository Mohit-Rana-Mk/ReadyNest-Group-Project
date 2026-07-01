import React from 'react';

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {children}
    </div>
  );
}
