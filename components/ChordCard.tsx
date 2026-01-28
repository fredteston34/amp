
import React, { ReactNode, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChordData, StrummingPattern } from '../types';
import { getRomanNumeral, analyzeDifficulty } from '../services/musicTheory';
import { playNote } from '../services/audioService';
import { getNextVoicing } from '../services/chordDictionary';
import clsx from 'clsx';
import { Trash2, Music, Copy, ClipboardPaste, Layers, ArrowDown, ArrowUp, Activity, Timer, StepBack, StepForward, RefreshCw } from 'lucide-react';

interface ChordCardProps {
  chord: ChordData;
  isActive: boolean;
  activeBeat: number;
  onDelete: () => void;
  onDuplicate?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  canPaste?: boolean;
  index: number;
  onFingeringChange?: (s: number, f: number, fingerLabel?: string | null) => void;
  onNameChange?: (name: string) => void;
  onEditChord?: (field: keyof ChordData, value: any) => void;
  onPlay?: () => void;
  dragHandle?: ReactNode;
  capo?: number;
  keyCenter?: string;
  // Loop Props
  isLoopStart?: boolean;
  isLoopEnd?: boolean;
  isInLoop?: boolean;
  onSetLoopStart?: () => void;
  onSetLoopEnd?: () => void;
}

const FINGER_CYCLE = ['1', '2', '3', '4', 'T'];
const STRUM_PATTERNS: { id: StrummingPattern; label: string; icon: any }[] = [
  { id: 'ONCE', label: '1x Strum', icon: () => <ArrowDown size={12} className="opacity-40" /> },
  { id: 'DOWN', label: 'Down Only', icon: () => <div className="flex gap-0.5"><ArrowDown size={10} /><ArrowDown size={10} /></div> },
  { id: 'DU', label: 'Down-Up', icon: () => <div className="flex gap-0.5"><ArrowDown size={10} /><ArrowUp size={10} /></div> },
  { id: 'DDU', label: 'D-D-Up', icon: () => <div className="flex gap-0.5"><ArrowDown size={10} /><ArrowDown size={10} /><ArrowUp size={10} /></div> },
  { id: 'FOLK', label: 'Folk Beat', icon: () => <Activity size={10} /> },
];

