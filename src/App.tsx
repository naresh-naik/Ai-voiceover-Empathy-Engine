import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic2, 
  Play, 
  Square, 
  Volume2, 
  Loader2,
  History,
  Download,
  Zap,
  Cpu,
  Waves,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeEmotion, generateEmpathicSpeech, EmotionData } from './services/neuralEngine';

function pcmToWav(pcmData: Uint8Array, sampleRate: number = 24000): Blob {
  const buffer = new ArrayBuffer(44 + pcmData.length);
  const view = new DataView(buffer);

  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + pcmData.length, true);
  view.setUint32(8, 0x57415645, false); // "WAVE"
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, pcmData.length, true);

  for (let i = 0; i < pcmData.length; i++) {
    view.setUint8(44 + i, pcmData[i]);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

interface HistoryItem {
  text: string;
  emotion: string;
  audioUrl: string;
  timestamp: number;
}

export default function App() {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [emotionData, setEmotionData] = useState<EmotionData | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleProcess = async () => {
    if (!text.trim()) return;

    try {
      setIsAnalyzing(true);
      setEmotionData(null);
      setAudioUrl(null);

      const analysis = await analyzeEmotion(text);
      setEmotionData(analysis);
      setIsAnalyzing(false);

      setIsGenerating(true);
      const base64Audio = await generateEmpathicSpeech(text, analysis);
      
      const binaryString = window.atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const wavBlob = pcmToWav(bytes);
      const url = URL.createObjectURL(wavBlob);
      setAudioUrl(url);
      
      setHistory(prev => [{
        text,
        emotion: analysis.emotion,
        audioUrl: url,
        timestamp: Date.now()
      }, ...prev].slice(0, 10));

    } catch (error) {
      console.error("Error processing engine:", error);
    } finally {
      setIsAnalyzing(false);
      setIsGenerating(false);
    }
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onloadedmetadata = () => {
        setDuration(audioRef.current?.duration || null);
      };
      audioRef.current.ontimeupdate = () => {
        setCurrentTime(audioRef.current?.currentTime || 0);
      };
    }
  }, [audioUrl]);

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-[#00ff9d] selection:text-black font-display overflow-x-hidden">
      {/* Immersive Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#00ff9d] opacity-[0.05] blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-600 opacity-[0.03] blur-[180px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(5,5,5,0.8)_100%)]" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-8 xl:px-16 py-12 min-h-screen flex flex-col">
        {/* Neural Grid Overlay */}
        <div className="absolute inset-0 z-[-1] opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        
        {/* Navigation / Header */}
        <nav className="flex items-center justify-between mb-20">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00ff9d] to-[#00cc7e] flex items-center justify-center neural-glow">
              <Cpu className="w-6 h-6 text-black" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tighter leading-none mb-1">EMPATHY ENGINE</h2>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00ff9d] animate-pulse" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Neural Core v2.5</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-6"
          >
            {/* Header elements removed as per user request */}
          </motion.div>
        </nav>

        {/* Hero Section - Now Full Width Above Grid */}
        <header className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-4xl"
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 text-gradient leading-[1.1]">
              Give your AI a <br /> human soul.
            </h1>
            <p className="text-lg md:text-xl text-white/40 max-w-2xl leading-relaxed">
              The world's first neural synthesis engine that programmatically modulates 
              vocal characteristics based on emotional context and intensity.
            </p>
          </motion.div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-16 flex-1 items-start">
          {/* Left Column: Input & Analysis */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-12">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-panel rounded-3xl p-8 relative group"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/5">
                    <Mic2 className="w-4 h-4 text-[#00ff9d]" />
                  </div>
                  <span className="text-xs uppercase tracking-[0.2em] text-white/60 font-bold">Source Input</span>
                </div>
                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/40 font-mono">
                  {text.length} CHR
                </div>
              </div>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message to analyze and synthesize..."
                className="w-full h-48 bg-transparent border-none focus:ring-0 text-2xl resize-none placeholder:text-white/5 leading-relaxed font-medium"
              />

              <div className="mt-8 flex items-center gap-4">
                <button
                  onClick={handleProcess}
                  disabled={!text.trim() || isAnalyzing || isGenerating}
                  className="relative flex-1 group overflow-hidden rounded-2xl bg-white text-black font-bold py-5 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#00ff9d] to-[#00cc7e] opacity-100 group-hover:opacity-90 transition-opacity" />
                  <div className="relative flex items-center justify-center gap-3">
                    {isAnalyzing || isGenerating ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <Zap className="w-5 h-5 fill-current" />
                        <span className="tracking-tight text-lg">SYNTHESIZE NEURAL AUDIO</span>
                      </>
                    )}
                  </div>
                </button>
              </div>
            </motion.div>

            {/* Analysis Bento Grid */}
            <AnimatePresence>
              {emotionData && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                  <div className="glass-panel rounded-3xl p-8 flex flex-col justify-between md:col-span-2">
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold block mb-4">Detected Sentiment</span>
                      <h3 className="text-5xl font-bold text-[#00ff9d] tracking-tighter uppercase">{emotionData.emotion}</h3>
                    </div>
                    <div className="mt-8 flex items-center gap-4">
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${emotionData.intensity * 100}%` }}
                          className="h-full bg-[#00ff9d] neural-glow"
                        />
                      </div>
                      <span className="text-sm font-mono text-white/60">{(emotionData.intensity * 100).toFixed(0)}% Intensity</span>
                    </div>
                  </div>

                  <div className="glass-panel rounded-3xl p-8 border-l-4 border-l-[#00ff9d] flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold block mb-4">Voice Profile</span>
                      <div className="text-2xl font-bold text-white tracking-tight mb-2">{emotionData.suggestedVoice}</div>
                      <div className="text-[10px] uppercase tracking-widest text-[#00ff9d] font-bold">Neural Optimized</div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-white/5">
                      <div className="flex justify-between text-[10px] text-white/40 mb-2">
                        <span>PITCH</span>
                        <span>{emotionData.emotion === 'angry' ? 'HIGH' : 'STABLE'}</span>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="w-2/3 h-full bg-white/20" />
                      </div>
                    </div>
                  </div>

                  <div className="glass-panel rounded-3xl p-8 md:col-span-3">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold block mb-4">Modulation Strategy</span>
                    <p className="text-xl text-white/80 italic leading-relaxed font-medium">
                      "{emotionData.vocalPrompt}"
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: Player & History */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-8 lg:sticky lg:top-12 self-start">
            {/* High-End Audio Player */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-panel rounded-[40px] p-10 flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00ff9d] to-transparent opacity-30" />
              
              <div className="mb-10 w-full flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Neural Output</span>
                <Waves className={`w-5 h-5 ${isPlaying ? 'text-[#00ff9d] animate-pulse' : 'text-white/10'}`} />
              </div>

              {audioUrl ? (
                <div className="w-full space-y-10">
                  <div className="relative flex justify-center">
                    <div className={`absolute inset-0 bg-[#00ff9d] opacity-20 blur-[60px] rounded-full transition-opacity duration-1000 ${isPlaying ? 'opacity-30' : 'opacity-0'}`} />
                    <button
                      onClick={togglePlayback}
                      className="relative w-32 h-32 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-all active:scale-95 group neural-glow"
                    >
                      {isPlaying ? (
                        <Square className="w-10 h-10 fill-current" />
                      ) : (
                        <Play className="w-10 h-10 fill-current ml-2" />
                      )}
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between text-[10px] font-mono text-white/40 uppercase tracking-widest">
                      <span>{formatDuration(currentTime)}</span>
                      <span>{duration ? formatDuration(duration) : '--:--'}</span>
                    </div>
                    <div className="relative h-1.5 w-full bg-white/5 rounded-full group cursor-pointer">
                      <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        step="0.01"
                        value={currentTime}
                        onChange={handleSeek}
                        className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
                      />
                      <motion.div 
                        className="absolute left-0 top-0 h-full bg-[#00ff9d] rounded-full z-10"
                        style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                      >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_15px_#00ff9d] scale-0 group-hover:scale-100 transition-transform" />
                      </motion.div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-6">
                    <a
                      href={audioUrl}
                      download={`neural-synthesis-${Date.now()}.wav`}
                      className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                    >
                      <Download className="w-4 h-4" />
                      Download Master
                    </a>
                  </div>
                  
                  <audio ref={audioRef} src={audioUrl} className="hidden" />
                </div>
              ) : (
                <div className="py-20 space-y-6">
                  <div className="w-24 h-24 rounded-full border border-dashed border-white/10 mx-auto flex items-center justify-center">
                    <Volume2 className="w-8 h-8 text-white/5" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-bold uppercase tracking-[0.3em] text-white/20">Awaiting Synthesis</p>
                    <p className="text-[10px] text-white/10 max-w-[200px] mx-auto">Enter source text to begin neural audio generation</p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* History Sidebar */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-panel rounded-[40px] p-8 flex-1"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <History className="w-4 h-4 text-white/40" />
                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Neural Log</span>
                </div>
                <span className="text-[10px] font-mono text-white/20">{history.length}/10</span>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {history.length === 0 ? (
                  <div className="py-20 text-center">
                    <p className="text-[10px] uppercase tracking-widest text-white/10">Log is empty</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={item.timestamp}
                      onClick={() => {
                        setAudioUrl(item.audioUrl);
                        setText(item.text);
                      }}
                      className="w-full text-left p-5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] transition-all border border-white/[0.05] hover:border-white/10 group"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div className="px-2 py-0.5 rounded bg-[#00ff9d]/10 text-[8px] font-bold text-[#00ff9d] uppercase tracking-widest">
                          {item.emotion}
                        </div>
                        <span className="text-[9px] font-mono text-white/20">{new Date(item.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs text-white/50 line-clamp-2 group-hover:text-white/80 transition-colors leading-relaxed">
                        {item.text}
                      </p>
                    </motion.button>
                  ))
                )}
              </div>
            </motion.div>

            <div className="px-6 py-4 rounded-2xl bg-[#00ff9d]/5 border border-[#00ff9d]/10 flex gap-4 items-start">
              <Zap className="w-4 h-4 text-[#00ff9d] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[10px] text-[#00ff9d] font-bold uppercase tracking-widest">Challenge 1: The Empathy Engine</p>
                <p className="text-[10px] text-[#00ff9d]/60 leading-relaxed uppercase tracking-wider">
                  Technical submission utilizing Neural Transformers for sentiment extraction and prosody synthesis.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-white/20 mb-1">Architecture</span>
              <span className="text-xs font-bold text-white/60">Neural Transformers</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-white/20 mb-1">Synthesis</span>
              <span className="text-xs font-bold text-white/60">High-Fidelity PCM</span>
            </div>
          </div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/20 font-bold">
            {/* DARWIXAI text removed as per user request */}
          </div>
        </footer>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}} />
    </div>
  );
}
