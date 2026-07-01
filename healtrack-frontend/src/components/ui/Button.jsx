import React from 'react';

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const baseClasses = 'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  let variantClasses = '';
  if (variant === 'primary') {
    variantClasses = 'text-white bg-blue-700 hover:bg-blue-800 focus:ring-blue-500';
  } else if (variant === 'secondary') {
    variantClasses = 'text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-gray-500';
  } else if (variant === 'outline') {
    variantClasses = 'text-gray-700 bg-transparent border border-gray-300 hover:bg-gray-50 focus:ring-blue-500';
  }

  return (
    <button className={`${baseClasses} ${variantClasses} ${className}`} {...props}>
      {children}
    </button>
  );
}
