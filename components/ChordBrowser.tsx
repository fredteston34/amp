
import React, { useState } from 'react';
import { X, Search, Book, ChevronRight, Hash } from 'lucide-react';
import { CHORD_CATEGORIES, ChordTemplate } from '../services/chordDictionary';
import clsx from 'clsx';

interface ChordBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onAddChord: (template: ChordTemplate) => void;
}

export const ChordBrowser: React.FC<ChordBrowserProps> = ({ isOpen, onClose, onAddChord }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredCategories = CHORD_CATEGORIES.map(cat => ({
    ...cat,
    chords: cat.chords.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
  })).filter(cat => cat.chords.length > 0);

  return (
    <div className="fixed inset-y-0 right-0 z-[110] w-full max-w-sm bg-surface border-l border-slate-700 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      <div className="p-6 border-b border-slate-700 bg-slate-900/50">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 text-primary">
            <Book size={20} />
            <h2 className="text-xl font-black uppercase tracking-widest">Dictionnaire</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher (ex: Am7, Cmaj...)"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder-slate-600"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-20 text-slate-600 italic">
            Aucun accord trouvé...
          </div>
        ) : (
          filteredCategories.map(cat => (
            <div key={cat.title} className="space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-slate-800 pb-2 mb-4">
                {cat.title}
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {cat.chords.map(chord => (
                  <button
                    key={chord.name}
                    onClick={() => onAddChord(chord)}
                    className="group relative h-12 rounded-lg bg-slate-800 border border-slate-700 hover:border-primary hover:bg-primary/10 transition-all flex items-center justify-center overflow-hidden"
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-primary/5 to-transparent transition-opacity" />
                    <span className="text-sm font-black text-slate-300 group-hover:text-white transition-colors relative z-10">
                      {chord.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-6 border-t border-slate-800 bg-slate-900/30">
        <p className="text-[10px] text-slate-500 leading-tight uppercase font-bold tracking-wider text-center">
          Cliquez sur un accord pour l'ajouter instantanément à votre grille de composition.
        </p>
      </div>
    </div>
  );
};
