
import React, { useState } from 'react';
import { X, Sparkles, Loader2, Music4, Wand2 } from 'lucide-react';
import { generateChordProgression } from '../services/geminiService';
import { ChordData, GuitarEffects } from '../types';
import clsx from 'clsx';

interface GeminiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (chords: ChordData[], effects?: GuitarEffects) => void;
}

const SUGGESTIONS = [
    "Neo-Soul Chill 90bpm",
    "80s Japanese City Pop",
    "Texas Blues Shuffle E",
    "Dark Cinematic Ambient",
    "Flamenco Spanish Phrygian",
    "Lo-Fi Hip Hop Jazz",
    "90s Grunge Drop D",
    "Dreamy Shoegaze Reverb"
];

export const GeminiModal: React.FC<GeminiModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const { chords, effects } = await generateChordProgression(prompt);
      onSuccess(chords, effects);
      onClose();
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "Erreur inconnue";
      setError(`Echec: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 text-purple-400">
            <Sparkles size={20} />
            <h2 className="text-xl font-bold text-white">Compositeur IA</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4 flex-1 overflow-y-auto pr-1 custom-scrollbar">
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">
              Décrivez l'ambiance (Vibe)
            </label>
            <p className="text-xs text-slate-500 mb-3">L'IA va composer la grille d'accords ET régler le son de la guitare (effets) pour vous.</p>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none transition-all"
              placeholder="Ex: Un riff Jazz mélancolique en Do mineur..."
            />
          </div>

          <div>
             <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                <Wand2 size={12} /> Suggestions de Styles
             </label>
             <div className="flex flex-wrap gap-2">
                 {SUGGESTIONS.map((suggestion) => (
                     <button
                        key={suggestion}
                        onClick={() => setPrompt(suggestion)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-purple-600/20 border border-slate-700 hover:border-purple-500/50 text-xs font-medium text-slate-300 hover:text-purple-300 transition-all active:scale-95"
                     >
                         {suggestion}
                     </button>
                 ))}
             </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20 break-words">
              <strong>Oups !</strong> {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-black text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-900/20 mt-4"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <><Music4 size={20} /> GÉNÉRER</>}
          </button>
        </div>
      </div>
    </div>
  );
};
