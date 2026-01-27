import React, { useState } from 'react';
import { UserProfile, ScanResult } from '../types';
import { ScanFace, MessageCircle, Sun, Moon, Settings as SettingsIcon, ChevronRight, LayoutDashboard, Sparkles } from 'lucide-react';
import { Settings } from './Settings';

interface HomeProps {
  user: UserProfile;
  latestScan: ScanResult | null;
  onNavigate: (page: string) => void;
  onUpdateProfile: (profile: UserProfile) => void;
  onLogout: () => void;
}

export const Home: React.FC<HomeProps> = ({ user, latestScan, onNavigate, onUpdateProfile, onLogout }) => {
  const [showSettings, setShowSettings] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-28 pt-6 md:pt-10 px-6">
      {showSettings && <Settings user={user} onUpdate={onUpdateProfile} onClose={() => setShowSettings(false)} onLogout={onLogout} />}

      {/* Hero Header Area */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
        <div>
          <p className="text-ocean-curious dark:text-sky font-bold text-xs md:text-sm mb-1 uppercase tracking-[0.2em]">
            Good {getGreeting()}
          </p>
          <h1 className="text-3xl md:text-5xl font-heading font-bold text-ocean-venice dark:text-white truncate">
            Hi, {user.name.split(' ')[0]} ✨
          </h1>
        </div>
        <button 
          onClick={() => setShowSettings(true)}
          className="absolute top-6 right-6 md:relative md:top-auto md:right-auto w-10 h-10 md:w-12 md:h-12 rounded-full md:rounded-2xl bg-white/60 dark:bg-galaxy/60 backdrop-blur-sm shadow-sm flex items-center justify-center border border-ocean-french/30 dark:border-planetary/30 active:scale-90 transition-transform md:order-last"
        >
          <SettingsIcon className="text-ocean-venice dark:text-meteor" size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Main Status Card */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-ocean-curious to-ocean-venice dark:from-planetary dark:to-galaxy rounded-[2.5rem] p-6 md:p-10 text-white relative overflow-hidden shadow-xl shadow-ocean-curious/20 dark:shadow-none min-h-[280px] md:min-h-[320px] flex flex-col justify-center">
            <div className="relative z-10">
              <p className="text-ocean-pattens/80 text-xs md:text-sm font-bold uppercase tracking-widest mb-2 md:mb-4">Current Skin Health Score</p>
              <div className="flex items-baseline gap-2 mb-6 md:mb-8">
                <span className="text-6xl md:text-8xl lg:text-9xl font-heading font-bold">{latestScan ? latestScan.overallScore : '--'}</span>
                <span className="text-ocean-pattens/60 text-xl md:text-2xl font-bold">/100</span>
              </div>
              <button 
                onClick={() => onNavigate('/scan')}
                className="bg-white text-ocean-venice px-6 md:px-10 py-3 md:py-4 rounded-full font-bold shadow-lg active:scale-95 transition-all hover:px-8 md:hover:px-12 text-sm md:text-base flex items-center gap-2"
              >
                <ScanFace size={18} className="md:hidden" />
                Launch New Analysis
              </button>
            </div>
            {/* Decoration */}
            <div className="absolute -right-10 -top-10 w-60 h-60 bg-white/10 rounded-full blur-[80px]"></div>
            <div className="absolute right-4 bottom-4 md:right-10 md:bottom-10">
              <Sparkles size={80} className="text-white/5 opacity-50 md:w-[120px] md:h-[120px]" />
            </div>
          </div>
        </div>

        {/* Sidebar Style Quick Info (Desktop Only effectively) */}
        <div className="space-y-4 md:space-y-6">
            <h3 className="font-heading font-bold text-xl md:text-2xl text-ocean-venice dark:text-white hidden md:block">Quick Insights</h3>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
              <button onClick={() => onNavigate('/chat')} className="bg-white/60 dark:bg-galaxy/50 p-5 md:p-6 rounded-[2rem] border border-ocean-french/30 dark:border-planetary/30 flex flex-col items-center lg:items-start gap-3 md:gap-4 active:scale-95 transition-transform group hover:bg-white dark:hover:bg-galaxy/70 shadow-sm">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-ocean-french/30 dark:bg-planetary/30 rounded-2xl flex items-center justify-center text-ocean-curious dark:text-sky group-hover:bg-ocean-curious group-hover:text-white dark:group-hover:bg-planetary transition-colors">
                  <MessageCircle size={24} className="md:w-[28px] md:h-[28px]" />
                </div>
                <div className="text-center lg:text-left">
                  <span className="block font-bold text-ocean-venice dark:text-meteor text-sm md:text-base">Talk to Glowy</span>
                  <span className="text-[10px] md:text-xs text-ocean-venice/60 dark:text-meteor/60">AI Beauty Bestie</span>
                </div>
              </button>
              
              <button onClick={() => onNavigate('/recommendations')} className="bg-white/60 dark:bg-galaxy/50 p-5 md:p-6 rounded-[2rem] border border-ocean-french/30 dark:border-planetary/30 flex flex-col items-center lg:items-start gap-3 md:gap-4 active:scale-95 transition-transform group hover:bg-white dark:hover:bg-galaxy/70 shadow-sm">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-pink-50 dark:bg-pink-900/20 rounded-2xl flex items-center justify-center text-pink-500 group-hover:bg-pink-500 group-hover:text-white transition-colors">
                  <Sun size={24} className="md:w-[28px] md:h-[28px]" />
                </div>
                <div className="text-center lg:text-left">
                  <span className="block font-bold text-ocean-venice dark:text-meteor text-sm md:text-base">Daily Routine</span>
                  <span className="text-[10px] md:text-xs text-ocean-venice/60 dark:text-meteor/60">Customized for you</span>
                </div>
              </button>
            </div>
        </div>

        {/* Recent Report Section */}
        {latestScan && (
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <h3 className="font-heading font-bold text-xl md:text-2xl text-ocean-venice dark:text-white">Recent Analysis</h3>
              <button onClick={() => onNavigate('/history')} className="text-ocean-curious text-xs md:text-sm font-bold uppercase tracking-widest flex items-center gap-1 md:gap-2 hover:underline">
                History <ChevronRight size={14} className="md:w-4 md:h-4" />
              </button>
            </div>
            <div 
              onClick={() => onNavigate('/history')}
              className="bg-white/70 dark:bg-galaxy/50 p-4 md:p-6 rounded-[2.5rem] border border-ocean-french/30 dark:border-planetary/30 flex items-center gap-4 md:gap-6 cursor-pointer hover:shadow-lg transition-all"
            >
              <div className="w-24 h-24 md:w-40 md:h-40 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden bg-ocean-french/30 flex-shrink-0 shadow-inner">
                <img src={latestScan.imageUri} alt="Face" className="w-full h-full object-cover scale-110" />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-start mb-1 md:mb-2">
                   <h4 className="font-heading font-bold text-lg md:text-2xl text-ocean-venice dark:text-white">{new Date(latestScan.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</h4>
                   <span className="text-ocean-curious dark:text-sky font-black text-xl md:text-2xl">{latestScan.overallScore}%</span>
                </div>
                <p className="text-ocean-venice/60 dark:text-meteor/60 leading-relaxed text-xs md:text-sm lg:text-base line-clamp-3 md:line-clamp-3 italic">"{latestScan.summary.replace(/[#*]/g, '').trim()}"</p>
              </div>
            </div>
          </div>
        )}

        {/* Tip of the day */}
        <div className="lg:col-span-1">
          <div className="bg-ocean-venice dark:bg-black/40 rounded-[2.5rem] p-6 md:p-8 text-white h-full flex flex-col justify-center border border-ocean-venice dark:border-white/10">
            <h3 className="font-heading font-bold text-xl md:text-2xl mb-4 md:mb-6 flex items-center gap-3">
               <Sparkles className="text-ocean-curious" />
               Glow Tip
            </h3>
            <p className="text-ocean-pattens/80 text-sm md:text-base lg:text-lg leading-relaxed mb-6 md:mb-8 font-light italic">
              "Hydration is key. Drinking enough water and using a hyaluronic acid serum can significantly improve skin elasticity and glow."
            </p>
            <div className="mt-auto flex items-center gap-3 bg-white/5 p-3 md:p-4 rounded-2xl">
              <div className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-ocean-curious animate-pulse"></div>
              <span className="text-[10px] md:text-xs font-bold text-ocean-pattens/60 uppercase tracking-[0.2em]">Skin Science Fact</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};