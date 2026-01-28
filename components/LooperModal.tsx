
import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, Square, Play, Layers, Music, Settings2, AudioWaveform, MoreVertical, Drum, Zap, Piano, Upload, Trash2, Plus, Download, Scissors, MousePointer, VolumeX, Eraser, Move, ZoomIn, ZoomOut, Volume2, Save, Monitor, AlertTriangle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BackingTrackStyle, ChordData, InstrumentType } from '../types';
import { startInputRecording, stopInputRecording, setInstrumentVolume } from '../services/audioService';

interface LooperModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentStyle: BackingTrackStyle;
  onStyleChange: (style: BackingTrackStyle) => void;
  bpm: number;
  chords?: ChordData[];
}

interface AudioClip {
    id: string;
    type: 'RECORDING' | 'IMPORT';
    url: string;
    name: string;
    startBeat: number; // Position on timeline
    duration: number; // Duration in beats
    offset: number; // Start offset within the audio file
    muted: boolean;
    color: string;
}

type ToolType = 'SELECT' | 'SPLIT' | 'MUTE' | 'DELETE';
type RecSource = 'MIC' | 'SYSTEM';

export const LooperModal: React.FC<LooperModalProps> = ({ 
  isOpen, 
  onClose, 
  isPlaying, 
  onTogglePlay,
  currentStyle,
  onStyleChange,
  bpm,
  chords = []
}) => {
  const [activeTab, setActiveTab] = useState<'DAW' | 'LOOPER'>('DAW');
  const [activeTool, setActiveTool] = useState<ToolType>('SELECT');
  const [recSource, setRecSource] = useState<RecSource>('MIC');
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(40); // PX per beat
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState(0);
  const [recordingStartBeat, setRecordingStartBeat] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  
  const [audioClips, setAudioClips] = useState<AudioClip[]>([]);
  const [playheadBeat, setPlayheadBeat] = useState(0);
  
  // Track Volumes (dB)
  const [volumes, setVolumes] = useState({
      harmony: -4,
      drums: -2,
      bass: -2,
      audio: 0
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Check system audio support
  const isSystemAudioSupported = typeof navigator !== 'undefined' && 
    navigator.mediaDevices && 
    // @ts-ignore
    !!navigator.mediaDevices.getDisplayMedia;

  // Timer for Playhead
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
        const msPerBeat = (60 / bpm) * 1000;
        const updateRate = 50; // ms
        const beatsPerUpdate = updateRate / msPerBeat;
        
        interval = setInterval(() => {
            setPlayheadBeat(p => {
                const next = p + beatsPerUpdate;
                return next > 64 ? 0 : next; // Loop 64 bars
            }); 
        }, updateRate);
    }
    return () => clearInterval(interval);
  }, [isPlaying, bpm]);

  const handleRecordToggle = async () => {
      setErrorMsg(null);
      setSuggestion(null);

      if (isRecording) {
          // STOP RECORDING
          try {
             const blob = await stopInputRecording();
             setIsRecording(false);
             if (blob) {
                 const url = URL.createObjectURL(blob);
                 const durationMs = Date.now() - recordingStartTime;
                 const durationBeats = (durationMs / 1000) * (bpm / 60);
                 
                 const newClip: AudioClip = {
                     id: crypto.randomUUID(),
                     type: 'RECORDING',
                     url,
                     name: recSource === 'MIC' ? `Vocals ${audioClips.length + 1}` : `Sample ${audioClips.length + 1}`,
                     startBeat: recordingStartBeat,
                     duration: durationBeats,
                     offset: 0,
                     muted: false,
                     color: recSource === 'MIC' ? 'bg-red-500' : 'bg-purple-500'
                 };
                 setAudioClips(prev => [...prev, newClip]);
             }
          } catch (e) {
             console.error(e);
             setIsRecording(false);
          }
      } else {
          // START RECORDING
          try {
              await startInputRecording(recSource);
              setRecordingStartTime(Date.now());
              setRecordingStartBeat(playheadBeat); // Start at current playhead
              setIsRecording(true);
              if (!isPlaying) onTogglePlay();
          } catch (e: any) {
              // Handle and suggest fixes
              let msg = "Failed to start recording.";
              let hint = "";

              if (e.message === "UNSUPPORTED_BROWSER") {
                  msg = "Browser not supported.";
                  hint = "Try using Google Chrome, Edge, or Firefox on Desktop.";
              } else if (e.message === "SYSTEM_AUDIO_NOT_SUPPORTED") {
                  msg = "System Audio not supported here.";
                  hint = "This feature (capturing YouTube etc) requires a Desktop browser (Chrome/Edge). Mobile is not supported.";
              } else if (e.message === "NO_AUDIO_TRACK") {
                  msg = "No audio selected.";
                  hint = "When the browser popup appears, make sure to check the 'Share Audio' box at the bottom-left.";
              } else if (e.message === "PERMISSION_DENIED") {
                  msg = "Permission denied.";
                  hint = "Please allow microphone/screen access in your browser settings.";
              } else if (!window.isSecureContext) {
                  msg = "Insecure Context.";
                  hint = "Recording requires HTTPS. If you are on localhost, use 'localhost' instead of IP.";
              }

              setErrorMsg(msg);
              setSuggestion(hint);
          }
      }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const url = URL.createObjectURL(file);
          const newClip: AudioClip = {
              id: crypto.randomUUID(),
              type: 'IMPORT',
              url,
              name: file.name,
              startBeat: playheadBeat, // Import at playhead
              duration: 16, // Default length
              offset: 0,
              muted: false,
              color: 'bg-blue-500'
          };
          setAudioClips(prev => [...prev, newClip]);
      }
  };

  const handleClipClick = (e: React.MouseEvent, clip: AudioClip) => {
      e.stopPropagation();
      
      if (activeTool === 'SELECT') {
          setSelectedClipId(clip.id);
      }
      else if (activeTool === 'DELETE') {
          setAudioClips(prev => prev.filter(c => c.id !== clip.id));
      }
      else if (activeTool === 'MUTE') {
          setAudioClips(prev => prev.map(c => c.id === clip.id ? { ...c, muted: !c.muted } : c));
      }
      else if (activeTool === 'SPLIT') {
          // Calculate split point relative to clip
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const clickBeats = clickX / zoomLevel;
          
          if (clickBeats > 0.5 && clickBeats < clip.duration - 0.5) {
              const newClip1: AudioClip = {
                  ...clip,
                  duration: clickBeats
              };
              
              const newClip2: AudioClip = {
                  ...clip,
                  id: crypto.randomUUID(),
                  startBeat: clip.startBeat + clickBeats,
                  duration: clip.duration - clickBeats,
                  offset: clip.offset + clickBeats,
                  name: `${clip.name} (Split)`
              };
              
              setAudioClips(prev => prev.map(c => c.id === clip.id ? newClip1 : c).concat(newClip2));
          }
      }
  };

  const handleVolumeChange = (track: 'harmony' | 'drums' | 'bass' | 'audio', val: number) => {
      setVolumes(prev => ({ ...prev, [track]: val }));
      // Map to service instrument types
      if (track === 'harmony') setInstrumentVolume('guitar', val);
      if (track === 'drums') setInstrumentVolume('drums', val);
      if (track === 'bass') setInstrumentVolume('bass', val);
      if (track === 'audio') setInstrumentVolume('vocals', val);
  };

  const styles: { id: BackingTrackStyle; label: string; color: string; desc: string }[] = [
      { id: 'ROCK', label: 'Arena Rock', color: 'from-blue-600 to-indigo-700', desc: 'Powerful 8th note drive' },
      { id: 'BLUES', label: 'Chicago Blues', color: 'from-sky-500 to-blue-600', desc: '12/8 Shuffle feel with walking bass' },
      { id: 'FUNK', label: 'Neon Funk', color: 'from-fuchsia-500 to-purple-600', desc: 'Syncopated slap bass & tight snare' },
      { id: 'REGGAE', label: 'Roots Reggae', color: 'from-green-500 to-yellow-500', desc: 'One drop beat & heavy sub bass' },
      { id: 'JAZZ', label: 'Smooth Jazz', color: 'from-amber-400 to-orange-600', desc: 'Swing ride cymbal & walking bass' },
      { id: 'LOFI', label: 'Lo-Fi Chill', color: 'from-indigo-300 to-purple-400', desc: 'Laid back swing beats' },
      { id: 'METAL', label: 'Modern Metal', color: 'from-slate-700 to-black', desc: 'Double kick & aggressive picking' },
      { id: 'COUNTRY', label: 'Nashville', color: 'from-orange-300 to-amber-500', desc: 'Classic Train Beat & Root-5' },
      { id: 'LATIN', label: 'Bossa Nova', color: 'from-emerald-400 to-teal-600', desc: 'Syncopated Clave feel' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-2 md:p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
       <div className="w-full h-full max-w-[95vw] flex flex-col md:flex-row bg-[#0c0c12] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative">
           
           <button onClick={onClose} className="absolute top-4 right-4 z-50 p-2 bg-black/50 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
               <X size={20} />
           </button>

           {/* LEFT SIDEBAR: Controls & Style */}
           <div className="w-full md:w-64 bg-[#111118] border-r border-slate-800 p-4 md:p-6 flex flex-col gap-6 z-20">
               <div className="flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-400">
                   <AudioWaveform size={28} className="text-pink-500" />
                   <h2 className="text-2xl font-black italic tracking-tighter">MINI<span className="text-white">DAW</span></h2>
               </div>

               {/* Mode Switcher */}
               <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800">
                   <button 
                      onClick={() => setActiveTab('DAW')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'DAW' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                   >
                       ARRANGER
                   </button>
                   <button 
                      onClick={() => setActiveTab('LOOPER')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'LOOPER' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                   >
                       LOOPER
                   </button>
               </div>

               {/* Transport */}
               <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-inner relative overflow-hidden">
                   {errorMsg && (
                       <div className="absolute inset-0 bg-slate-900/95 z-20 flex flex-col items-center justify-center p-4 text-center animate-in fade-in">
                           <AlertCircle className="text-red-500 mb-2" size={24} />
                           <p className="text-red-400 font-bold text-xs uppercase mb-1">{errorMsg}</p>
                           <p className="text-slate-400 text-[10px] leading-tight mb-3">{suggestion}</p>
                           <button 
                             onClick={() => { setErrorMsg(null); setSuggestion(null); }}
                             className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-[10px] hover:text-white"
                           >
                             Dismiss
                           </button>
                       </div>
                   )}

                   <div className="flex justify-between items-center mb-4">
                       <div>
                            <div className="text-[10px] font-bold text-slate-500">TEMPO</div>
                            <div className="text-xl font-mono text-cyan-400 leading-none">{bpm}</div>
                       </div>
                       <div>
                            <div className="text-[10px] font-bold text-slate-500 text-right">BAR:BEAT</div>
                            <div className="text-lg font-mono text-white leading-none">
                                {Math.floor(playheadBeat / 4) + 1}:{Math.floor(playheadBeat % 4) + 1}
                            </div>
                       </div>
                   </div>
                   <div className="flex gap-2">
                       <button 
                           onClick={handleRecordToggle}
                           className={`flex-1 py-3 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-red-500 hover:bg-slate-700 border border-slate-700'}`}
                       >
                           <Mic size={14} fill="currentColor" />
                           REC
                       </button>
                       <button 
                           onClick={onTogglePlay}
                           className={`flex-[2] py-3 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg ${isPlaying ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-green-500 text-white hover:bg-green-600'}`}
                       >
                           {isPlaying ? <Square size={14} fill="currentColor"/> : <Play size={14} fill="currentColor"/>}
                           {isPlaying ? 'STOP' : 'PLAY'}
                       </button>
                   </div>
               </div>
               
               {/* Style List */}
               <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                   <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                       <Drum size={12} /> Backing Style
                   </label>
                   {styles.map(style => (
                       <button
                          key={style.id}
                          onClick={() => onStyleChange(style.id)}
                          className={`w-full text-left p-3 rounded-xl border transition-all group relative overflow-hidden ${currentStyle === style.id ? `border-white/20 shadow-lg` : 'bg-transparent border-transparent hover:bg-slate-900'}`}
                       >
                           {currentStyle === style.id && <div className={`absolute inset-0 bg-gradient-to-r ${style.color} opacity-20`} />}
                           <div className="flex justify-between items-center mb-1 relative z-10">
                               <span className={`text-sm font-bold ${currentStyle === style.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{style.label}</span>
                               <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${style.color}`} />
                           </div>
                           <p className="text-[10px] text-slate-500 group-hover:text-slate-400 leading-tight relative z-10">{style.desc}</p>
                       </button>
                   ))}
               </div>
           </div>

           {/* RIGHT AREA: TIMELINE / EDITOR */}
           <div className="flex-1 bg-[#13131d] relative flex flex-col overflow-hidden">
               
               {activeTab === 'DAW' && (
                   <>
                       {/* DAW TOOLBAR */}
                       <div className="h-14 bg-[#1a1a24] border-b border-slate-800 flex items-center px-4 gap-4 justify-between">
                           
                           {/* Tools */}
                           <div className="flex gap-1 bg-black/40 p-1 rounded-lg border border-slate-700">
                               <button 
                                  onClick={() => setActiveTool('SELECT')}
                                  className={`p-1.5 rounded-md transition-all ${activeTool === 'SELECT' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                                  title="Select (Move)"
                               >
                                   <MousePointer size={16} />
                               </button>
                               <button 
                                  onClick={() => setActiveTool('SPLIT')}
                                  className={`p-1.5 rounded-md transition-all ${activeTool === 'SPLIT' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                                  title="Split (Cut)"
                               >
                                   <Scissors size={16} />
                               </button>
                               <button 
                                  onClick={() => setActiveTool('MUTE')}
                                  className={`p-1.5 rounded-md transition-all ${activeTool === 'MUTE' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                                  title="Mute Clip"
                               >
                                   <VolumeX size={16} />
                               </button>
                               <button 
                                  onClick={() => setActiveTool('DELETE')}
                                  className={`p-1.5 rounded-md transition-all ${activeTool === 'DELETE' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-400 hover:text-red-400 hover:bg-slate-800'}`}
                                  title="Delete Clip"
                               >
                                   <Eraser size={16} />
                               </button>
                           </div>
                           
                           <div className="flex items-center gap-4">
                               {/* Zoom Controls */}
                               <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-1">
                                   <button onClick={() => setZoomLevel(Math.max(10, zoomLevel - 10))} className="p-1 hover:text-white text-slate-400"><ZoomOut size={16}/></button>
                                   <span className="text-[10px] font-mono w-8 text-center text-slate-500">{zoomLevel}%</span>
                                   <button onClick={() => setZoomLevel(Math.min(100, zoomLevel + 10))} className="p-1 hover:text-white text-slate-400"><ZoomIn size={16}/></button>
                               </div>

                               <div className="h-6 w-[1px] bg-slate-700" />

                               <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold border border-slate-700 transition-colors">
                                   <Upload size={14} /> Import
                               </button>
                               <input type="file" ref={fileInputRef} className="hidden" accept="audio/*" onChange={handleFileImport} />

                               <button className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold border border-indigo-500 transition-colors shadow-lg shadow-indigo-500/20">
                                   <Download size={14} /> Export Mix
                               </button>
                           </div>
                       </div>

                       {/* TIMELINE HEADER (RULER) */}
                       <div className="flex overflow-hidden border-b border-slate-800 bg-[#13131d]">
                           <div className="w-32 md:w-56 border-r border-slate-800 bg-[#15151e] flex-shrink-0 flex items-end justify-between px-2 pb-1 text-[9px] text-slate-500 uppercase font-bold">
                               <span>Tracks</span>
                               <span>Vol</span>
                           </div> 
                           <div className="flex-1 h-8 relative custom-scrollbar overflow-x-auto" ref={timelineRef}>
                               <div className="flex h-full items-end pb-1 select-none" style={{ width: `${64 * 4 * zoomLevel}px` }}>
                                   {Array.from({ length: 64 }).map((_, i) => (
                                       <div key={i} className="relative flex flex-col justify-end" style={{ width: `${zoomLevel * 4}px` }}>
                                           <span className="absolute bottom-2 left-1 text-[9px] font-mono text-slate-500">{i + 1}</span>
                                           <div className="h-2 w-[1px] bg-slate-700" />
                                           {/* Beat ticks */}
                                           <div className="absolute right-[75%] bottom-0 h-1 w-[1px] bg-slate-800" />
                                           <div className="absolute right-[50%] bottom-0 h-1 w-[1px] bg-slate-800" />
                                           <div className="absolute right-[25%] bottom-0 h-1 w-[1px] bg-slate-800" />
                                       </div>
                                   ))}
                               </div>
                               
                               {/* Playhead in Ruler */}
                               <div 
                                    className="absolute top-0 bottom-0 w-[1px] bg-red-500 z-50 pointer-events-none"
                                    style={{ left: `${playheadBeat * zoomLevel}px` }} 
                               >
                                   <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[8px] border-t-red-500 -ml-[4.5px]" />
                               </div>
                           </div>
                       </div>

                       {/* TRACKS AREA */}
                       <div className="flex-1 overflow-y-auto relative custom-scrollbar flex flex-col">
                           
                           {/* Instrument Tracks (Procedural) */}
                           <div className="flex h-24 bg-[#1a1a24] border-b border-slate-800 relative group">
                                <div className="w-32 md:w-56 border-r border-slate-800 p-3 bg-[#15151e] flex items-center gap-3 z-10 shadow-md">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 text-indigo-400 mb-2"><Piano size={16} /><span className="text-xs font-bold">HARMONY</span></div>
                                        <div className="flex items-center gap-1">
                                            <button className="px-1.5 py-0.5 text-[8px] font-bold bg-slate-700 text-slate-400 rounded hover:text-white">M</button>
                                            <button className="px-1.5 py-0.5 text-[8px] font-bold bg-slate-700 text-slate-400 rounded hover:text-white">S</button>
                                        </div>
                                    </div>
                                    <div className="h-16 flex items-center">
                                        <input 
                                            type="range" min="-30" max="0" 
                                            value={volumes.harmony} 
                                            onChange={(e) => handleVolumeChange('harmony', Number(e.target.value))}
                                            className="h-16 w-1 bg-slate-700 rounded-lg appearance-none cursor-pointer vertical-slider"
                                            style={{ writingMode: 'vertical-lr', direction: 'rtl', width: '4px' }}
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')] bg-opacity-5">
                                    {chords.map((chord, i) => {
                                        // Calculate position based on previous chords duration
                                        const prevBeats = chords.slice(0, i).reduce((acc, c) => acc + c.beats, 0);
                                        return (
                                            <div key={i} 
                                                className="absolute top-2 bottom-2 rounded-lg bg-indigo-900/40 border border-indigo-500/30 flex items-center justify-center"
                                                style={{ left: `${prevBeats * zoomLevel}px`, width: `${chord.beats * zoomLevel}px` }}
                                            >
                                                <span className="text-sm font-bold text-indigo-200">{chord.name}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                           </div>

                           <div className="flex h-24 bg-[#1a1a24] border-b border-slate-800 relative group">
                                <div className="w-32 md:w-56 border-r border-slate-800 p-3 bg-[#15151e] flex items-center gap-3 z-10 shadow-md">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 text-yellow-500 mb-2"><Drum size={16} /><span className="text-xs font-bold">BAND</span></div>
                                        <div className="flex items-center gap-1">
                                            <button className="px-1.5 py-0.5 text-[8px] font-bold bg-slate-700 text-slate-400 rounded hover:text-white">M</button>
                                            <button className="px-1.5 py-0.5 text-[8px] font-bold bg-slate-700 text-slate-400 rounded hover:text-white">S</button>
                                        </div>
                                    </div>
                                    <div className="h-16 flex items-center">
                                        <input 
                                            type="range" min="-30" max="0" 
                                            value={volumes.drums} 
                                            onChange={(e) => handleVolumeChange('drums', Number(e.target.value))}
                                            className="h-16 w-1 bg-slate-700 rounded-lg appearance-none cursor-pointer vertical-slider"
                                            style={{ writingMode: 'vertical-lr', direction: 'rtl', width: '4px' }}
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 relative">
                                    {/* Mock Drum Patterns */}
                                    {Array.from({ length: 32 }).map((_, i) => (
                                         <div key={i} className="absolute top-4 bottom-4 bg-yellow-900/20 border-l border-yellow-500/20" style={{ left: `${i * 4 * zoomLevel}px`, width: `${4 * zoomLevel}px` }} />
                                    ))}
                                </div>
                           </div>

                           {/* Audio Track (Editable) */}
                           <div className="flex h-32 bg-[#1a1a24] border-b border-slate-800 relative group">
                                <div className="w-32 md:w-56 border-r border-slate-800 p-3 bg-[#15151e] flex items-center gap-3 z-10 shadow-md">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2 text-red-400">
                                                {recSource === 'MIC' ? <Mic size={16} /> : <Monitor size={16} />}
                                                <span className="text-xs font-bold">REC</span>
                                            </div>
                                            
                                            {/* Source Selector */}
                                            <div className="flex bg-slate-800 rounded-lg border border-slate-700 p-0.5">
                                                <button 
                                                    onClick={() => setRecSource('MIC')}
                                                    className={`p-1 rounded text-[8px] font-bold ${recSource === 'MIC' ? 'bg-red-500 text-white' : 'text-slate-400'}`}
                                                    title="Microphone"
                                                >
                                                    MIC
                                                </button>
                                                <button 
                                                    onClick={() => setRecSource('SYSTEM')}
                                                    disabled={!isSystemAudioSupported}
                                                    className={`p-1 rounded text-[8px] font-bold ${recSource === 'SYSTEM' ? 'bg-purple-500 text-white' : 'text-slate-400'} ${!isSystemAudioSupported ? 'opacity-30 cursor-not-allowed' : ''}`}
                                                    title={isSystemAudioSupported ? "System Audio (YouTube, Spotify...)" : "System Audio not supported on this device"}
                                                >
                                                    SYS
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-1 mt-2">
                                            <button className="px-1.5 py-0.5 text-[8px] bg-slate-700 rounded text-slate-300">M</button>
                                            <button className="px-1.5 py-0.5 text-[8px] bg-slate-700 rounded text-slate-300">S</button>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-2">
                                            <div className="h-full bg-green-500 w-[60%]" style={{ opacity: isPlaying ? 1 : 0.3 }} />
                                        </div>
                                    </div>
                                    <div className="h-20 flex items-center">
                                        <input 
                                            type="range" min="-30" max="6" 
                                            value={volumes.audio} 
                                            onChange={(e) => handleVolumeChange('audio', Number(e.target.value))}
                                            className="h-20 w-1 bg-slate-700 rounded-lg appearance-none cursor-pointer vertical-slider"
                                            style={{ writingMode: 'vertical-lr', direction: 'rtl', width: '4px' }}
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex-1 relative overflow-x-auto overflow-y-hidden" style={{ minWidth: `${64 * 4 * zoomLevel}px` }}>
                                    {/* Grid Lines */}
                                    {Array.from({ length: 64 }).map((_, i) => (
                                       <div key={i} className="absolute top-0 bottom-0 w-[1px] bg-slate-800" style={{ left: `${i * 4 * zoomLevel}px` }} />
                                    ))}

                                    {/* Playhead in Track */}
                                    <div 
                                        className="absolute top-0 bottom-0 w-[1px] bg-red-500 z-40 pointer-events-none shadow-[0_0_10px_red]"
                                        style={{ left: `${playheadBeat * zoomLevel}px` }} 
                                    />

                                    {/* Clips */}
                                    {audioClips.map((clip) => (
                                        <div 
                                            key={clip.id} 
                                            onClick={(e) => handleClipClick(e, clip)}
                                            className={`absolute top-2 bottom-2 rounded-lg border flex flex-col justify-center px-2 overflow-hidden shadow-lg cursor-pointer transition-all hover:brightness-110 ${clip.muted ? 'opacity-40 grayscale' : ''} ${selectedClipId === clip.id ? 'ring-2 ring-white z-20' : 'z-10'}`}
                                            style={{ 
                                                left: `${clip.startBeat * zoomLevel}px`, 
                                                width: `${clip.duration * zoomLevel}px`,
                                                backgroundColor: clip.type === 'RECORDING' ? (clip.color === 'bg-red-500' ? '#7f1d1d' : '#581c87') : '#1e3a8a',
                                                borderColor: clip.type === 'RECORDING' ? (clip.color === 'bg-red-500' ? '#ef4444' : '#a855f7') : '#3b82f6',
                                            }}
                                        >
                                            <div className="flex items-center gap-2 text-white/90 mb-1">
                                                <AudioWaveform size={14} />
                                                <span className="text-[10px] font-bold truncate">{clip.name}</span>
                                            </div>
                                            {/* Fake Waveform */}
                                            <div className="flex items-center gap-[2px] h-full opacity-50">
                                                {Array.from({ length: Math.floor(clip.duration * zoomLevel / 4) }).map((_, i) => (
                                                    <div key={i} className="w-1 bg-white rounded-full" style={{ height: `${Math.random() * 80 + 20}%` }} />
                                                ))}
                                            </div>

                                            {/* Hover overlay based on tool */}
                                            <div className={`absolute inset-0 opacity-0 hover:opacity-100 flex items-center justify-center bg-black/20 font-bold uppercase text-[10px] tracking-widest ${activeTool === 'SPLIT' ? 'cursor-crosshair' : activeTool === 'DELETE' ? 'cursor-not-allowed text-red-500' : ''}`}>
                                                {activeTool === 'SPLIT' && <><Scissors size={14} className="mr-1"/> Cut</>}
                                                {activeTool === 'DELETE' && <Trash2 size={16} />}
                                                {activeTool === 'MUTE' && (clip.muted ? 'Unmute' : 'Mute')}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Live Recording Block */}
                                    {isRecording && (
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(playheadBeat - recordingStartBeat) * zoomLevel}px` }}
                                            transition={{ duration: 0.1, ease: "linear" }} // Smoothish update
                                            className={`absolute top-2 bottom-2 ${recSource === 'MIC' ? 'bg-red-600/50 border-red-500' : 'bg-purple-600/50 border-purple-500'} border-2 border-dashed rounded-lg flex items-center justify-end px-2 z-30`}
                                            style={{ left: `${recordingStartBeat * zoomLevel}px` }}
                                        >
                                            <div className={`w-2 h-2 rounded-full ${recSource === 'MIC' ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-purple-400 shadow-[0_0_10px_purple]'} animate-pulse`} />
                                        </motion.div>
                                    )}
                                </div>
                           </div>

                       </div>
                   </>
               )}

               {activeTab === 'LOOPER' && (
                   <div className="flex-1 p-8 flex flex-col items-center justify-center">
                        <div className="relative w-64 h-64 rounded-full border-2 border-slate-800 flex items-center justify-center mb-8">
                               <div className={`absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-500/50 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
                               <button 
                                  onClick={handleRecordToggle}
                                  className={`relative z-20 w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all ${isRecording ? 'bg-red-500 shadow-[0_0_50px_rgba(239,68,68,0.4)] scale-110' : 'bg-slate-800 hover:bg-slate-700 border border-slate-600'}`}
                               >
                                   {isRecording ? <Square size={32} fill="white" className="text-white" /> : <Mic size={32} className="text-white" />}
                                   <span className="text-[10px] font-bold text-white/50 mt-1">{isRecording ? 'STOP' : 'DUB'}</span>
                               </button>
                        </div>
                        <p className="text-slate-500 text-sm mb-4">Switch to <strong>Arranger</strong> for advanced editing tools.</p>
                   </div>
               )}

           </div>
       </div>
    </div>
  );
};
