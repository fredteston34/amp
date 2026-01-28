import React, { useState } from 'react';
import { X, Sparkles, PenTool, Type, AlignLeft } from 'lucide-react';
import { ChordData } from '../types';
import { generateLyrics } from '../services/geminiService';

interface LyricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lyrics: string;
  setLyrics: (text: string) => void;
  chords: ChordData[];
}

export const LyricsModal: React.FC<LyricsModalProps> = ({ 
  isOpen, 
  onClose, 
  lyrics, 
  setLyrics,
  chords 
}) => {
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [fontSize, setFontSize] = useState(16);

  if (!isOpen) return null;

  const handleGenerate = async () => {
      setIsGenerating(true);
      try {
          const generated = await generateLyrics(chords, topic);
          // Append if text exists, otherwise replace
          setLyrics(lyrics ? lyrics + "\n\n" + generated : generated);
      } catch (e) {
          console.error(e);
      } finally {
          setIsGenerating(false);
      }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-surface border border-slate-700 rounded-2xl w-full max-w-4xl h-[80vh] shadow-2xl flex flex-col md:flex-row overflow-hidden">
        
        {/* Sidebar Controls */}
        <div className="w-full md:w-64 bg-slate-900/50 p-6 border-b md:border-b-0 md:border-r border-slate-700 flex flex-col gap-6">
            <div className="flex justify-between items-center md:hidden">
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><PenTool size={20}/> Lyrics</h2>
                <button onClick={onClose}><X size={24} className="text-slate-400" /></button>
            </div>
            
            <div className="hidden md:block">
                <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                    <PenTool className="text-pink-400" size={24} />
                    Songwriter
                </h2>
                <p className="text-xs text-slate-500">Draft your masterpiece.</p>
            </div>

            {/* AI Generator */}
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block flex items-center gap-1">
                    <Sparkles size={12} /> AI Generator
                </label>
                <textarea 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Topic (e.g. Broken heart in Paris)"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-sm text-white mb-3 h-20 resize-none focus:border-pink-500 outline-none"
                />
                <button 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-lg text-sm font-bold shadow-lg transition-all disabled:opacity-50"
                >
                    {isGenerating ? "Writing..." : "Write for me"}
                </button>
            </div>

            {/* Formatting */}
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                 <label className="text-xs font-bold text-slate-400 uppercase mb-2 block flex items-center gap-1">
                    <Type size={12} /> Appearance
                </label>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Size</span>
                    <input 
                        type="range" 
                        min="12" 
                        max="32" 
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="flex-1 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer" 
                    />
                </div>
            </div>
            
             <button 
                onClick={onClose}
                className="mt-auto hidden md:flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
             >
                <X size={18} /> Close
             </button>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col bg-slate-950 relative">
             <div className="absolute top-0 right-0 p-4 pointer-events-none opacity-10">
                 <AlignLeft size={120} />
             </div>
             
             <textarea 
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
                className="w-full h-full bg-transparent text-slate-200 p-6 focus:outline-none resize-none font-mono selection:bg-pink-500/30"
                placeholder="Type your lyrics here..."
             />
             
             <div className="absolute bottom-4 right-4 text-xs text-slate-600 pointer-events-none font-mono">
                 {lyrics.length} chars
             </div>
        </div>

      </div>
    </div>
  );
};