export const ChordCard: React.FC<ChordCardProps> = ({ 
  chord, isActive, activeBeat, onDelete, onDuplicate, onCopy, onPaste, canPaste, onFingeringChange, onNameChange, onEditChord, onPlay, capo = 0, keyCenter,
  isLoopStart, isLoopEnd, isInLoop, onSetLoopStart, onSetLoopEnd
}) => {
  const [localName, setLocalName] = useState(chord.name);
  const [lastStrummedString, setLastStrummedString] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const fingering = chord.fingering || [-1, -1, -1, -1, -1, -1];
  const fingers = chord.fingers || [null, null, null, null, null, null];
  
  const activeFrets = fingering.filter(f => f > 0);
  const baseFret = activeFrets.length > 0 && Math.max(...activeFrets) > 5 ? Math.min(...activeFrets) : 1;
  const degree = keyCenter ? getRomanNumeral(chord.name, keyCenter) : '';
  const difficulty = analyzeDifficulty(fingering);

  useEffect(() => { setLocalName(chord.name); }, [chord.name]);

  // Haptic feedback
  useEffect(() => {
    if (isActive && activeBeat === 0 && window.navigator.vibrate) {
        window.navigator.vibrate([30]);
    }
  }, [isActive, activeBeat]);

  const handleGridClick = (e: React.MouseEvent) => {
    if (!gridRef.current || !onFingeringChange) return;
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const stringIdx = Math.floor((x / rect.width) * 6);
    const fretRel = Math.floor(((y - 25) / (rect.height - 25)) * 5);
    
    if (fretRel < 0) {
        onFingeringChange(stringIdx, fingering[stringIdx] === 0 ? -1 : 0, null);
        playNote(stringIdx, 0, capo);
    } else {
        const targetFret = baseFret + fretRel;
        const currentFinger = fingers[stringIdx];
        if (fingering[stringIdx] === targetFret) {
            const currentIdx = FINGER_CYCLE.indexOf(currentFinger || '');
            if (currentIdx === -1 || currentIdx === FINGER_CYCLE.length - 1) onFingeringChange(stringIdx, -1, null);
            else onFingeringChange(stringIdx, targetFret, FINGER_CYCLE[currentIdx + 1]);
        } else {
            onFingeringChange(stringIdx, targetFret, '1');
            playNote(stringIdx, targetFret, capo);
        }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const stringIdx = Math.floor((x / rect.width) * 6);
    
    if (stringIdx >= 0 && stringIdx < 6 && stringIdx !== lastStrummedString) {
        setLastStrummedString(stringIdx);
    }
  };

  const handleMouseLeave = () => setLastStrummedString(null);
  
  const handleCycleVoicing = () => {
      const nextFingering = getNextVoicing(chord.name, fingering);
      if (nextFingering && onEditChord) {
          onEditChord('fingering', nextFingering);
          // Reset custom fingers labels when switching voicings automatically
          onEditChord('fingers', [null,null,null,null,null,null]);
      }
  };

  // Vibration and pulse variants
  const cardVariants = {
    idle: { scale: 1, rotate: 0, x: 0, borderColor: isInLoop ? "#6366f1" : "#334155", backgroundColor: isInLoop ? "rgba(49, 46, 129, 0.4)" : "#0f172a", filter: "brightness(1)" },
    active: { 
      borderColor: "#22c55e", 
      backgroundColor: "#064e3b",
      scale: 1.02,
      x: 0,
      transition: { duration: 0.1 }
    },
    vibrate: {
      scale: [1, 1.03, 1],
      y: [0, 2, 0],
      borderColor: "#4ade80",
      backgroundColor: "#064e3b",
      boxShadow: "0 0 30px rgba(34, 197, 94, 0.3)",
      filter: "brightness(1.1)",
      transition: { duration: 0.2, ease: "backOut" }
    }
  };

  return (
    <motion.div
        layout
        initial="idle"
        animate={isActive ? (activeBeat === 0 ? "vibrate" : "active") : "idle"}
        variants={cardVariants}
        className={clsx(
          "relative flex flex-col items-center w-44 md:w-52 h-[520px] md:h-[580px] rounded-2xl border-4 transition-all shadow-2xl pt-4 group select-none",
          isActive && "ring-4 ring-primary/20",
          isLoopStart && "border-l-8 border-l-indigo-500 rounded-l-none",
          isLoopEnd && "border-r-8 border-r-indigo-500 rounded-r-none"
        )}
      >
        {isLoopStart && <div className="absolute -top-3 -left-3 bg-indigo-500 text-white text-[10px] font-black px-2 py-1 rounded shadow-lg z-50">LOOP START</div>}
        {isLoopEnd && <div className="absolute -bottom-3 -right-3 bg-indigo-500 text-white text-[10px] font-black px-2 py-1 rounded shadow-lg z-50">LOOP END</div>}

        <AnimatePresence>
            {isActive && activeBeat === 0 && (
                <motion.div 
                    initial={{ opacity: 0.8, scale: 0.9, boxShadow: "0 0 0px 0px #22c55e" }}
                    animate={{ opacity: 0, scale: 1.4, boxShadow: "0 0 60px 20px transparent" }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="absolute inset-0 rounded-2xl border-2 border-primary pointer-events-none z-0"
                />
            )}
        </AnimatePresence>

        {isActive && (
            <div className="absolute top-2 w-[80%] h-1 bg-black/40 rounded-full overflow-hidden flex gap-0.5 px-0.5">
                {Array.from({ length: chord.beats }).map((_, i) => (
                    <motion.div 
                        key={i}
                        animate={{ 
                            backgroundColor: i <= activeBeat ? "#22c55e" : "#334155",
                            scaleY: i === activeBeat ? [1, 2, 1] : 1,
                            opacity: i < activeBeat ? 0.5 : 1
                        }}
                        className="flex-1 rounded-full h-full origin-bottom"
                    />
                ))}
            </div>
        )}

        {/* Fret Markers */}
        <div className="absolute left-1 top-[70px] flex flex-col gap-[38px] md:gap-[43px] z-20 pointer-events-none">
            {[0, 1, 2, 3, 4, 5].map(i => (
                <span key={i} className="text-[8px] font-black text-slate-600 uppercase text-center w-6">
                    {i === 0 ? (capo > 0 ? capo : '') : (baseFret + i - 1 + capo)}
                </span>
            ))}
        </div>

        {/* Action Buttons (Hover) */}
        <div className="absolute top-4 left-4 z-50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
            <button onClick={onDuplicate} title="Duplicate" className="p-2 rounded-full bg-slate-700 hover:bg-indigo-600 text-white shadow-lg hover:scale-110 transition-transform"><Layers size={14} /></button>
            <button onClick={onCopy} title="Copy" className="p-2 rounded-full bg-slate-700 text-white shadow-lg hover:scale-110 transition-transform"><Copy size={14} /></button>
            {canPaste && <button onClick={onPaste} title="Paste" className="p-2 rounded-full bg-green-600 text-white shadow-lg animate-pulse"><ClipboardPaste size={14} /></button>}
            
            <div className="w-full h-[1px] bg-slate-700 my-1" />
            <button onClick={onSetLoopStart} title="Loop Start" className="p-2 rounded-full bg-slate-800 border border-slate-600 text-indigo-400 hover:text-white hover:bg-indigo-600 transition-transform"><StepBack size={14} /></button>
            <button onClick={onSetLoopEnd} title="Loop End" className="p-2 rounded-full bg-slate-800 border border-slate-600 text-indigo-400 hover:text-white hover:bg-indigo-600 transition-transform"><StepForward size={14} /></button>
        </div>

        {/* Voicing/Inversion Cycler */}
        <button 
            onClick={(e) => { e.stopPropagation(); handleCycleVoicing(); }}
            className="absolute top-4 right-14 z-50 opacity-0 group-hover:opacity-100 transition-all p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-slate-600"
            title="Cycle Inversions/Voicings"
        >
            <RefreshCw size={12} />
        </button>

        {difficulty && (
            <div className={clsx("absolute top-4 right-4 text-[8px] font-black px-2 py-0.5 rounded-full border bg-black/80 z-10 uppercase", difficulty.color)}>
                {difficulty.label}
            </div>
        )}

        {/* Fretboard Area */}
        <div 
            ref={gridRef} 
            onClick={handleGridClick} 
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative w-full h-[240px] md:h-[280px] mt-6 cursor-crosshair px-4 z-10"
        >
            <div className="absolute w-full h-[6px] top-[25px] left-0 bg-slate-400 z-10" />
            
            {capo > 0 && baseFret === 1 && (
                 <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} className="absolute w-full h-9 top-[22px] left-0 bg-orange-400/30 border-y-2 border-orange-400/50 z-0" />
            )}

            {[1, 2, 3, 4, 5].map(f => (
                <div key={f} className="absolute w-full h-[1px] left-0 bg-slate-700/50" style={{ top: `${f * 48 + 25}px` }} />
            ))}
            
            <div className="absolute inset-0 flex justify-around px-8">
                {[0, 1, 2, 3, 4, 5].map(s => (
                    <motion.div 
                        key={s} 
                        animate={(isActive && activeBeat === 0) || lastStrummedString === s ? { x: [0, 3, -3, 2, -2, 1, -1, 0] } : { x: 0 }}
                        transition={{ duration: (isActive && activeBeat === 0) ? 0.6 : 0.3, ease: "linear" }}
                        className="relative h-full flex items-center justify-center"
                    >
                        <div className={clsx("h-full rounded-full transition-colors duration-300", s < 3 ? "w-[2.5px]" : "w-[1.5px]", isActive ? "bg-primary shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-slate-500", fingering[s] === -1 && "opacity-30")} />
                    </motion.div>
                ))}
            </div>

            {fingering.map((f, s) => {
                if (f < 0) return <div key={s} className="absolute top-0 text-red-500/50 font-black text-xs" style={{ left: `${14 + s * 14.5}%` }}>×</div>;
                if (f === 0) return <div key={s} className="absolute top-0 text-green-400 font-black text-xs" style={{ left: `${14 + s * 14.5}%` }}>○</div>;
                const row = f - baseFret + 1;
                return (
                    <motion.div 
                        key={s}
                        animate={isActive ? { scale: activeBeat === 0 ? [1, 1.3, 1] : 1 } : {}}
                        transition={{ type: "spring", stiffness: 300, damping: 10 }}
                        className="absolute w-7 h-7 bg-white rounded-full border-2 border-slate-900 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-[10px] font-black text-slate-900 shadow-lg z-20"
                        style={{ left: `${16.5 + s * 13.5}%`, top: `${row * 48 + 5}px` }}
                    >
                        {fingers[s] || (f > 0 && baseFret === 1 ? '' : '')}
                    </motion.div>
                );
            })}
        </div>

        {/* Strumming & Name */}
        <div className="w-full px-4 mt-4 z-10">
            <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Strumming</span>
                <span className="text-[9px] font-black text-primary uppercase">{chord.strummingPattern || 'ONCE'}</span>
            </div>
            <div className="flex justify-between w-full gap-1">
                {STRUM_PATTERNS.map(p => (
                    <button 
                        key={p.id} 
                        onClick={() => onEditChord?.('strummingPattern', p.id)} 
                        className={clsx("flex-1 p-2 rounded-lg border transition-all flex flex-col items-center gap-1", chord.strummingPattern === p.id ? "bg-primary border-primary text-white shadow-lg scale-105" : "bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700/50")}
                        title={p.label}
                    >
                        <p.icon />
                        <span className="text-[6px] font-black uppercase opacity-60">{p.id}</span>
                    </button>
                ))}
            </div>
        </div>

        <div className="mt-auto mb-6 text-center px-4 w-full flex flex-col items-center gap-2 z-10">
            <div className="flex items-center gap-1">
                <Music size={12} className="text-yellow-500" />
                <span className="text-[10px] text-yellow-500 font-black uppercase tracking-widest">{degree}</span>
            </div>
            <input value={localName} onChange={(e) => setLocalName(e.target.value)} onBlur={() => onNameChange?.(localName)} className="bg-transparent text-2xl font-black text-center w-full focus:outline-none uppercase text-white hover:bg-white/5 rounded transition-colors" placeholder="Chord..." />
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-white/5">
                <Timer size={12} className="text-slate-500" />
                <select value={chord.beats} onChange={(e) => onEditChord?.('beats', Number(e.target.value))} className="bg-transparent text-[10px] font-black text-slate-300 outline-none cursor-pointer">
                    {[1,2,3,4,8].map(b => <option key={b} value={b} className="bg-slate-900">{b} BEATS</option>)}
                </select>
            </div>
        </div>
        <button onClick={onDelete} className="absolute -top-3 -right-3 bg-red-600 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-xl z-50"><Trash2 size={16}/></button>
    </motion.div>
  );
};
