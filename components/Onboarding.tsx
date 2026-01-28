import React, { useState, useRef } from 'react';
import { UserProfile, SkinType, StressLevel } from '../types';
import { ChevronRight, ChevronLeft, Check, Camera, User } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const STEPS = 3;

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: '',
    age: '',
    gender: 'Female',
    skinType: SkinType.Normal,
    allergies: [],
    sleepHours: 7,
    waterIntake: 1.5,
    stressLevel: StressLevel.Medium,
    diet: 'Balanced',
    isOnboarded: false,
    profilePhoto: undefined,
    language: 'en',
    theme: 'light'
  });

  const [allergyInput, setAllergyInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNext = () => {
    if (step < STEPS) setStep(step + 1);
    else {
      onComplete({ ...formData, isOnboarded: true } as UserProfile);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const updateField = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleAllergy = (allergen: string) => {
    const current = formData.allergies || [];
    if (current.includes(allergen)) {
      updateField('allergies', current.filter(a => a !== allergen));
    } else {
      updateField('allergies', [...current, allergen]);
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateField('profilePhoto', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6 animate-fadeIn z-10 relative">
      <div className="flex flex-col items-center justify-center mb-6">
        <div className="relative">
          <div className="w-28 h-28 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-700 shadow-lg overflow-hidden flex items-center justify-center">
            {formData.profilePhoto ? (
              <img 
                src={formData.profilePhoto} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={48} className="text-slate-300 dark:text-slate-600" />
            )}
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 p-2 bg-ocean-600 text-white rounded-full shadow-md hover:bg-ocean-700 transition"
          >
            <Camera size={18} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handlePhotoUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
        <p className="text-sm text-slate-500 mt-3 font-medium">Upload Photo</p>
      </div>

      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Tell us about yourself</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
          <input 
            type="text" 
            value={formData.name || ''}
            onChange={(e) => updateField('name', e.target.value)}
            className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-ocean-400 outline-none transition bg-white/80 dark:bg-slate-800/50 dark:text-white"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Age</label>
          <input 
            type="number" 
            value={formData.age || ''}
            onChange={(e) => updateField('age', e.target.value)}
            className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-ocean-400 outline-none transition bg-white/80 dark:bg-slate-800/50 dark:text-white"
            placeholder="Age"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gender</label>
          <select 
            value={formData.gender || 'Female'}
            onChange={(e) => updateField('gender', e.target.value)}
            className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-ocean-400 outline-none bg-white/80 dark:bg-slate-800/50 dark:text-white"
          >
            <option value="Female">Female</option>
            <option value="Male">Male</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-fadeIn z-10 relative">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Skin Profile</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Skin Type</label>
          <div className="grid grid-cols-2 gap-3">
            {Object.values(SkinType).map(type => (
              <button
                key={type}
                onClick={() => updateField('skinType', type)}
                className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                  formData.skinType === type 
                    ? 'border-ocean-600 bg-ocean-50 dark:bg-ocean-900/30 text-ocean-700 dark:text-ocean-300 shadow-sm' 
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 bg-white/80 dark:bg-slate-800/50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Allergies/Sensitivities</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {['Parabens', 'Sulfates', 'Fragrance', 'Alcohol'].map(allergen => (
              <button
                key={allergen}
                onClick={() => toggleAllergy(allergen)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  formData.allergies?.includes(allergen)
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600 bg-white/80'
                }`}
              >
                {allergen}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
             <input 
              type="text" 
              value={allergyInput}
              onChange={(e) => setAllergyInput(e.target.value)}
              className="flex-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white/80 dark:bg-slate-800/50 dark:text-white"
              placeholder="Other allergies..."
            />
            <button 
              onClick={() => {
                if(allergyInput) {
                  toggleAllergy(allergyInput);
                  setAllergyInput('');
                }
              }}
              className="px-3 py-1 bg-slate-800 dark:bg-slate-700 text-white rounded-lg text-sm"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-fadeIn z-10 relative">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Lifestyle</h2>
      <div className="space-y-6">
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Sleep ({formData.sleepHours ?? 7} hrs)
            </label>
          </div>
          <input 
            type="range" 
            min="4" 
            max="10" 
            step="0.5"
            value={formData.sleepHours ?? 7}
            onInput={(e) => updateField('sleepHours', parseFloat((e.target as HTMLInputElement).value))}
            onChange={(e) => updateField('sleepHours', parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-ocean-600"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>&lt; 6 hrs</span>
            <span>8+ hrs</span>
          </div>
        </div>

        <div>
           <div className="flex justify-between mb-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Water Intake ({formData.waterIntake ?? 1.5} L)
            </label>
          </div>
          <input 
            type="range" 
            min="0.5" 
            max="4" 
            step="0.1"
            value={formData.waterIntake ?? 1.5}
            onInput={(e) => updateField('waterIntake', parseFloat((e.target as HTMLInputElement).value))}
            onChange={(e) => updateField('waterIntake', parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-ocean-600"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>Low</span>
            <span>Optimal</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Stress Level</label>
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            {Object.values(StressLevel).map(level => (
              <button
                key={level}
                onClick={() => updateField('stressLevel', level)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
                  formData.stressLevel === level 
                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col p-6 bg-transparent relative">
      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-200/50 dark:bg-slate-700/50 rounded-full mb-8 overflow-hidden z-10">
        <div 
          className="h-full bg-ocean-600 transition-all duration-500 ease-out"
          style={{ width: `${(step / STEPS) * 100}%` }}
        />
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar relative z-10">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>

      <div className="mt-6 flex gap-4 z-10">
        {step > 1 && (
          <button 
            onClick={handleBack}
            className="flex-1 py-3.5 border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <ChevronLeft size={20} />
            Back
          </button>
        )}
        <button 
          onClick={handleNext}
          disabled={step === 1 && !formData.name}
          className={`flex-1 py-3.5 bg-ocean-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg shadow-ocean-600/20 transition ${
            step === 1 && !formData.name ? 'opacity-50 cursor-not-allowed' : 'hover:bg-ocean-700'
          }`}
        >
          {step === STEPS ? 'Finish' : 'Next'}
          {step === STEPS ? <Check size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>
    </div>
  );
};