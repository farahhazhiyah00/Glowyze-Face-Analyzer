
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { RefreshCw, X, AlertCircle, Upload, ArrowRight, ShieldCheck, Info, SwitchCamera, Share2, Sun, Zap, UserCheck, Sparkles, Activity, Layers, BarChart2 } from 'lucide-react';
import { ScanResult } from '../types';
import { geminiService } from '../services/geminiService';

interface FaceScanProps {
  onScanComplete: (result: ScanResult) => void;
  onClose: () => void;
}

type ScanView = 'CAMERA' | 'SCANNING' | 'REVIEW';

export const FaceScan: React.FC<FaceScanProps> = ({ onScanComplete, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const brightnessCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [view, setView] = useState<ScanView>('CAMERA');
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<ScanResult | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  
  const [brightness, setBrightness] = useState(0); 
  const [feedback, setFeedback] = useState('Posisikan wajah Anda');
  const [isReady, setIsReady] = useState(false);

  const isMounted = useRef(true);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (isMounted.current) {
      setIsStreaming(false);
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (isMounted.current) setError('');
    
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 } 
        } 
      });
      
      if (!isMounted.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (isMounted.current) {
             videoRef.current?.play().catch(e => console.error("Play error:", e));
             setIsStreaming(true);
          }
        };
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      if (isMounted.current) {
        setError('Gagal mengakses kamera. Pastikan memberikan izin kamera atau coba unggah foto.');
        setIsStreaming(false);
      }
    }
  }, [facingMode, stopCamera]);

  useEffect(() => {
    let interval: number;
    if (view === 'CAMERA' && isStreaming && videoRef.current) {
      const bCanvas = brightnessCanvasRef.current;
      const ctx = bCanvas?.getContext('2d', { willReadFrequently: true });
      
      interval = window.setInterval(() => {
        if (!videoRef.current || !ctx || !bCanvas) return;
        
        ctx.drawImage(videoRef.current, 0, 0, bCanvas.width, bCanvas.height);
        const imageData = ctx.getImageData(0, 0, bCanvas.width, bCanvas.height);
        const data = imageData.data;
        
        let colorSum = 0;
        for(let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i+1] + data[i+2]) / 3;
          colorSum += avg;
        }
        
        const brightnessScore = Math.floor(colorSum / (bCanvas.width * bCanvas.height));
        setBrightness(brightnessScore);

        if (brightnessScore < 60) {
          setFeedback('Cari tempat lebih terang 💡');
          setIsReady(false);
        } else if (brightnessScore > 230) {
          setFeedback('Kurangi pencahayaan berlebih ☀️');
          setIsReady(false);
        } else {
          setFeedback('Posisi Bagus! Klik Tombol 📸');
          setIsReady(true);
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [view, isStreaming]);

  useEffect(() => {
    isMounted.current = true;
    if (view === 'CAMERA') {
      startCamera();
    }
    return () => {
      isMounted.current = false;
      stopCamera();
    };
  }, [view, startCamera, stopCamera]);

  const captureImage = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        
        if (facingMode === 'user') {
          context.translate(canvasRef.current.width, 0);
          context.scale(-1, 1);
        }
        
        context.drawImage(videoRef.current, 0, 0);
        context.setTransform(1, 0, 0, 1, 0, 0);
        
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
        stopCamera();
        performAnalysis(dataUrl);
      }
    }
  }, [facingMode, stopCamera]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setCapturedImage(dataUrl);
        setError('');
        stopCamera();
        performAnalysis(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const performAnalysis = async (imageUri: string) => {
    setView('SCANNING');
    try {
      const result = await geminiService.analyzeSkin(imageUri);
      if (isMounted.current) {
        setAnalysisResult(result);
        setView('REVIEW');
      }
    } catch (e: any) {
      console.error("Analysis failed", e);
      if (isMounted.current) {
        setError(e.message || "Gagal menganalisis. Coba foto lain.");
        setView('CAMERA');
      }
    }
  };

  const handleSave = () => {
    if (analysisResult) {
      onScanComplete(analysisResult);
    }
  };

  const handleScoop = async () => {
    if (!analysisResult) return;
    
    const shareText = `✨ My Glowyze Skin Report ✨\n\nScore: ${analysisResult.overallScore}/100\n\nInsight: ${analysisResult.summary.replace(/[#*]/g, '').slice(0, 150)}...\n\nAnalyze your skin at Glowyze! 🌸`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Glowyze Skin Report',
          text: shareText,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing', err);
      }
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Report copied to clipboard! ✨');
    }
  };

  const getMetricColor = (val: number) => {
    // Skala Keparahan: Tinggi = Buruk (Merah), Rendah = Baik (Hijau)
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
          <div key={i} className="flex gap-2 mb-2 pl-1">
            <span className="w-1.5 h-1.5 rounded-full bg-ocean-curious dark:bg-sky mt-2 flex-shrink-0" />
            <span className="text-sm text-white leading-relaxed">{parseInline(clean.replace(/^[\*\-•]\s*/, ''))}</span>
          </div>
        );
      }
      return <p key={i} className="text-sm text-white mb-2 leading-relaxed">{parseInline(clean)}</p>;
    });
  };

  return (
    <div className="relative h-full bg-ocean-pattens dark:bg-galaxy flex flex-col overflow-hidden">
      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={brightnessCanvasRef} width="10" height="10" className="hidden" />

      {view !== 'REVIEW' && (
        <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent text-white pt-safe">
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition"><X /></button>
          <div className="flex flex-col items-center">
            <span className="font-bold tracking-widest text-[10px] uppercase font-heading">Glowyze AI Analyzer</span>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[8px] font-black uppercase opacity-80 tracking-tighter">AI Core Active</span>
            </div>
          </div>
          <div className="w-10"></div>
        </div>
      )}

      <div className="flex-1 relative flex flex-col bg-black overflow-hidden">
        {view === 'CAMERA' && (
          <div className="flex-1 relative">
            <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-transform duration-500 ${facingMode === 'user' ? 'transform scale-x-[-1]' : ''}`} />
            
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center pb-28 md:pb-24">
              <div className={`relative w-72 h-[55vh] max-h-[28rem] rounded-[50%] shadow-[0_0_0_9999px_#081F5CD9] border-2 transition-colors duration-500 ${isReady ? 'border-emerald-400' : 'border-white/30'} overflow-hidden`}>
                 <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-sky to-transparent opacity-80 animate-scan blur-[2px] ${isReady ? 'via-emerald-400' : 'via-sky'}`}></div>
              </div>

              <div className="mt-8 flex flex-col items-center gap-4">
                <div className={`px-6 py-2 rounded-full border backdrop-blur-md flex items-center gap-2 transition-all shadow-lg ${isReady ? 'bg-emerald-500/20 border-emerald-400/50 scale-105' : 'bg-black/40 border-white/20'}`}>
                  {isReady ? <UserCheck size={16} className="text-emerald-400" /> : <Sun size={16} className="text-sky animate-pulse" />}
                  <p className={`text-[10px] font-bold tracking-widest uppercase ${isReady ? 'text-emerald-400' : 'text-white'}`}>
                    {feedback}
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 flex justify-center bg-transparent items-center gap-8 z-10 pb-safe">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="p-4 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/20 hover:bg-black/60 transition shadow-lg"><Upload size={24} /></button>
              
              <div className="relative">
                <button 
                  onClick={captureImage} 
                  disabled={!isStreaming} 
                  className={`w-20 h-20 rounded-full border-4 flex items-center justify-center group shadow-xl transition-all duration-300 ${isReady ? 'border-emerald-400 scale-110' : 'border-white'}`}
                >
                  <div className={`w-16 h-16 rounded-full group-active:scale-90 transition-all duration-300 ${isReady ? 'bg-emerald-400' : 'bg-white'}`} />
                </button>
                {isReady && <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-black animate-bounce"><Zap size={10} className="text-white" /></div>}
              </div>

              <button onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')} className="p-4 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/20 hover:bg-black/60 transition shadow-lg"><SwitchCamera size={24} /></button>
            </div>
          </div>
        )}

        {view === 'SCANNING' && capturedImage && (
          <div className="relative flex-1">
            <img src={capturedImage} alt="Scanning" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-galaxy/80 flex flex-col items-center justify-center z-30 px-6 backdrop-blur-sm">
              <div className="text-white text-center">
                <div className="w-16 h-16 rounded-full border-4 border-planetary border-t-transparent animate-spin mb-4 mx-auto" />
                <h3 className="text-xl font-heading font-bold mb-2 text-meteor uppercase tracking-widest">Analysing...</h3>
                <p className="text-sky text-xs animate-pulse font-medium">Glowy is processing your skin data</p>
              </div>
            </div>
          </div>
        )}

        {view === 'REVIEW' && analysisResult && (
          <div className="flex-1 flex flex-col bg-ocean-pattens dark:bg-galaxy overflow-hidden">
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar animate-fadeIn">
              {/* Header Image & Score Section */}
              <div className="relative h-64 flex-shrink-0">
                 <img src={capturedImage || ''} alt="Result" className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-gradient-to-t from-ocean-pattens dark:from-galaxy via-transparent to-transparent"></div>
                 <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between gap-4 z-10">
                    <div className="flex-1">
                      <span className="bg-ocean-curious/90 dark:bg-planetary/90 backdrop-blur-sm text-white dark:text-meteor text-[8px] font-black px-3 py-1.5 rounded-full tracking-[0.2em] uppercase mb-1.5 inline-block shadow-sm">AI Scan Complete</span>
                      <h2 className="text-3xl md:text-4xl font-heading font-bold text-ocean-venice dark:text-white leading-none">Your Report</h2>
                    </div>
                    <div className="bg-white/95 dark:bg-galaxy/90 p-3 md:p-4 rounded-[2rem] shadow-2xl border border-ocean-french/50 dark:border-planetary flex flex-col items-center backdrop-blur-md">
                      <span className="text-[9px] font-black text-ocean-curious dark:text-sky uppercase tracking-widest mb-0.5">Health Score</span>
                      <span className="text-3xl md:text-4xl font-black text-ocean-venice dark:text-white leading-none">{analysisResult.overallScore}</span>
                    </div>
                 </div>
              </div>

              {/* Detail Cards Section */}
              <div className="px-6 space-y-6 py-8 pb-40">
                 {/* Metrics Section */}
                 <div className="bg-white/70 dark:bg-galaxy/40 rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-ocean-french/30 dark:border-planetary/30 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-2xl bg-ocean-curious/10 flex items-center justify-center text-ocean-curious">
                        <ShieldCheck size={22} />
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-ocean-venice dark:text-white text-xl">Detailed Metrics</h3>
                        <p className="text-[10px] font-bold text-ocean-curious/60 dark:text-sky/60 uppercase tracking-widest">Tingkat Keparahan (Tinggi = Parah)</p>
                      </div>
                    </div>
                    
                    <div className="space-y-8">
                      {Object.entries(analysisResult.metrics).map(([key, val]) => (
                        <div key={key} className="group">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-3">
                              <div className={`p-2.5 rounded-xl transition-colors ${getMetricColor(val as number).replace('bg-', 'bg-').replace('500', '100').replace('400', '100')} ${getMetricColor(val as number).replace('bg-', 'text-')}`}>
                                 {getMetricIcon(key)}
                              </div>
                              <span className="text-sm font-black text-ocean-venice/80 dark:text-meteor/80 capitalize tracking-wide">{key}</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className={`text-xs font-black ${getMetricColor(val as number).replace('bg-', 'text-')}`}>{val as number}%</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{getSeverityLabel(val as number)}</span>
                            </div>
                          </div>
                          <div className="h-2.5 w-full bg-ocean-french/20 dark:bg-planetary/20 rounded-full overflow-hidden p-[1px]">
                            <div className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${getMetricColor(val as number)}`} style={{ width: `${val}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>

                 {/* AI Insight Section */}
                 <div className="bg-ocean-venice dark:bg-planetary/30 rounded-[2.5rem] p-6 md:p-8 border border-white/5 shadow-xl relative overflow-hidden group">
                    <div className="flex items-center gap-3 mb-4 relative z-10">
                      <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-sky">
                        <Info size={22} />
                      </div>
                      <h3 className="font-heading font-bold text-white text-xl">AI Glowy Insight</h3>
                    </div>
                    <div className="text-sm text-white leading-relaxed relative z-10 italic">
                      {formatSummary(analysisResult.summary)}
                    </div>
                    <Sparkles size={120} className="absolute -right-10 -bottom-10 text-white/5 group-hover:text-white/10 transition-colors duration-500" />
                 </div>
              </div>
            </div>

            {/* Fixed Bottom Actions Panel */}
            <div className="flex-shrink-0 p-6 bg-gradient-to-t from-ocean-pattens dark:from-galaxy via-ocean-pattens dark:via-galaxy to-transparent pt-12 flex flex-col gap-3 z-50">
              <div className="flex gap-4">
                <button onClick={() => setView('CAMERA')} className="flex-1 py-4 bg-white/90 dark:bg-galaxy/60 text-ocean-curious dark:text-sky rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-sm border border-ocean-french/50 dark:border-planetary flex items-center justify-center gap-2 active:scale-95 transition-all"><RefreshCw size={16} />Retake</button>
                <button onClick={handleSave} className="flex-[2] py-4 bg-ocean-venice dark:bg-ocean-curious text-white rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all">Save Report<ArrowRight size={16} /></button>
              </div>
              <button 
                onClick={handleScoop}
                className="w-full py-4 bg-gradient-to-r from-sky to-ocean-curious text-white rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg shadow-sky/20 active:scale-95 transition-all"
              >
                <Share2 size={16} />
                Scoop Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
