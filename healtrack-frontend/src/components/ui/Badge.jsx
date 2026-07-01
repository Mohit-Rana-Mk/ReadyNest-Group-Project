import React from 'react';

export function Badge({ status }) {
  let colorClasses = 'bg-gray-100 text-gray-700';
  
  switch (status) {
    case 'Scheduled':
      colorClasses = 'bg-gray-100 text-gray-700';
      break;
    case 'Checked-In':
      colorClasses = 'bg-blue-100 text-blue-700';
      break;
    case 'In Consultation':
      colorClasses = 'bg-amber-100 text-amber-700';
      break;
    case 'Completed':
      colorClasses = 'bg-green-100 text-green-700';
      break;
    default:
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses}`}>
      {status}
    </span>
  );
}
