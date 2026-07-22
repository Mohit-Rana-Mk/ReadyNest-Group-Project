import React from 'react';
import { motion } from 'framer-motion';
import { FolderSearch } from 'lucide-react';
import { Button } from './Button';

export default function EmptyState({
  icon: Icon = FolderSearch,
  title = 'No Data Found',
  description = 'There is currently nothing to display here.',
  actionLabel,
  onAction,
  className = ''
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-slate-50/50 border border-slate-100/50 border-dashed ${className}`}
    >
      <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-white shadow-sm border border-slate-100">
        <Icon className="w-8 h-8 text-slate-400" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary" className="shadow-sm">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
