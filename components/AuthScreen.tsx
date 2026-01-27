
import React, { useState } from 'react';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Logo } from './Logo';

interface AuthScreenProps {
  onComplete: (email: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onComplete }) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      onComplete(email);
    }
  };

  return (
    <div className="h-full flex flex-col justify-center px-8 bg-ocean-50 dark:bg-galaxy relative overflow-hidden animate-fadeIn transition-colors duration-300">
      {/* Background Decor - Organic Shapes */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-ocean-100/50 dark:bg-ocean-900/10 rounded-bl-[100px] -z-0 blur-xl"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-ocean-200/50 dark:bg-ocean-800/10 rounded-tr-[80px] -z-0 blur-xl"></div>
      
      <div className="z-10 w-full max-w-sm mx-auto">
        <div className="mb-10 text-center">
           <div className="w-24 h-24 mb-4 mx-auto">
             <Logo showText={false} className="w-full h-full" />
           </div>
          <h1 className="text-4xl font-heading font-bold text-slate-900 dark:text-white mb-3">
            Welcome
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-light">Enter your email to access your personal skin suite.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 pl-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-ocean-600 dark:text-ocean-400" size={20} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-12 pr-4 py-3.5 bg-white/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-full outline-none focus:ring-2 focus:ring-ocean-500 text-slate-900 dark:text-white placeholder:text-slate-400 transition backdrop-blur-sm"
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-ocean-600 dark:bg-ocean-500 text-white py-3.5 rounded-full font-bold shadow-lg shadow-ocean-600/30 dark:shadow-ocean-500/20 hover:bg-ocean-700 dark:hover:bg-ocean-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
          >
            Enter
            <ArrowRight size={18} />
          </button>
        </form>
      </div>

      <div className="mt-12 space-y-3 z-10">
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <CheckCircle2 size={14} className="text-ocean-600 dark:text-ocean-400" />
          <span>Free AI Skin Analysis</span>
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <CheckCircle2 size={14} className="text-ocean-600 dark:text-ocean-400" />
          <span>Secure & Encrypted Data</span>
        </div>
      </div>
    </div>
  );
};
