import React from 'react';
import { cn } from '../lib/utils';

interface StatusBadgeProps {
  status: string;
  type?: 'compliance' | 'company' | 'transaction' | 'generic';
  className?: string;
}

export function StatusBadge({ status, type = 'generic', className }: StatusBadgeProps) {
  const getStyles = () => {
    const s = status.toLowerCase();
    
    // Default / Generic
    if (['active', 'completed', 'success', 'paid', 'income'].includes(s)) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    }
    if (['pending', 'in progress', 'processing', 'submitted'].includes(s)) {
      return 'bg-amber-50 text-amber-700 border-amber-100';
    }
    if (['overdue', 'failed', 'cancelled', 'expense', 'error', 'closed'].includes(s)) {
      return 'bg-rose-50 text-rose-700 border-rose-100';
    }
    if (['dormant', 'inactive', 'archived', 'other'].includes(s)) {
      return 'bg-gray-100 text-gray-600 border-gray-200';
    }
    
    return 'bg-gray-50 text-gray-600 border-gray-100';
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
      getStyles(),
      className
    )}>
      {status}
    </span>
  );
}
