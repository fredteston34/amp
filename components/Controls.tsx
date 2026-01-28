
import React from 'react';
import { Play, Square, RefreshCw, Plus, Wand2, Undo, Redo, Repeat, ArrowDown, ArrowUp, BrainCircuit, Disc, FolderHeart, Zap, Download, Loader2, Sliders, Mic, PenTool, Cable, FileAudio, Printer, Music2, HelpCircle, Eye, AlarmClock, AudioWaveform, XCircle } from 'lucide-react';
import clsx from 'clsx';
import { BackingTrackStyle } from '../types';

interface ControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  bpm: number;
  setBpm: (bpm: number) => void;
  onAddChord: () => void;
  onGenerate: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isLooping?: boolean;
  onToggleLoop?: () => void;
  onClearLoopRange?: () => void;
  hasLoopRange?: boolean;
  onTranspose?: (semitones: number) => void;
  onAnalyze?: () => void;
  isBackingTrack?: boolean;
  onToggleBackingTrack?: () => void;
  backingTrackStyle?: BackingTrackStyle;
  setBackingTrackStyle?: (style: BackingTrackStyle) => void;
  onOpenLibrary?: () => void;
  isSoloist?: boolean;
  onToggleSoloist?: () => void;
  onExport?: () => void;
  onMidiExport?: () => void;
  isExporting?: boolean;
  onOpenMixer?: () => void;
  onImportAudio?: () => void;
  hasVocalTrack?: boolean;
  onOpenLyrics?: () => void;
  hasLyrics?: boolean;
  onOpenPedalboard?: () => void;
  capo?: number;
  setCapo?: (capo: number) => void;
  currentPreset?: string;
  onSetPreset?: (preset: string) => void;
  presets?: string[];
  onOpenWelcome?: () => void;
  onToggleFretboard?: () => void;
  isFretboardVisible?: boolean;
  isMetronomeEnabled?: boolean;
  onToggleMetronome?: () => void;
  onOpenLooper?: () => void; 
}

