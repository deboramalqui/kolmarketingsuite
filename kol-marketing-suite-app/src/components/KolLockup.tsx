import React from 'react';

interface KolLockupProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const KolLockup: React.FC<KolLockupProps> = ({
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1.5',
    md: 'px-3 py-1 text-xs gap-2',
    lg: 'px-4 py-1.5 text-sm gap-2.5',
  }[size];

  return (
    <div
      className={`inline-flex items-center font-bold tracking-wider uppercase rounded-full bg-slate-900/90 text-white border border-emerald-500/40 shadow-lg backdrop-blur-md ${sizeClasses} ${className}`}
    >
      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      <span className="font-extrabold tracking-tight text-white">KOL</span>
      <span className="text-emerald-400 font-semibold tracking-widest text-[9px]">FRANQUICIAS</span>
    </div>
  );
};
