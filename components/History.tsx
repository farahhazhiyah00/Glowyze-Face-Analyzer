
import React, { useState, useEffect, useRef } from 'react';
import { AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area } from 'recharts';
import { ScanResult, UserProfile } from '../types';
import { Calendar, Plus, CheckCircle, Circle, Trash2, TrendingUp, X, ArrowLeft, ShieldCheck, Info, ChevronRight } from 'lucide-react';

interface HistoryProps {
  scans: ScanResult[];
  user: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
}

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  isCustom?: boolean;
}

// --- Fireworks Component ---
const Fireworks: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = [];
    const colors = ['#334EAC', '#7096D1', '#BAD6EB', '#D0E3FF', '#FFF9F0']; // Updated to Theme Colors

    class Particle {
      x: number;
      y: number;
      radius: number;
      color: string;
      velocity: { x: number; y: number };
      alpha: number;

      constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        this.radius = Math.random() * 3 + 1;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 6 + 2;
        this.velocity = {
          x: Math.cos(angle) * velocity,
          y: Math.sin(angle) * velocity
        };
        this.alpha = 1;
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
      }

      update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.velocity.y += 0.05; // gravity
        this.velocity.x *= 0.99; // friction
        this.velocity.y *= 0.99;
        this.alpha -= 0.01;
      }
    }

    const createFirework = (x: number, y: number) => {
      const color = colors[Math.floor(Math.random() * colors.length)];
      for (let i = 0; i < 40; i++) {
        particles.push(new Particle(x, y, color));
      }
    };

    let animationId: number;
    let timer = 0;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.1)'; // Trail effect (Galaxy)
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Random fireworks
      if (timer % 30 === 0) {
        createFirework(
          Math.random() * canvas.width,
          Math.random() * canvas.height * 0.6 + canvas.height * 0.1
        );
      }
      timer++;

      particles.forEach((particle, index) => {
        if (particle.alpha > 0) {
          particle.update();
          particle.draw();
        } else {
          particles.splice(index, 1);
        }
      });
    };

    animate();

    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-galaxy/80 animate-fadeIn backdrop-blur-sm">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="relative z-10 flex flex-col items-center p-8 text-center animate-bounce-in">
        <h2 className="text-4xl md:text-5xl font-heading font-bold text-meteor mb-6 drop-shadow-lg">
          {message}
        </h2>
        <button 
          onClick={onClose}
          className="mt-8 px-8 py-3 bg-white text-galaxy rounded-full font-bold shadow-lg hover:scale-105 transition hover:bg-sky"
        >
          Close
        </button>
      </div>
    </div>
  );
};

