import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-32 h-32", showText = true }) => {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg 
        viewBox="0 0 200 200" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        {/* Face Outline - Clean Blue */}
        <circle cx="100" cy="100" r="80" stroke="#3B82F6" strokeWidth="6" className="dark:stroke-universe" />
        
        {/* Eyes - Soft Navy/Black */}
        <path d="M65 95 Q80 105 95 95" stroke="#1E3A8A" strokeWidth="5" strokeLinecap="round" className="dark:stroke-meteor"/>
        <path d="M105 95 Q120 105 135 95" stroke="#1E3A8A" strokeWidth="5" strokeLinecap="round" className="dark:stroke-meteor"/>
        
        {/* Nose - Light Blue */}
        <path d="M100 110 Q95 120 105 125" stroke="#93C5FD" strokeWidth="4" strokeLinecap="round" className="dark:stroke-universe"/>
        
        {/* Mouth - Navy */}
        <path d="M85 140 Q100 155 115 140" stroke="#1E3A8A" strokeWidth="5" strokeLinecap="round" className="dark:stroke-meteor"/>
        
        {/* Cheeks - Softest Blue/Pink */}
        <ellipse cx="60" cy="120" rx="10" ry="6" fill="#DBEAFE" fillOpacity="0.8" />
        <ellipse cx="140" cy="120" rx="10" ry="6" fill="#DBEAFE" fillOpacity="0.8" />
        
        {/* Sparkles - Sky Blue */}
        <path d="M30 70 L35 60 L40 70 L50 75 L40 80 L35 90 L30 80 L20 75 Z" fill="#3B82F6" className="animate-pulse dark:fill-universe" />
        <path d="M45 45 L48 40 L51 45 L56 46 L51 47 L48 52 L45 47 L40 46 Z" fill="#93C5FD" />
        
        {/* Sparkles (Right) */}
        <path d="M170 80 L175 70 L180 80 L190 85 L180 90 L175 100 L170 90 L160 85 Z" fill="#3B82F6" className="animate-pulse delay-75 dark:fill-universe" />
      </svg>
      
      {showText && (
        <div className="text-center mt-2">
          <h1 className="text-3xl font-heading font-bold text-ocean-venice dark:text-meteor tracking-tight leading-none">glowyze</h1>
          <p className="text-ocean-curious dark:text-sky text-[10px] tracking-[0.3em] uppercase font-black mt-1">face Analyzer</p>
        </div>
      )}
    </div>
  );
};