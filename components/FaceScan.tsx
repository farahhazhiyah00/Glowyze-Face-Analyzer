
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { RefreshCw, X, AlertCircle, Upload, ArrowRight, ShieldCheck, Info, SwitchCamera, Key, Lock } from 'lucide-react';
import { ScanResult } from '../types';
import { geminiService } from '../services/geminiService';

// Fix: Declarations for window.aistudio must match the environment's predefined AIStudio type and modifiers.
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    readonly aistudio: AIStudio;
  }
}

interface FaceScanProps {
  onScanComplete: (result: ScanResult) => void;
  onClose: () => void;
}

type ScanView = 'CAMERA' | 'SCANNING' | 'REVIEW' | 'KEY_REQUIRED';

export const FaceScan: React.FC<FaceScanProps> = ({ onScanComplete, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [view, setView] = useState<ScanView>('CAMERA');
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<ScanResult | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  
  const isMounted = useRef(true);

  // Check if API Key is selected for Pro models
  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          setView('KEY_REQUIRED');
        }
      }
    };
    checkKey();
  }, []);

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // Assume success as per guidelines to avoid race condition
      setView('CAMERA');
    }
  };

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
        setError('Gagal mengakses kamera. Pastikan koneksi menggunakan HTTPS dan berikan izin kamera.');
        setIsStreaming(false);
      }
    }
  }, [facingMode, stopCamera]);

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
        if (e.message === "MODEL_NOT_FOUND") {
          setView('KEY_REQUIRED');
          setError("Model Pro memerlukan konfigurasi ulang kunci API.");
        } else {
          setError("Gagal menganalisis. Coba foto lain dengan pencahayaan yang lebih baik.");
          setView('CAMERA');
        }
      }
    }
  };

  const handleSave = () => {
    if (analysisResult) {
      onScanComplete(analysisResult);
    }
  };

  const getMetricColor = (val: number) => {
    if (val < 25) return 'bg-emerald-500';
    if (val < 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const parseInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-ocean-venice dark:text-meteor">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const formatSummary = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      const clean = line.trim();
      if (!clean) return <div key={i} className="h-3" />;
      if (clean.startsWith('* ') || clean.startsWith('- ') || clean.startsWith('• ')) {
        return (
          <div key={i} className="flex gap-2 mb-1 pl-1">
            <span className="w-1.5 h-1.5 rounded-full bg-ocean-curious dark:bg-planetary mt-2 flex-shrink-0" />
            <span className="text-sm text-ocean-venice/80 dark:text-meteor/80 leading-relaxed">{parseInline(clean.replace(/^[\*\-•]\s*/, ''))}</span>
          </div>
        );
      }
      return <p key={i} className="text-sm text-ocean-venice/80 dark:text-meteor/80 mb-2 leading-relaxed">{parseInline(clean)}</p>;
    });
  };

  if (view === 'KEY_REQUIRED') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-ocean-pattens dark:bg-galaxy animate-fadeIn">
        <div className="w-20 h-20 bg-ocean-curious/10 rounded-3xl flex items-center justify-center mb-6 border border-ocean-curious/20">
          <Lock className="text-ocean-curious" size={40} />
        </div>
        <h3 className="text-2xl font-heading font-bold mb-3 text-ocean-venice dark:text-meteor">Buka Analisis Pro</h3>
        <p className="text-ocean-venice/60 dark:text-meteor/60 mb-8 max-w-sm leading-relaxed">
          Untuk menggunakan fitur analisis wajah **Gemini 3 Pro**, Anda perlu menghubungkan kunci API dari proyek GCP yang memiliki penagihan aktif.
        </p>
        <button 
          onClick={handleOpenKeySelector}
          className="w-full max-w-xs py-4 bg-ocean-curious dark:bg-planetary text-white dark:text-meteor rounded-full font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-ocean-venice transition-all active:scale-95"
        >
          <Key size={20} />
          Hubungkan Kunci API
        </button>
        <a 
          href="https://ai.google.dev/gemini-api/docs/billing" 
          target="_blank" 
          rel="noopener noreferrer"
          className="mt-6 text-sm text-ocean-curious hover:underline font-medium"
        >
          Pelajari tentang Billing API
        </a>
        <button onClick={onClose} className="mt-8 text-ocean-venice/50 dark:text-universe/50 font-medium">Batal</button>
      </div>
    );
  }

  if (error && view === 'CAMERA') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-ocean-pattens dark:bg-galaxy">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="text-red-500" size={40} />
        </div>
        <h3 className="text-xl font-heading font-bold mb-3 text-ocean-venice dark:text-meteor">Masalah Terdeteksi</h3>
        <p className="text-ocean-venice/60 dark:text-meteor/60 mb-8 max-w-xs">{error}</p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button onClick={() => fileInputRef.current?.click()} className="py-3.5 bg-ocean-curious dark:bg-planetary text-white dark:text-meteor rounded-full font-bold flex items-center justify-center gap-2 shadow-lg"><Upload size={20} />Unggah Foto</button>
          <button onClick={() => { setError(''); setView('CAMERA'); startCamera(); }} className="py-3.5 bg-white text-ocean-venice rounded-full font-bold border border-ocean-french flex items-center justify-center gap-2">Coba Kamera Lagi</button>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
        <button onClick={onClose} className="mt-6 text-ocean-venice/70 dark:text-universe font-medium py-2">Kembali</button>
      </div>
    );
  }

  return (
    <div className="relative h-full bg-ocean-pattens dark:bg-galaxy flex flex-col overflow-hidden">
      {view !== 'REVIEW' && (
        <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent text-white">
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition"><X /></button>
          <div className="flex flex-col items-center">
            <span className="font-bold tracking-widest text-[10px] uppercase font-heading">Glowyze AI Engine Pro</span>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[8px] font-black uppercase opacity-80 tracking-tighter">Pro Model Active</span>
            </div>
          </div>
          <div className="w-10"></div>
        </div>
      )}

      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
        {view === 'CAMERA' && (
          <>
            <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-transform duration-500 ${facingMode === 'user' ? 'transform scale-x-[-1]' : ''}`} />
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center pb-28 md:pb-24">
              <div className="relative w-72 h-[55vh] max-h-[28rem] rounded-[50%] shadow-[0_0_0_9999px_#081F5CD9] border-2 border-ocean-curious/30 overflow-hidden">
                 <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-sky to-transparent opacity-80 animate-scan blur-[2px]"></div>
              </div>
              <div className="mt-6 bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/20">
                <p className="text-white text-[10px] font-bold tracking-widest uppercase">Posisikan Wajah di Tengah</p>
              </div>
            </div>
          </>
        )}

        {view === 'SCANNING' && capturedImage && (
          <div className="relative w-full h-full">
            <img src={capturedImage} alt="Scanning" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-galaxy/80 flex flex-col items-center justify-center z-30 px-6 backdrop-blur-sm">
              <div className="text-white text-center">
                <div className="w-16 h-16 rounded-full border-4 border-planetary border-t-transparent animate-spin mb-4 mx-auto" />
                <h3 className="text-xl font-heading font-bold mb-2 text-meteor uppercase">Menganalisis Kulit Pro</h3>
                <p className="text-sky text-xs animate-pulse">
                  Menggunakan kecerdasan Gemini 3 Pro...
                </p>
              </div>
            </div>
          </div>
        )}

        {view === 'REVIEW' && analysisResult && (
          <div className="w-full h-full bg-ocean-pattens dark:bg-galaxy flex flex-col overflow-y-auto no-scrollbar animate-fadeIn">
            <div className="relative h-64 flex-shrink-0">
               <img src={capturedImage || ''} alt="Result" className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-gradient-to-t from-ocean-pattens dark:from-galaxy via-transparent to-transparent"></div>
               <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                  <div>
                    <span className="bg-ocean-curious dark:bg-planetary text-white dark:text-meteor text-[10px] font-black px-3 py-1 rounded-full tracking-widest uppercase mb-2 inline-block shadow-sm">Analysis Pro Berhasil</span>
                    <h2 className="text-3xl font-heading font-bold text-ocean-venice dark:text-meteor leading-none">Laporan Kulit</h2>
                  </div>
                  <div className="bg-white/90 dark:bg-galaxy/80 p-3 rounded-2xl shadow-xl border border-ocean-french dark:border-planetary flex flex-col items-center backdrop-blur-sm">
                    <span className="text-[10px] font-bold text-ocean-curious dark:text-universe uppercase">Skor</span>
                    <span className="text-3xl font-black text-ocean-curious dark:text-sky">{analysisResult.overallScore}</span>
                  </div>
               </div>
            </div>

            <div className="px-6 space-y-6 pb-28">
               <div className="bg-white/60 dark:bg-galaxy/50 rounded-3xl p-6 shadow-sm border border-ocean-french/40 dark:border-planetary/30 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-6">
                    <ShieldCheck className="text-ocean-curious dark:text-planetary" size={20} />
                    <h3 className="font-heading font-bold text-ocean-venice dark:text-meteor text-lg">Metrik Detail</h3>
                  </div>
                  <div className="space-y-5">
                    {Object.entries(analysisResult.metrics).map(([key, val]) => (
                      <div key={key}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs font-bold text-ocean-venice/80 dark:text-meteor/80 capitalize">{key}</span>
                          <span className="text-xs font-black text-ocean-curious dark:text-universe">{val as number}%</span>
                        </div>
                        <div className="h-2 w-full bg-ocean-french/30 dark:bg-planetary/30 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-1000 ease-out ${getMetricColor(val as number)}`} style={{ width: `${val}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
               <div className="bg-ocean-french/20 dark:bg-universe/10 rounded-3xl p-6 border border-ocean-french/30 dark:border-universe/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="text-ocean-curious dark:text-sky" size={18} />
                    <h3 className="font-heading font-bold text-ocean-venice dark:text-meteor text-lg">Wawasan Glowy AI</h3>
                  </div>
                  <div className="text-sm text-ocean-venice/90 dark:text-meteor/90">
                    {formatSummary(analysisResult.summary)}
                  </div>
               </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-ocean-pattens dark:from-galaxy pt-10 flex gap-3 z-50">
              <button onClick={() => setView('CAMERA')} className="flex-1 py-4 bg-white dark:bg-galaxy/50 text-ocean-curious dark:text-sky rounded-full font-bold shadow-sm border border-ocean-french dark:border-planetary flex items-center justify-center gap-2 transition-transform active:scale-95"><RefreshCw size={18} />Ulangi</button>
              <button onClick={handleSave} className="flex-[2] py-4 bg-ocean-curious dark:bg-planetary text-white dark:text-meteor rounded-full font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-ocean-venice transition-all active:scale-95">Simpan Hasil Pro<ArrowRight size={18} /></button>
            </div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {view === 'CAMERA' && (
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 flex justify-center bg-transparent items-center gap-8 z-10">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="p-4 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/20 hover:bg-black/60 transition"><Upload size={24} /></button>
          <button onClick={captureImage} disabled={!isStreaming} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center group shadow-xl"><div className="w-16 h-16 bg-white rounded-full group-active:scale-90 transition-transform" /></button>
          <button onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')} className="p-4 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/20 hover:bg-black/60 transition"><SwitchCamera size={24} /></button>
        </div>
      )}
    </div>
  );
};
