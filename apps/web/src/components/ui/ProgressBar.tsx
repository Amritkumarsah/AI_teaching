import React from 'react';

export interface ProgressBarProps {
  progress?: number; // 0 to 100
  value?: number; // alias for progress
  label?: string;
  showPercentage?: boolean;
  showLabel?: boolean;
  color?: 'indigo' | 'emerald' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  value,
  label,
  showPercentage = true,
  showLabel = true,
  color = 'indigo',
  size = 'md',
  className = '',
}) => {
  const currentVal = progress !== undefined ? progress : value !== undefined ? value : 0;
  const clamped = Math.min(100, Math.max(0, currentVal));

  const colorStyles = {
    indigo: 'bg-gradient-to-r from-indigo-500 to-sky-400',
    emerald: 'bg-gradient-to-r from-emerald-500 to-teal-400',
    amber: 'bg-gradient-to-r from-amber-500 to-orange-400',
  };

  const heightStyles = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {((label && showLabel) || showPercentage) && (
        <div className="flex items-center justify-between text-xs font-medium text-slate-300">
          {label && showLabel && <span>{label}</span>}
          {showPercentage && <span className="font-mono text-slate-400">{Math.round(clamped)}%</span>}
        </div>
      )}
      <div className={`w-full bg-slate-800/80 rounded-full overflow-hidden ${heightStyles[size]}`}>
        <div
          className={`${heightStyles[size]} rounded-full transition-all duration-500 ease-out ${colorStyles[color]}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
