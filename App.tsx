
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Onboarding } from './components/Onboarding';
import { Home } from './components/Home';
import { FaceScan } from './components/FaceScan';
import { ChatAssistant } from './components/ChatAssistant';
import { History } from './components/History';
import { Recommendations } from './components/Recommendations';
import { SplashScreen } from './components/SplashScreen';
import { AuthScreen } from './components/AuthScreen';
import { UserProfile, ScanResult } from './types';
import { Home as HomeIcon, ScanFace, Sparkles, BarChart2, FlaskConical, LayoutDashboard } from 'lucide-react';
import { Logo } from './components/Logo';

const Bubbles = () => {
  const bubbles = Array.from({ length: 25 });
  return (
    <div className="bubble-bg">
      {bubbles.map((_, i) => (
        <div 
          key={i}
          className="bubble"
          style={{
            width: `${Math.random() * 100 + 40}px`,
            height: `${Math.random() * 100 + 40}px`,
            left: `${Math.random() * 100}%`,
            animationDuration: `${Math.random() * 10 + 20}s`,
            animationDelay: `${Math.random() * 5}s`
          }}
        />
      ))}
    </div>
  );
};

const WaveOverlay = ({ active }: { active: boolean }) => (
  <div className={`wave-container ${active ? 'active' : ''}`}>
    <div className="wave-elevator"></div>
  </div>
);

const NavItem = ({ to, icon: Icon, label, active, onClick, desktop = false }: any) => (
  <button
    onClick={() => onClick(to)}
    className={`flex items-center transition-all duration-300 ${
      desktop 
        ? `w-full gap-4 px-6 py-4 rounded-2xl mb-2 ${active ? 'bg-ocean-curious text-white shadow-lg' : 'text-ocean-venice/60 dark:text-meteor/60 hover:bg-ocean-french/30 dark:hover:bg-white/5'}`
        : `flex-col gap-1 p-2 ${active ? 'text-ocean-curious dark:text-sky scale-110 font-bold' : 'text-ocean-venice/50 dark:text-meteor/50'}`
    }`}
  >
    <Icon size={desktop ? 22 : (active ? 26 : 24)} strokeWidth={active ? 2.5 : 2} />
    <span className={`${desktop ? 'text-sm font-semibold' : 'text-[10px] uppercase tracking-tighter'}`}>{label}</span>
  </button>
);