export const Controls: React.FC<ControlsProps> = ({ 
  isPlaying, 
  onPlayPause, 
  onReset, 
  bpm, 
  setBpm, 
  onAddChord, 
  onGenerate,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isLooping = false,
  onToggleLoop,
  onClearLoopRange,
  hasLoopRange = false,
  onTranspose,
  onAnalyze,
  isBackingTrack = false,
  onToggleBackingTrack,
  backingTrackStyle = 'ROCK',
  setBackingTrackStyle,
  onOpenLibrary,
  isSoloist = false,
  onToggleSoloist,
  onExport,
  onMidiExport,
  isExporting = false,
  onOpenMixer,
  onImportAudio,
  hasVocalTrack = false,
  onOpenLyrics,
  hasLyrics = false,
  onOpenPedalboard,
  capo = 0,
  setCapo,
  currentPreset,
  onSetPreset,
  presets = [],
  onOpenWelcome,
  onToggleFretboard,
  isFretboardVisible,
  isMetronomeEnabled = false,
  onToggleMetronome,
  onOpenLooper
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4 z-50 overflow-x-auto print:hidden">
      
      {/* Playback Controls */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <button
          onClick={onPlayPause}
          disabled={isExporting}
          className={clsx(
            "flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all flex-shrink-0",
            isPlaying 
              ? "bg-red-500 hover:bg-red-600 text-white" 
              : "bg-primary hover:bg-blue-600 text-white",
            isExporting && "opacity-50 cursor-not-allowed"
          )}
          title={isPlaying ? "Stop" : "Play (Space)"}
        >
          {isPlaying ? <Square size={24} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
        </button>

        <button 
          onClick={onReset}
          disabled={isExporting}
          className="p-3 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors flex-shrink-0 disabled:opacity-50"
          title="Reset"
        >
          <RefreshCw size={20} />
        </button>

        <div className="relative group">
          <button 
            onClick={onToggleLoop}
            onDoubleClick={onClearLoopRange}
            disabled={isExporting}
            className={clsx(
              "p-3 rounded-full transition-colors flex-shrink-0 disabled:opacity-50",
              isLooping ? "bg-green-500/20 text-green-400 border border-green-500/50" : "bg-slate-700 hover:bg-slate-600 text-slate-300"
            )}
            title={hasLoopRange ? "Toggle Partial Loop (Double-click to clear range)" : "Toggle Loop All"}
          >
            <Repeat size={20} />
            {hasLoopRange && (
               <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-indigo-500 rounded-full border border-slate-900" />
            )}
          </button>
          
          {hasLoopRange && onClearLoopRange && (
             <button 
                onClick={onClearLoopRange}
                className="absolute -top-2 -right-2 bg-slate-800 text-slate-400 hover:text-white rounded-full p-1 border border-slate-600 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                title="Clear Loop Range"
             >
                <XCircle size={12} />
             </button>
          )}
        </div>

        {/* METRONOME TOGGLE */}
        {onToggleMetronome && (
            <button 
              onClick={onToggleMetronome}
              disabled={isExporting}
              className={clsx(
                "p-3 rounded-full transition-colors flex-shrink-0 disabled:opacity-50",
                isMetronomeEnabled ? "bg-amber-500/20 text-amber-400 border border-amber-500/50" : "bg-slate-700 hover:bg-slate-600 text-slate-300"
              )}
              title="Activer/Désactiver le Métronome"
            >
              <AlarmClock size={20} />
            </button>
        )}

        {/* CAPO CONTROL */}
        {setCapo && (
             <div className="flex flex-col items-center bg-slate-800 rounded-lg p-1 border border-slate-700 px-2 min-w-[50px]">
                 <label className="text-[9px] font-bold text-slate-400 uppercase">CAPO</label>
                 <div className="flex items-center gap-2">
                     <button onClick={() => setCapo(Math.max(0, capo - 1))} className="text-slate-400 hover:text-white"><ArrowDown size={14}/></button>
                     <span className={clsx("font-mono font-bold text-sm w-4 text-center", capo > 0 ? "text-orange-400" : "text-slate-500")}>
                        {capo}
                     </span>
                     <button onClick={() => setCapo(Math.min(12, capo + 1))} className="text-slate-400 hover:text-white"><ArrowUp size={14}/></button>
                 </div>
             </div>
        )}

        {/* BAND Group */}
        <div className="flex items-center gap-1 bg-slate-800 rounded-full p-1 border border-slate-700">
            {onToggleBackingTrack && (
            <button 
                onClick={onToggleBackingTrack}
                className={clsx(
                "p-2 rounded-full transition-colors flex-shrink-0 flex items-center gap-2",
                isBackingTrack ? "bg-indigo-500 text-white shadow-md shadow-indigo-900/20" : "bg-transparent text-slate-400 hover:text-white"
                )}
                title="Toggle Backing Track"
            >
                <Disc size={20} className={isBackingTrack ? "animate-spin-slow" : ""} />
                {isBackingTrack && <span className="text-xs font-bold pl-1 pr-1 hidden sm:inline">BAND</span>}
            </button>
            )}
            
            {onOpenLooper && (
                <button
                    onClick={onOpenLooper}
                    className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-700 rounded-full transition-colors"
                    title="Open Mini DAW / Arranger"
                >
                    <AudioWaveform size={18} />
                </button>
            )}
        </div>

        {/* GUITAR TONE PRESET Group */}
        {onSetPreset && presets.length > 0 && (
             <div className="flex items-center gap-2 bg-slate-800 rounded-full p-1 border border-slate-700">
                 <div className="p-2 rounded-full flex items-center gap-2 text-orange-500">
                    <Music2 size={20} />
                    <span className="text-xs font-bold hidden sm:inline">TONE</span>
                 </div>
                 <select 
                    value={currentPreset}
                    onChange={(e) => onSetPreset(e.target.value)}
                    className="bg-transparent text-xs font-mono text-orange-500 focus:outline-none cursor-pointer pr-3 font-bold"
                >
                    {presets.map(p => (
                        <option key={p} value={p}>{p}</option>
                    ))}
                </select>
             </div>
        )}

        {/* SOLOIST Toggle */}
        {onToggleSoloist && (
            <button 
                onClick={onToggleSoloist}
                className={clsx(
                    "p-2 px-3 rounded-full transition-all flex-shrink-0 flex items-center gap-2 border",
                    isSoloist 
                        ? "bg-amber-500 text-white border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]" 
                        : "bg-slate-800 text-slate-400 border-slate-700 hover:border-amber-500/50 hover:text-amber-400"
                )}
                title="Enable AI Soloist (Improvisation)"
            >
                <Zap size={20} className={isSoloist ? "fill-white" : ""} />
                <span className={clsx("text-xs font-bold", !isSoloist && "hidden sm:inline")}>SOLOIST</span>
            </button>
        )}
        
        {/* PEDALBOARD Button - HIGHLIGHTED AS REQUESTED */}
        {onOpenPedalboard && (
             <button
                onClick={onOpenPedalboard}
                disabled={isExporting}
                className="p-2 px-3 bg-orange-600/20 hover:bg-orange-600 hover:text-white text-orange-400 rounded-lg border border-orange-500/50 transition-all disabled:opacity-50 shadow-sm group flex items-center gap-2"
                title="Pédalier FX & Amplis (Essentiel !)"
             >
                <Cable size={20} className="" />
                <span className="text-xs font-bold hidden sm:inline">FX</span>
             </button>
        )}

        {/* MIXER Button */}
        {onOpenMixer && (
             <button
                onClick={onOpenMixer}
                disabled={isExporting}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
                title="Table de Mixage & Entrées (Source)"
             >
                <Sliders size={20} />
             </button>
        )}
        
        {/* Audio Import Button */}
        {onImportAudio && (
             <button
                onClick={onImportAudio}
                disabled={isExporting}
                className={clsx(
                    "p-3 rounded-lg border transition-colors disabled:opacity-50",
                    hasVocalTrack 
                        ? "bg-pink-500/20 border-pink-500/50 text-pink-400" 
                        : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-pink-400 hover:text-pink-300"
                )}
                title="Import Vocals / Audio Track"
             >
                <Mic size={20} className={hasVocalTrack ? "fill-current" : ""} />
             </button>
        )}

        {/* Lyrics Button */}
        {onOpenLyrics && (
             <button
                onClick={onOpenLyrics}
                disabled={isExporting}
                className={clsx(
                    "p-3 rounded-lg border transition-colors disabled:opacity-50",
                    hasLyrics 
                        ? "bg-purple-500/20 border-purple-500/50 text-purple-400" 
                        : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-purple-400 hover:text-purple-300"
                )}
                title="Songwriter Pad (Lyrics)"
             >
                <PenTool size={20} className={hasLyrics ? "fill-current" : ""} />
             </button>
        )}

        <div className="flex flex-col ml-2 min-w-[100px]">
          <label className="text-xs text-slate-400 font-mono mb-1">TEMPO: {bpm}</label>
          <input 
            type="range" 
            min="40" 
            max="240" 
            value={bpm} 
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>
      </div>

      {/* Editing Controls */}
      <div className="flex items-center gap-3 flex-shrink-0">
        
        {onOpenLibrary && (
          <button
             onClick={onOpenLibrary}
             disabled={isExporting}
             className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors mr-2 disabled:opacity-50"
             title="Save & Load Progressions"
          >
             <FolderHeart size={18} />
             <span className="hidden lg:inline text-sm font-medium">Library</span>
          </button>
        )}

        {/* Fretboard Toggle */}
        {onToggleFretboard && (
             <button
                onClick={onToggleFretboard}
                className={clsx(
                    "p-3 rounded-lg border transition-colors",
                    isFretboardVisible 
                        ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400" 
                        : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-400 hover:text-white"
                )}
                title="Toggle Fretboard Coach"
             >
                <Eye size={20} />
             </button>
        )}

        {/* PRINT / SONGBOOK */}
        <button
            onClick={() => window.print()}
            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors"
            title="Print Songbook (PDF)"
        >
            <Printer size={20} />
        </button>

        {/* MIDI Export Button */}
        {onMidiExport && (
            <button
                onClick={onMidiExport}
                disabled={isExporting || isPlaying}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-yellow-400 hover:text-yellow-300 rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
                title="Export to MIDI"
            >
                <FileAudio size={20} />
            </button>
        )}

        {/* Export Audio Button */}
        {onExport && (
          <button
             onClick={onExport}
             disabled={isExporting || isPlaying}
             className={clsx(
                "p-3 rounded-lg border transition-all relative",
                isExporting 
                    ? "bg-red-500/20 border-red-500 text-red-400 animate-pulse" 
                    : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700"
             )}
             title="Export to Audio File"
          >
             {isExporting ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
             {isExporting && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
          </button>
        )}

        {/* Transpose Group */}
        {onTranspose && (
            <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700 mr-2">
                <button 
                    onClick={() => onTranspose(-1)}
                    disabled={isExporting}
                    className="p-2 text-slate-300 hover:bg-slate-700 hover:text-white rounded-md transition-colors disabled:opacity-50"
                    title="Transpose Down (-1 Semitone)"
                >
                    <ArrowDown size={18} />
                </button>
                <span className="mx-1 text-xs font-mono text-slate-400 select-none">KEY</span>
                <button 
                    onClick={() => onTranspose(1)}
                    disabled={isExporting}
                    className="p-2 text-slate-300 hover:bg-slate-700 hover:text-white rounded-md transition-colors disabled:opacity-50"
                    title="Transpose Up (+1 Semitone)"
                >
                    <ArrowUp size={18} />
                </button>
            </div>
        )}

        {/* Undo / Redo Group */}
        <div className="flex items-center bg-slate-800 rounded-lg p-1 mr-2 border border-slate-700 hidden sm:flex">
            <button 
                onClick={onUndo}
                disabled={!canUndo || isExporting}
                className={clsx(
                    "p-2 rounded-md transition-colors",
                    canUndo ? "text-slate-300 hover:bg-slate-700 hover:text-white" : "text-slate-600 cursor-not-allowed"
                )}
                title="Undo (Ctrl+Z)"
            >
                <Undo size={18} />
            </button>
            <div className="w-[1px] h-4 bg-slate-700 mx-1"></div>
            <button 
                onClick={onRedo}
                disabled={!canRedo || isExporting}
                className={clsx(
                    "p-2 rounded-md transition-colors",
                    canRedo ? "text-slate-300 hover:bg-slate-700 hover:text-white" : "text-slate-600 cursor-not-allowed"
                )}
                title="Redo (Ctrl+Shift+Z)"
            >
                <Redo size={18} />
            </button>
        </div>
        
        {/* Help Button */}
        {onOpenWelcome && (
          <button 
              onClick={onOpenWelcome}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-slate-700 transition-colors"
              title="Help & Welcome"
          >
              <HelpCircle size={20} />
          </button>
        )}

        {onAnalyze && (
          <button
            onClick={onAnalyze}
            disabled={isExporting}
            className="p-3 bg-indigo-900/50 hover:bg-indigo-800 text-indigo-300 hover:text-white rounded-lg border border-indigo-500/30 transition-colors disabled:opacity-50"
            title="Analyze Harmony"
          >
            <BrainCircuit size={20} />
          </button>
        )}

        <button 
          onClick={onAddChord}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors border border-slate-600 disabled:opacity-50"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Add</span>
        </button>
        
        <button 
          onClick={onGenerate}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-purple-900/20 disabled:opacity-50"
        >
          <Wand2 size={18} />
          <span className="hidden sm:inline">AI</span>
        </button>
      </div>
    </div>
  );
};
