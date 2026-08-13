import React from 'react';

interface LumaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  lightText?: boolean;
}

export const LumaLogo: React.FC<LumaLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  lightText = true,
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-sm',
    md: 'w-8 h-8 text-base',
    lg: 'w-10 h-10 text-xl',
  };

  const starSizes = {
    sm: 16,
    md: 20,
    lg: 26,
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Luma Star Symbol from Reference */}
      <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 text-white shadow-lg shadow-indigo-500/20 ${sizeClasses[size].split(' ')[0]} ${sizeClasses[size].split(' ')[1]}`}>
        <svg
          width={starSizes[size]}
          height={starSizes[size]}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-pulse"
        >
          {/* Eight-pointed luminous spark / asterisk shape matching reference */}
          <line x1="12" y1="2" x2="12" y2="22" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
        </svg>
      </div>

      {showText && (
        <span
          className={`font-semibold tracking-tight ${
            lightText ? 'text-white' : 'text-zinc-900'
          } ${sizeClasses[size].split(' ')[2]}`}
        >
          Luma
        </span>
      )}
    </div>
  );
};