const Layout: React.FC<{ children: React.ReactNode, onNavigate: (p: string) => void }> = ({ children, onNavigate }) => {
  const location = useLocation();
  const hideNav = location.pathname === '/scan';

  return (
    <div className="h-full flex flex-col md:flex-row bg-transparent">
      {/* Desktop Sidebar - Visible on MD (768px) and up */}
      {!hideNav && (
        <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white/60 dark:bg-galaxy/80 backdrop-blur-xl border-r border-ocean-french/30 dark:border-planetary/30 p-6 z-50 h-full transition-all">
          <div className="mb-10 w-full flex justify-center items-center">
            <Logo showText className="w-24" />
          </div>
          <nav className="flex-1 overflow-y-auto no-scrollbar">
            <NavItem desktop to="/" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/'} onClick={onNavigate} />
            <NavItem desktop to="/recommendations" icon={FlaskConical} label="Skincare Advice" active={location.pathname === '/recommendations'} onClick={onNavigate} />
            <NavItem desktop to="/history" icon={BarChart2} label="Skin Tracking" active={location.pathname === '/history'} onClick={onNavigate} />
            <NavItem desktop to="/chat" icon={Sparkles} label="Glowy AI" active={location.pathname === '/chat'} onClick={onNavigate} />
          </nav>
          <div className="mt-4 pt-4 border-t border-ocean-french/30 dark:border-planetary/30">
              <button 
                onClick={() => onNavigate('/scan')}
                className="w-full py-4 bg-ocean-curious dark:bg-planetary text-white dark:text-meteor rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg hover:bg-ocean-venice dark:hover:bg-galaxy transition-all active:scale-[0.98]"
              >
                <ScanFace size={20} />
                <span>New Analysis</span>
              </button>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 overflow-hidden relative ${!hideNav ? 'md:pb-0' : ''}`}>
        <div className="w-full h-full max-w-7xl mx-auto md:px-0 lg:px-6 relative">
          {children}
        </div>
      </main>
      
      {/* Mobile Bottom Navigation - Sticky at bottom */}
      {!hideNav && (
        <nav className="md:hidden bg-white/95 dark:bg-galaxy/95 backdrop-blur-xl border-t border-ocean-french/30 dark:border-planetary/30 px-6 pb-safe pt-2 flex justify-between items-center z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] shrink-0 h-[calc(4rem+env(safe-area-inset-bottom))]">
          <NavItem to="/recommendations" icon={FlaskConical} label="Care" active={location.pathname === '/recommendations'} onClick={onNavigate} />
          <NavItem to="/history" icon={BarChart2} label="Track" active={location.pathname === '/history'} onClick={onNavigate} />
          
          <button 
            onClick={() => onNavigate('/')}
            className="w-14 h-14 bg-ocean-curious dark:bg-planetary rounded-full flex items-center justify-center -mt-8 shadow-xl shadow-ocean-curious/30 dark:shadow-planetary/30 border-4 border-ocean-pattens dark:border-galaxy text-white active:scale-90 transition-transform"
          >
            <HomeIcon size={26} fill="currentColor" />
          </button>

          <NavItem to="/chat" icon={Sparkles} label="Glowy" active={location.pathname === '/chat'} onClick={onNavigate} />
          <NavItem to="/scan" icon={ScanFace} label="Scan" active={location.pathname === '/scan'} onClick={onNavigate} />
        </nav>
      )}
    </div>
  );
};

const AppContent = () => {
  const [appState, setAppState] = useState<'SPLASH' | 'AUTH' | 'ONBOARDING' | 'HOME'>('SPLASH');
  const [waveActive, setWaveActive] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const s = localStorage.getItem('glowyze_profile');
    return s ? JSON.parse(s) : null;
  });
  const [scans, setScans] = useState<ScanResult[]>([]);
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    setWaveActive(true);
    setTimeout(() => {
      navigate(path);
      setTimeout(() => setWaveActive(false), 800);
    }, 600);
  };

  const updateProfile = (p: UserProfile) => {
    setUserProfile(p);
    localStorage.setItem('glowyze_profile', JSON.stringify(p));
    if (p.theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  useEffect(() => {
    if (userProfile?.theme === 'dark') document.documentElement.classList.add('dark');
  }, [userProfile]);

  const handleAuthComplete = (email: string) => {
    // Simpan email ke profile dan lanjut ke onboarding
    const newProfile = { 
      ...(userProfile || {}), 
      email, 
      isOnboarded: false 
    } as UserProfile;
    updateProfile(newProfile);
    setAppState('ONBOARDING');
  };

  const handleOnboardingComplete = (profile: UserProfile) => {
    updateProfile(profile);
    setAppState('HOME');
  };

  const handleSplashFinish = () => {
    if (userProfile?.isOnboarded) {
      setAppState('HOME');
    } else if (userProfile?.email) {
      // Jika email sudah ada tapi belum selesai onboarding
      setAppState('ONBOARDING');
    } else {
      setAppState('AUTH');
    }
  };

  return (
    <>
      <WaveOverlay active={waveActive} />
      <Bubbles />
      
      {appState === 'SPLASH' && <SplashScreen onFinish={handleSplashFinish} />}
      {appState === 'AUTH' && <AuthScreen onComplete={handleAuthComplete} />}
      {appState === 'ONBOARDING' && <Onboarding onComplete={handleOnboardingComplete} />}
      
      {appState === 'HOME' && userProfile && (
        <Layout onNavigate={handleNavigate}>
          <Routes>
            <Route path="/" element={<Home user={userProfile} latestScan={scans[scans.length-1]} onNavigate={handleNavigate} onUpdateProfile={updateProfile} onLogout={() => setAppState('AUTH')} />} />
            <Route path="/scan" element={<FaceScan onScanComplete={(r) => { setScans(s => [...s, r]); handleNavigate('/history'); }} onClose={() => handleNavigate('/')} />} />
            <Route path="/chat" element={<ChatAssistant userProfile={userProfile} />} />
            <Route path="/history" element={<History scans={scans} user={userProfile} onUpdateProfile={updateProfile} />} />
            <Route path="/recommendations" element={<Recommendations user={userProfile} latestScan={scans[scans.length-1]} />} />
          </Routes>
        </Layout>
      )}
    </>
  );
};

export default function App() { return <Router><AppContent /></Router>; }
