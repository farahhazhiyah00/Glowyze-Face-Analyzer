import React, { useRef } from 'react';
import { UserProfile } from '../types';
import { X, Moon, Sun, Globe, Camera, User, LogOut } from 'lucide-react';

interface SettingsProps {
  user: UserProfile;
  onUpdate: (updatedProfile: UserProfile) => void;
  onClose: () => void;
  onLogout: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ user, onUpdate, onClose, onLogout }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdate({ ...user, profilePhoto: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleTheme = () => {
    onUpdate({ ...user, theme: user.theme === 'light' ? 'dark' : 'light' });
  };

  const toggleLanguage = (lang: 'en' | 'id') => {
    onUpdate({ ...user, language: lang });
  };

  const t = {
    settings: user.language === 'id' ? 'Pengaturan' : 'Settings',
    profile: user.language === 'id' ? 'Foto Profil' : 'Profile Photo',
    changePhoto: user.language === 'id' ? 'Ganti Foto' : 'Change Photo',
    appearance: user.language === 'id' ? 'Tampilan' : 'Appearance',
    darkMode: user.language === 'id' ? 'Mode Gelap' : 'Dark Mode',
    language: user.language === 'id' ? 'Bahasa' : 'Language',
    close: user.language === 'id' ? 'Tutup' : 'Close',
    logout: user.language === 'id' ? 'Keluar Akun' : 'Log Out',
    logoutConfirm: user.language === 'id' ? 'Apakah Anda yakin ingin keluar?' : 'Are you sure you want to log out?'
  };

  const handleLogoutClick = () => {
    if (window.confirm(t.logoutConfirm)) {
      onLogout();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-galaxy/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-milkyway dark:bg-galaxy w-full max-w-md rounded-3xl shadow-xl overflow-hidden transition-colors duration-300 border border-venus/50 dark:border-planetary/30">
        <div className="p-4 border-b border-venus/30 dark:border-planetary/30 flex justify-between items-center bg-white/50 dark:bg-galaxy/50">
          <h2 className="text-xl font-heading font-bold text-galaxy dark:text-meteor">{t.settings}</h2>
          <button onClick={onClose} className="p-2 hover:bg-venus/20 dark:hover:bg-planetary/20 rounded-full transition text-universe">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Photo */}
          <div className="flex flex-col items-center">
             <div className="relative mb-3">
              <div className="w-24 h-24 rounded-full bg-venus/30 dark:bg-planetary/30 overflow-hidden border-4 border-white dark:border-galaxy shadow-md">
                 {user.profilePhoto ? (
                    <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center text-universe/50">
                      <User size={40} />
                    </div>
                 )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-planetary text-meteor rounded-full shadow hover:bg-galaxy transition"
              >
                <Camera size={14} />
              </button>
             </div>
             <p className="text-sm font-medium text-galaxy/70 dark:text-meteor/70">{t.changePhoto}</p>
             <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
          </div>

          {/* Theme */}
          <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-galaxy/50 rounded-2xl border border-venus/30 dark:border-planetary/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-planetary/10 text-planetary flex items-center justify-center">
                {user.theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
              </div>
              <div>
                <p className="font-semibold text-galaxy dark:text-meteor">{t.darkMode}</p>
                <p className="text-xs text-universe">{user.theme === 'light' ? 'Off' : 'On'}</p>
              </div>
            </div>
            <button 
              onClick={toggleTheme}
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${user.theme === 'dark' ? 'bg-planetary' : 'bg-venus'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${user.theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Language */}
          <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-galaxy/50 rounded-2xl border border-venus/30 dark:border-planetary/30">
             <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-universe/10 text-universe flex items-center justify-center">
                <Globe size={20} />
              </div>
              <div>
                <p className="font-semibold text-galaxy dark:text-meteor">{t.language}</p>
                <p className="text-xs text-universe">{user.language === 'en' ? 'English' : 'Bahasa Indonesia'}</p>
              </div>
            </div>
            <div className="flex gap-1 bg-venus/20 dark:bg-planetary/20 p-1 rounded-lg">
               <button 
                 onClick={() => toggleLanguage('en')}
                 className={`px-3 py-1 text-xs font-bold rounded-md transition ${user.language === 'en' ? 'bg-white text-planetary shadow-sm' : 'text-universe hover:text-galaxy dark:hover:text-meteor'}`}
               >
                 EN
               </button>
               <button 
                 onClick={() => toggleLanguage('id')}
                 className={`px-3 py-1 text-xs font-bold rounded-md transition ${user.language === 'id' ? 'bg-white text-planetary shadow-sm' : 'text-universe hover:text-galaxy dark:hover:text-meteor'}`}
               >
                 ID
               </button>
            </div>
          </div>

          {/* Logout */}
          <button 
            onClick={handleLogoutClick}
            className="w-full flex items-center justify-center gap-2 p-3 mt-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition font-medium border border-transparent hover:border-red-100"
          >
            <LogOut size={20} />
            {t.logout}
          </button>
        </div>
      </div>
    </div>
  );
};