// --- Main History Component ---
export const History: React.FC<HistoryProps> = ({ scans, user, onUpdateProfile }) => {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [selectedScan, setSelectedScan] = useState<ScanResult | null>(null);
  
  // Celebration State
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');
  const hasCelebratedToday = useRef(false);

  // Initialize checklist
  useEffect(() => {
    // Determine labels based on language
    const lang = user.language || 'en';
    const isId = lang === 'id';

    const defaultItems: ChecklistItem[] = [
      { id: 'sleep', label: isId ? 'Tidur 7-8 jam' : 'Sleep 7-8 hours', checked: false },
      { id: 'am_skin', label: isId ? 'Memakai skincare pagi' : 'Morning skincare', checked: false },
      { id: 'water', label: isId ? 'Minum air mineral minimal 1,5 liter' : 'Drink 1.5L water', checked: false },
      { id: 'junkfood', label: isId ? 'Hindari junkfood' : 'Avoid junk food', checked: false },
      { id: 'pm_skin', label: isId ? 'Menggunakan skincare malam' : 'Night skincare', checked: false },
    ];

    // Load custom items from profile
    const customItems: ChecklistItem[] = (user.customChecklist || []).map((label, index) => ({
      id: `custom_${index}`,
      label,
      checked: false,
      isCustom: true
    }));

    // Load checked state from local storage for today
    const todayKey = new Date().toDateString();
    const savedState = localStorage.getItem(`checklist_${todayKey}`);
    
    let initialList = [...defaultItems, ...customItems];

    if (savedState) {
      const parsedState: Record<string, boolean> = JSON.parse(savedState);
      initialList = initialList.map(item => ({
        ...item,
        checked: !!parsedState[item.id]
      }));
    }

    setChecklist(initialList);
    
    // Check if already completed on load to prevent auto-popup if checking page later
    const allChecked = initialList.length > 0 && initialList.every(i => i.checked);
    if (allChecked) {
      hasCelebratedToday.current = true;
    }

  }, [user.language, user.customChecklist]);

  const saveChecklistState = (updatedList: ChecklistItem[]) => {
    const todayKey = new Date().toDateString();
    const stateObj: Record<string, boolean> = {};
    updatedList.forEach(item => {
      stateObj[item.id] = item.checked;
    });
    localStorage.setItem(`checklist_${todayKey}`, JSON.stringify(stateObj));
  };

  const checkCompletion = (list: ChecklistItem[]) => {
    const allChecked = list.length > 0 && list.every(item => item.checked);
    
    if (allChecked && !hasCelebratedToday.current) {
      const messages = [
        "Congratulations! You've completed it successfully",
        "Congrats! You finally finished it!",
        "Well done!",
        "Nice work!"
      ];
      // Deterministic randomness based on day to vary it daily, or just random
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      setCelebrationMessage(randomMsg);
      setShowCelebration(true);
      hasCelebratedToday.current = true;
    } else if (!allChecked) {
      // Reset if user unchecks something, so they can celebrate again if they re-complete
      hasCelebratedToday.current = false;
    }
  };

  const toggleCheck = (id: string) => {
    const updated = checklist.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setChecklist(updated);
    saveChecklistState(updated);
    checkCompletion(updated);
  };

  const addCustomItem = () => {
    if (!newItemText.trim()) return;
    
    // Save to user profile (persistent)
    const updatedCustomList = [...(user.customChecklist || []), newItemText];
    onUpdateProfile({ ...user, customChecklist: updatedCustomList });

    setNewItemText('');
    setIsAdding(false);
  };

  const deleteCustomItem = (label: string) => {
     // Remove from user profile
     const updatedCustomList = (user.customChecklist || []).filter(l => l !== label);
     onUpdateProfile({ ...user, customChecklist: updatedCustomList });
  };

  // Calculate Progress
  const completedCount = checklist.filter(c => c.checked).length;
  const totalCount = checklist.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Chart Data - Using actual scans
  const chartData = scans.length > 0 ? scans.slice(-7).map(s => ({
    date: new Date(s.date).toLocaleDateString(user.language === 'id' ? 'id-ID' : 'en-US', { weekday: 'short' }),
    score: s.overallScore
  })) : [
    { date: 'Mon', score: 65 },
    { date: 'Tue', score: 68 },
    { date: 'Wed', score: 72 },
    { date: 'Thu', score: 70 },
    { date: 'Fri', score: 75 },
  ];

  const t = {
    title: user.language === 'id' ? 'Pelacakan Harian' : 'Daily Track',
    todayProgress: user.language === 'id' ? 'Progres Hari Ini' : 'Today\'s Progress',
    weeklyGraph: user.language === 'id' ? 'Grafik Mingguan' : 'Weekly Graph',
    addItem: user.language === 'id' ? 'Tambah checklist...' : 'Add checklist item...',
    cancel: user.language === 'id' ? 'Batal' : 'Cancel',
    add: user.language === 'id' ? 'Tambah' : 'Add',
    delete: user.language === 'id' ? 'Hapus' : 'Delete',
    checklistTitle: user.language === 'id' ? 'Checklist Hari Ini' : "Today's Checklist",
    historyTitle: user.language === 'id' ? 'Riwayat Scan' : 'Scan History',
    noHistory: user.language === 'id' ? 'Belum ada riwayat scan.' : 'No scan history yet.',
  };

  const parseInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-ocean-900 dark:text-meteor">{part.slice(2, -2)}</strong>;
      }
      const italicParts = part.split(/(\*.*?\*)/g);
      return (
        <span key={index}>
          {italicParts.map((sub, j) => {
             if (sub.startsWith('*') && sub.endsWith('*') && sub.length > 2) {
                return <em key={j} className="italic">{sub.slice(1, -1)}</em>;
             }
             return sub;
          })}
        </span>
      );
    });
  };

  const formatSummary = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      const clean = line.trim();
      if (!clean) return <div key={i} className="h-3" />;
      
      if (clean.startsWith('###')) return <h3 key={i} className="font-heading font-bold text-ocean-900 dark:text-meteor mt-2 mb-1">{parseInline(clean.replace(/^###\s*/, ''))}</h3>;
      if (clean.startsWith('##')) return <h2 key={i} className="text-lg font-heading font-bold text-ocean-900 dark:text-meteor mt-3 mb-2">{parseInline(clean.replace(/^##\s*/, ''))}</h2>;

      if (clean.startsWith('* ') || clean.startsWith('- ') || clean.startsWith('• ')) {
        return (
          <div key={i} className="flex gap-2 mb-1 pl-1">
            <span className="w-1.5 h-1.5 rounded-full bg-ocean-500 dark:bg-ocean-400 mt-2 flex-shrink-0" />
            <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{parseInline(clean.replace(/^[\*\-•]\s*/, ''))}</span>
          </div>
        );
      }
      
      if (/^\d+\./.test(clean)) {
        const match = clean.match(/^(\d+)\.\s+(.*)/);
        if (match) {
           return (
             <div key={i} className="flex gap-2 mb-1 pl-1">
               <span className="text-sm font-bold text-ocean-600 dark:text-ocean-400">{match[1]}.</span>
               <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{parseInline(match[2])}</span>
             </div>
           );
        }
      }

      return <p key={i} className="text-sm text-slate-700 dark:text-slate-300 mb-2 leading-relaxed">{parseInline(clean)}</p>;
    });
  };

  const getMetricColor = (val: number) => {
    if (val < 20) return 'bg-emerald-500';
    if (val < 45) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  // Full Detail View Overlay
  if (selectedScan) {
    return (
      <div className="h-full bg-white dark:bg-galaxy flex flex-col overflow-y-auto no-scrollbar animate-fadeIn z-50 relative">
        {/* Detail Header */}
        <div className="relative h-64 flex-shrink-0">
            {selectedScan.imageUri && (
                <img src={selectedScan.imageUri} alt="Result" className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-galaxy via-transparent to-transparent"></div>
            
            {/* Back Button */}
            <button 
                onClick={() => setSelectedScan(null)}
                className="absolute top-4 left-4 p-2 bg-white/20 dark:bg-galaxy/20 backdrop-blur-md rounded-full text-slate-900 dark:text-meteor hover:bg-white/40 transition"
            >
                <ArrowLeft size={24} />
            </button>

            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                <div>
                <span className="bg-ocean-600 dark:bg-ocean-500 text-white dark:text-meteor text-[10px] font-black px-3 py-1 rounded-full tracking-widest uppercase mb-2 inline-block">
                    {new Date(selectedScan.date).toLocaleDateString()}
                </span>
                <h2 className="text-4xl font-heading font-bold text-slate-900 dark:text-white leading-none">Skin Report</h2>
                </div>
                <div className="bg-white/80 dark:bg-galaxy/80 p-3 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 flex flex-col items-center backdrop-blur-sm">
                <span className="text-[10px] font-bold text-ocean-600 dark:text-ocean-400 uppercase">Score</span>
                <span className="text-3xl font-black text-ocean-600 dark:text-ocean-400">{selectedScan.overallScore}</span>
                </div>
            </div>
        </div>

        {/* Metrics Grid */}
        <div className="px-6 space-y-6 pb-28">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-6">
                <ShieldCheck className="text-ocean-600 dark:text-ocean-400" size={20} />
                <h3 className="font-heading font-bold text-slate-900 dark:text-white text-lg">Detailed Analysis</h3>
                </div>
                
                <div className="space-y-5">
                {Object.entries(selectedScan.metrics).map(([key, val]) => (
                    <div key={key}>
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 capitalize">
                        {key === 'acne' ? 'Acne' : key === 'wrinkles' ? 'Wrinkles' : key === 'pigmentation' ? 'Pigmentation' : 'Texture'}
                        </span>
                        <span className="text-xs font-black text-ocean-600 dark:text-ocean-400">{val as number}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${getMetricColor(val as number)} shadow-[0_0_8px_rgba(0,0,0,0.1)]`}
                        style={{ width: `${val}%` }}
                        />
                    </div>
                    </div>
                ))}
                </div>
            </div>

            {/* AI Summary */}
            <div className="bg-ocean-50 dark:bg-ocean-900/10 rounded-3xl p-6 border border-ocean-100 dark:border-ocean-900/30">
                <div className="flex items-center gap-2 mb-3">
                <Info className="text-ocean-600 dark:text-ocean-400" size={18} />
                <h3 className="font-heading font-bold text-slate-900 dark:text-white text-lg">AI Glowy Insight</h3>
                </div>
                <div className="text-sm text-slate-700 dark:text-slate-300">
                   {formatSummary(selectedScan.summary)}
                </div>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-6 space-y-6 overflow-y-auto pb-24 no-scrollbar">
      {showCelebration && (
        <Fireworks 
          message={celebrationMessage} 
          onClose={() => setShowCelebration(false)} 
        />
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">{t.title}</h2>
        <div className="text-sm text-ocean-600 dark:text-ocean-400 font-medium">
          {new Date().toLocaleDateString(user.language === 'id' ? 'id-ID' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      {/* Percentage Score Card - Ocean Style */}
      <div className="bg-gradient-to-br from-ocean-600 to-ocean-500 dark:from-ocean-800 dark:to-ocean-950 rounded-[2rem] p-8 text-white dark:text-meteor shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-ocean-100 dark:text-ocean-300 text-sm font-medium mb-1 tracking-wide">{t.todayProgress}</p>
            <h1 className="text-5xl font-heading font-bold">{progressPercentage}%</h1>
            <p className="text-sm mt-2 opacity-80 font-light">
              {completedCount} of {totalCount} goals completed
            </p>
          </div>
          <div className="w-24 h-24 rounded-full border-4 border-white/10 flex items-center justify-center backdrop-blur-sm">
             <TrendingUp size={32} className="text-ocean-100" />
          </div>
        </div>
        {/* Background Decorations */}
        <div className="absolute -right-4 -bottom-4 w-40 h-40 bg-white/10 blur-3xl opacity-20 rounded-full"></div>
        <div className="absolute left-10 -top-10 w-32 h-32 bg-white/5 blur-3xl opacity-10 rounded-full"></div>
      </div>

      {/* Weekly Graph - Fix: Wrapped in relative container with non-zero height for ResponsiveContainer */}
      <div className="bg-white dark:bg-slate-800/50 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-6 uppercase tracking-wide">{t.weeklyGraph}</h3>
        <div className="h-40 w-full relative min-h-[160px]">
          <ResponsiveContainer width="100%" height="100%" debounce={100}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
              <XAxis 
                dataKey="date" 
                tick={{fontSize: 12, fill: '#64748b'}} 
                axisLine={false} 
                tickLine={false} 
              />
              <YAxis domain={[0, 100]} hide />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  backgroundColor: '#fff',
                  color: '#0F172A',
                  fontFamily: 'Inter, sans-serif'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="score" 
                stroke="#0EA5E9" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorScore)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Checklist Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle size={20} className="text-ocean-600 dark:text-ocean-400"/>
            {t.checklistTitle}
          </h3>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="w-8 h-8 rounded-full bg-ocean-50 dark:bg-ocean-900/30 text-ocean-600 dark:text-ocean-400 flex items-center justify-center hover:bg-ocean-100 dark:hover:bg-ocean-900/50 transition"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Add New Item Input */}
        {isAdding && (
          <div className="mb-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm animate-fadeIn">
            <input 
              autoFocus
              type="text" 
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder={t.addItem}
              className="w-full bg-transparent border-b border-slate-200 dark:border-slate-600 pb-2 mb-3 outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setIsAdding(false)}
                className="px-4 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
              >
                {t.cancel}
              </button>
              <button 
                onClick={addCustomItem}
                disabled={!newItemText.trim()}
                className="px-4 py-1.5 text-xs font-medium bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 transition disabled:opacity-50"
              >
                {t.add}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {checklist.map((item) => (
            <div 
              key={item.id} 
              className={`flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300 ${
                item.checked 
                  ? 'bg-ocean-50 dark:bg-ocean-900/10 border-ocean-100 dark:border-ocean-900/30' 
                  : 'bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'
              }`}
            >
              <button 
                onClick={() => toggleCheck(item.id)}
                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  item.checked 
                    ? 'bg-ocean-600 dark:bg-ocean-500 border-ocean-600 dark:border-ocean-500 text-white' 
                    : 'border-slate-200 dark:border-slate-600 text-transparent hover:border-ocean-600'
                }`}
              >
                <CheckCircle size={14} className={item.checked ? 'opacity-100' : 'opacity-0'} />
              </button>
              
              <span className={`flex-1 text-sm font-medium transition-colors ${
                item.checked 
                  ? 'text-slate-400 line-through' 
                  : 'text-slate-700 dark:text-slate-200'
              }`}>
                {item.label}
              </span>

              {item.isCustom && (
                <button 
                  onClick={() => deleteCustomItem(item.label)}
                  className="text-slate-400 hover:text-red-400 transition"
                  title={t.delete}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SCAN HISTORY LIST */}
      <div className="pt-6">
        <h3 className="text-lg font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
           <Calendar size={20} className="text-ocean-600 dark:text-ocean-400"/>
           {t.historyTitle}
        </h3>
        
        {scans.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 text-slate-400 text-sm">
             {t.noHistory}
          </div>
        ) : (
          <div className="space-y-3">
            {[...scans].reverse().map((scan) => (
               <div 
                 key={scan.id}
                 onClick={() => setSelectedScan(scan)}
                 className="bg-white dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all active:scale-[0.98] group hover:bg-white dark:hover:bg-slate-800"
               >
                 <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-700 overflow-hidden flex-shrink-0">
                    {scan.imageUri && <img src={scan.imageUri} className="w-full h-full object-cover" />}
                 </div>
                 <div className="flex-1">
                    <div className="flex justify-between items-center">
                       <span className="text-xs text-slate-400">{new Date(scan.date).toLocaleString()}</span>
                       <span className={`text-xs font-bold px-2 py-0.5 rounded ${scan.overallScore > 70 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>
                         Score: {scan.overallScore}
                       </span>
                    </div>
                    {/* Cleaned preview text from markdown symbols */}
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 line-clamp-1 mt-1">
                      {scan.summary.replace(/[\#\*\-•]/g, '').trim()}
                    </p>
                 </div>
                 <ChevronRight size={16} className="text-slate-400" />
               </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
