import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  className 
}: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center p-12 text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200",
        className
      )}
    >
      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 mb-4 text-gray-400">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-gray-500 max-w-xs mx-auto mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}
