import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };
  return <Loader2 className={`animate-spin text-indigo-400 ${sizeMap[size]} ${className}`} />;
};

export const Loading = LoadingSpinner;

export const LoadingPage: React.FC<{ message?: string }> = ({ message = 'Loading workspace...' }) => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 space-y-4 text-center">
    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
    <p className="text-sm font-medium text-slate-400 animate-pulse">{message}</p>
  </div>
);

export const LoadingSkeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => (
  <div className={`bg-slate-800/60 rounded-lg animate-pulse ${className}`} />
);
