
import React, { useState, useEffect, useRef } from 'react';
import { AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area } from 'recharts';
import { ScanResult, UserProfile } from '../types';
import { Calendar, Plus, CheckCircle, Circle, Trash2, TrendingUp, X, ArrowLeft, ShieldCheck, Info, ChevronRight, Share2, Zap, Activity, Sparkles, Layers, BarChart2 } from 'lucide-react';

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
    const colors = ['#334EAC', '#7096D1', '#BAD6EB', '#D0E3FF', '#FFF9F0'];

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
        this.velocity.y += 0.05;
        this.velocity.x *= 0.99;
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
      ctx.fillStyle = 'rgba(15, 23, 42, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

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

export const History: React.FC<HistoryProps> = ({ scans, user, onUpdateProfile }) => {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [selectedScan, setSelectedScan] = useState<ScanResult | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');
  const hasCelebratedToday = useRef(false);

  useEffect(() => {
    const lang = user.language || 'en';
    const isId = lang === 'id';
    const defaultItems: ChecklistItem[] = [
      { id: 'sleep', label: isId ? 'Tidur 7-8 jam' : 'Sleep 7-8 hours', checked: false },
      { id: 'am_skin', label: isId ? 'Memakai skincare pagi' : 'Morning skincare', checked: false },
      { id: 'water', label: isId ? 'Minum air mineral minimal 1,5 liter' : 'Drink 1.5L water', checked: false },
      { id: 'junkfood', label: isId ? 'Hindari junkfood' : 'Avoid junk food', checked: false },
      { id: 'pm_skin', label: isId ? 'Menggunakan skincare malam' : 'Night skincare', checked: false },
    ];
    const customItems: ChecklistItem[] = (user.customChecklist || []).map((label, index) => ({
      id: `custom_${index}`,
      label,
      checked: false,
      isCustom: true
    }));
    const todayKey = new Date().toDateString();
    const savedState = localStorage.getItem(`checklist_${todayKey}`);
    let initialList = [...defaultItems, ...customItems];
    if (savedState) {
      const parsedState: Record<string, boolean> = JSON.parse(savedState);
      initialList = initialList.map(item => ({ ...item, checked: !!parsedState[item.id] }));
    }
    setChecklist(initialList);
    const allChecked = initialList.length > 0 && initialList.every(i => i.checked);
    if (allChecked) hasCelebratedToday.current = true;
  }, [user.language, user.customChecklist]);

  const saveChecklistState = (updatedList: ChecklistItem[]) => {
    const todayKey = new Date().toDateString();
    const stateObj: Record<string, boolean> = {};
    updatedList.forEach(item => { stateObj[item.id] = item.checked; });
    localStorage.setItem(`checklist_${todayKey}`, JSON.stringify(stateObj));
  };

  const checkCompletion = (list: ChecklistItem[]) => {
    const allChecked = list.length > 0 && list.every(item => item.checked);
    if (allChecked && !hasCelebratedToday.current) {
      const messages = ["Congratulations!", "Well done!", "Great progress!"];
      setCelebrationMessage(messages[Math.floor(Math.random() * messages.length)]);
      setShowCelebration(true);
      hasCelebratedToday.current = true;
    } else if (!allChecked) {
      hasCelebratedToday.current = false;
    }
  };

  const toggleCheck = (id: string) => {
    const updated = checklist.map(item => item.id === id ? { ...item, checked: !item.checked } : item);
    setChecklist(updated);
    saveChecklistState(updated);
    checkCompletion(updated);
  };

  const addCustomItem = () => {
    if (!newItemText.trim()) return;
    const updatedCustomList = [...(user.customChecklist || []), newItemText];
    onUpdateProfile({ ...user, customChecklist: updatedCustomList });
    setNewItemText('');
    setIsAdding(false);
  };

  const deleteCustomItem = (label: string) => {
     const updatedCustomList = (user.customChecklist || []).filter(l => l !== label);
     onUpdateProfile({ ...user, customChecklist: updatedCustomList });
  };

  const progressPercentage = checklist.length > 0 ? Math.round((checklist.filter(c => c.checked).length / checklist.length) * 100) : 0;

  const chartData = scans.length > 0 ? scans.slice(-7).map(s => ({
    date: new Date(s.date).toLocaleDateString(user.language === 'id' ? 'id-ID' : 'en-US', { weekday: 'short' }),
    score: s.overallScore
  })) : [{ date: 'Mon', score: 65 }, { date: 'Tue', score: 70 }];

  const handleScoop = async (scan: ScanResult) => {
    const shareText = `✨ Glowyze Skin Update ✨\n\nSkin Score: ${scan.overallScore}/100\n\nGlowy AI: ${scan.summary.replace(/[#*]/g, '').slice(0, 150)}...`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Skin Report', text: shareText, url: window.location.href }); } catch (err) {}
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Report copied! ✨');
    }
  };

  const parseInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-white">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const formatSummary = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      const clean = line.trim();
      if (!clean) return <div key={i} className="h-2" />;
      if (clean.startsWith('* ') || clean.startsWith('- ') || clean.startsWith('• ')) {
        return (
          <div key={i} className="flex gap-2 mb-2 pl-1 text-sm text-white leading-relaxed">
            <span className="w-1.5 h-1.5 rounded-full bg-ocean-500 mt-2 flex-shrink-0" />
            <span>{parseInline(clean.replace(/^[\*\-•]\s*/, ''))}</span>
          </div>
        );
      }
      return <p key={i} className="text-sm text-white mb-2 leading-relaxed">{parseInline(clean)}</p>;
    });
  };

  const getMetricColor = (val: number) => {
    if (val < 20) return 'bg-emerald-500';
    if (val < 45) return 'bg-amber-400';
    if (val < 70) return 'bg-orange-500';
    return 'bg-rose-500';
  };

  const getSeverityLabel = (val: number) => {
    if (val < 20) return 'Sehat/Bersih';
    if (val < 45) return 'Ringan';
    if (val < 70) return 'Sedang';
    return 'Parah';
  };

  const getMetricIcon = (key: string) => {
    switch(key.toLowerCase()) {
      case 'acne': return <Zap size={18} />;
      case 'wrinkles': return <Activity size={18} />;
      case 'pigmentation': return <Sparkles size={18} />;
      case 'texture': return <Layers size={18} />;
      default: return <BarChart2 size={18} />;
    }
  };

  if (selectedScan) {
    return (
      <div className="h-full bg-ocean-pattens dark:bg-galaxy flex flex-col animate-fadeIn z-50 relative overflow-hidden">
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="relative h-64 flex-shrink-0">
              <img src={selectedScan.imageUri} alt="Result" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ocean-pattens dark:from-galaxy via-transparent to-transparent"></div>
              <button onClick={() => setSelectedScan(null)} className="absolute top-4 left-4 p-2.5 bg-black/10 backdrop-blur-md rounded-full text-slate-900 dark:text-meteor hover:bg-black/20 transition z-20"><ArrowLeft size={24} /></button>
              <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between gap-4 z-10">
                  <div className="flex-1">
                    <span className="bg-ocean-600 dark:bg-ocean-500 text-white dark:text-meteor text-[8px] font-black px-3 py-1.5 rounded-full tracking-widest uppercase mb-1.5 inline-block shadow-sm">Report from {new Date(selectedScan.date).toLocaleDateString()}</span>
                    <h2 className="text-3xl md:text-4xl font-heading font-bold text-slate-900 dark:text-white leading-none">Skin Report</h2>
                  </div>
                  <div className="bg-white/95 dark:bg-galaxy/90 p-3 md:p-4 rounded-[2rem] shadow-lg border border-slate-100 dark:border-slate-800 flex flex-col items-center backdrop-blur-sm">
                    <span className="text-[9px] font-black text-ocean-600 dark:text-ocean-400 uppercase tracking-widest mb-0.5">Health Score</span>
                    <span className="text-3xl md:text-4xl font-black text-ocean-600 dark:text-ocean-400 leading-none">{selectedScan.overallScore}</span>
                  </div>
              </div>
          </div>

          <div className="px-6 space-y-6 pt-8 pb-40">
              <div className="bg-white/70 dark:bg-slate-800/50 rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-2xl bg-ocean-600/10 flex items-center justify-center text-ocean-600">
                      <ShieldCheck size={22} />
                    </div>
                    <h3 className="font-heading font-bold text-slate-900 dark:text-white text-xl">Analysis Detail</h3>
                  </div>
                  
                  <div className="space-y-8">
                    {Object.entries(selectedScan.metrics).map(([key, val]) => (
                        <div key={key}>
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-3">
                              <div className={`p-2.5 rounded-xl ${getMetricColor(val as number).replace('bg-', 'bg-').replace('500', '100').replace('400', '100')} ${getMetricColor(val as number).replace('bg-', 'text-')}`}>
                                 {getMetricIcon(key)}
                              </div>
                              <span className="text-sm font-black text-slate-700 dark:text-slate-300 capitalize tracking-wide">{key}</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className={`text-xs font-black ${getMetricColor(val as number).replace('bg-', 'text-')}`}>{val as number}%</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{getSeverityLabel(val as number)}</span>
                            </div>
                          </div>
                          <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden p-[1px]">
                            <div className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${getMetricColor(val as number)}`} style={{ width: `${val}%` }} />
                          </div>
                        </div>
                    ))}
                  </div>
              </div>

              <div className="bg-ocean-600 dark:bg-ocean-900/20 rounded-[2.5rem] p-6 md:p-8 border border-white/5 relative overflow-hidden group shadow-xl">
                  <div className="flex items-center gap-3 mb-4 relative z-10">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                        <Info size={22} />
                    </div>
                    <h3 className="font-heading font-bold text-white text-xl">AI Glowy Insight</h3>
                  </div>
                  <div className="text-sm text-white leading-relaxed relative z-10 italic">
                    {formatSummary(selectedScan.summary)}
                  </div>
                  <Sparkles size={120} className="absolute -right-10 -bottom-10 text-white/5 opacity-50" />
              </div>
          </div>
        </div>
        
        <div className="flex-shrink-0 p-6 bg-gradient-to-t from-ocean-pattens dark:from-galaxy via-ocean-pattens dark:via-galaxy to-transparent pt-12 flex flex-col z-50">
           <button onClick={() => handleScoop(selectedScan)} className="w-full py-4 bg-gradient-to-r from-sky to-ocean-curious text-white rounded-[1.5rem] font-black text-[10px] md:text-xs uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"><Share2 size={20} />Scoop & Share Report</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-6 space-y-6 overflow-y-auto pb-32 no-scrollbar">
      {showCelebration && <Fireworks message={celebrationMessage} onClose={() => setShowCelebration(false)} />}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white font-heading">{user.language === 'id' ? 'Pelacakan Harian' : 'Daily Track'}</h2>
        <div className="text-sm text-ocean-600 dark:text-ocean-400 font-medium">{new Date().toLocaleDateString()}</div>
      </div>
      <div className="bg-gradient-to-br from-ocean-600 to-ocean-500 dark:from-ocean-800 dark:to-ocean-950 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden border border-white/10">
        <div className="relative z-10 flex items-center justify-between">
          <div><p className="text-ocean-100 dark:text-ocean-300 text-xs font-black uppercase tracking-widest mb-1 opacity-80">{user.language === 'id' ? 'Progres Hari Ini' : "Today's Progress"}</p><h1 className="text-6xl font-heading font-bold">{progressPercentage}%</h1></div>
          <div className="w-24 h-24 rounded-full border-4 border-white/10 flex items-center justify-center backdrop-blur-md shadow-inner"><TrendingUp size={40} className="text-ocean-100/40" /></div>
        </div>
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
      </div>
      <div className="bg-white/50 dark:bg-slate-800/30 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 backdrop-blur-sm">
        <div className="h-40 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <XAxis dataKey="date" tick={{fontSize: 10}} hide />
                    <YAxis hide />
                    <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                    <Area type="monotone" dataKey="score" stroke="#0EA5E9" strokeWidth={3} fill="#0EA5E9" fillOpacity={0.1} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-heading font-bold flex items-center gap-2 text-slate-900 dark:text-white font-heading"><CheckCircle size={20} className="text-ocean-600" />{user.language === 'id' ? 'Checklist Hari Ini' : "Today's Checklist"}</h3><button onClick={() => setIsAdding(!isAdding)} className="w-10 h-10 rounded-2xl bg-ocean-50 text-ocean-600 flex items-center justify-center shadow-sm active:scale-90 transition-transform"><Plus size={20} /></button></div>
        {isAdding && (<div className="mb-6 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 shadow-xl animate-fadeIn"><input autoFocus type="text" value={newItemText} onChange={(e) => setNewItemText(e.target.value)} placeholder={user.language === 'id' ? 'Tambah checklist...' : 'Add checklist item...'} className="w-full bg-transparent border-b-2 border-slate-100 dark:border-slate-700 pb-2 mb-4 outline-none text-slate-900 dark:text-white font-medium" /><div className="flex justify-end gap-2"><button onClick={() => setIsAdding(false)} className="px-5 py-2 text-xs font-bold text-slate-500 uppercase tracking-widest">{user.language === 'id' ? 'Batal' : 'Cancel'}</button><button onClick={addCustomItem} className="px-5 py-2 text-xs font-bold bg-ocean-600 text-white rounded-xl shadow-lg shadow-ocean-600/20 uppercase tracking-widest">{user.language === 'id' ? 'Tambah' : 'Add'}</button></div></div>)}
        <div className="space-y-4">{checklist.map((item) => (<div key={item.id} className={`flex items-center gap-3 p-5 rounded-3xl border transition-all duration-300 ${item.checked ? 'bg-ocean-50/50 border-ocean-100/50' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 shadow-sm'}`}><button onClick={() => toggleCheck(item.id)} className={`flex-shrink-0 w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${item.checked ? 'bg-ocean-600 border-ocean-600 text-white shadow-lg shadow-ocean-600/20' : 'border-slate-200 text-transparent'}`}><CheckCircle size={18} /></button><span className={`flex-1 text-sm font-semibold transition-all ${item.checked ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>{item.label}</span>{item.isCustom && <button onClick={() => deleteCustomItem(item.label)} className="text-slate-300 hover:text-red-500 transition-colors p-2"><Trash2 size={18} /></button>}</div>))}</div>
      </div>
      <div className="pt-6"><h3 className="text-lg font-heading font-bold text-slate-900 dark:text-white mb-4 font-heading">{user.language === 'id' ? 'Riwayat Scan' : 'Scan History'}</h3>{scans.length === 0 ? (<div className="p-12 text-center bg-white/50 dark:bg-slate-800/30 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 text-sm italic font-medium">{user.language === 'id' ? 'Belum ada riwayat scan.' : 'No scan history yet.'}</div>) : (<div className="space-y-4">{[...scans].reverse().map((scan) => (<div key={scan.id} onClick={() => setSelectedScan(scan)} className="bg-white dark:bg-slate-800 p-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex items-center gap-4 cursor-pointer hover:shadow-xl hover:border-ocean-100 transition-all group shadow-sm"><div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 overflow-hidden flex-shrink-0 shadow-inner">{scan.imageUri && <img src={scan.imageUri} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />}</div><div className="flex-1 overflow-hidden"><div className="flex justify-between items-center mb-1"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(scan.date).toLocaleDateString()}</span><span className="text-sm font-black text-ocean-600">{scan.overallScore}</span></div><p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate pr-4">{scan.summary.replace(/[#*]/g, '')}</p></div><div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-xl text-slate-400 group-hover:text-ocean-600 transition-colors"><ChevronRight size={18} /></div></div>))}</div>)}</div>
    </div>
  );
};
