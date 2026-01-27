import React, { useEffect, useState } from 'react';
import { Logo } from './Logo';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 100) {
          clearInterval(timer);
          setTimeout(onFinish, 200); // Small delay after 100% before transition
          return 100;
        }
        // Increased increment for faster loading (Website feel)
        const diff = Math.random() * 20 + 10; 
        return Math.min(oldProgress + diff, 100);
      });
    }, 150); // Faster interval

    return () => {
      clearInterval(timer);
    };
  }, [onFinish]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-ocean-pattens dark:bg-galaxy text-ocean-venice dark:text-meteor relative overflow-hidden transition-colors duration-300">
      {/* Background decoration */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-ocean-french dark:bg-planetary rounded-full blur-3xl opacity-30 animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-ocean-seagull dark:bg-universe rounded-full blur-3xl opacity-30 animate-pulse-slow"></div>

      {/* Logo Container */}
      <div className="flex flex-col items-center animate-float z-10">
        <div className="w-40 h-40 mb-2 relative">
           <Logo showText={false} className="w-full h-full" />
        </div>
        <h1 className="text-5xl font-heading font-bold text-ocean-venice dark:text-meteor tracking-tight mb-2">glowyze</h1>
        <p className="text-ocean-curious dark:text-sky text-sm tracking-[0.2em] uppercase font-light">Celestial Face Analyzer</p>
      </div>

      {/* Loading Bar */}
      <div className="w-64 h-1.5 bg-white/50 dark:bg-galaxy/50 border border-ocean-curious/30 dark:border-universe/30 rounded-full mt-12 overflow-hidden z-10">
        <div 
          className="h-full bg-gradient-to-r from-ocean-seagull to-ocean-curious dark:from-universe dark:to-sky rounded-full transition-all duration-300 ease-out shadow-[0_0_15px_rgba(112,150,209,0.8)]"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <p className="text-ocean-curious dark:text-universe text-xs mt-3 font-medium animate-pulse">Initializing AI...</p>
    </div>
  );
};