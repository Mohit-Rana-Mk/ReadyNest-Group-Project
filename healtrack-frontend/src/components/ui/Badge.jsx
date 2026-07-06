import React from 'react';

export function Badge({ status, children, className = '', colorClasses = '' }) {
  let finalColorClasses = colorClasses || 'bg-gray-100 text-gray-700';
  
  if (status && !colorClasses) {
    switch (status) {
      case 'Scheduled':
        finalColorClasses = 'bg-gray-100 text-gray-700';
        break;
      case 'Checked-In':
        finalColorClasses = 'bg-blue-100 text-blue-700';
        break;
      case 'In Consultation':
        finalColorClasses = 'bg-amber-100 text-amber-700';
        break;
      case 'Completed':
        finalColorClasses = 'bg-green-100 text-green-700';
        break;
      default:
        break;
    }
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${finalColorClasses} ${className}`}>
      {children || status}
    </span>
  );
}
