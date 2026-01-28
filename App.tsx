
import React, { useState, useEffect, useCallback } from 'react';
import { Reorder } from 'framer-motion';
import { ChordCard } from './components/ChordCard';
import { Controls } from './components/Controls';
import { GeminiModal } from './components/GeminiModal';
import { AnalysisModal } from './components/AnalysisModal';
import { LibraryModal } from './components/LibraryModal';
import { MixerModal } from './components/MixerModal';
import { AudioImportModal } from './components/AudioImportModal';
import { LyricsModal } from './components/LyricsModal';
import { PedalboardModal } from './components/PedalboardModal';
import { LavaDashboard } from './components/LavaDashboard'; 
import { TunerModal } from './components/TunerModal'; 
import { PracticeModal } from './components/PracticeModal'; 
import { LooperModal } from './components/LooperModal'; 
import { AnimatedBackground } from './components/AnimatedBackground'; 
import { Visualizer } from './components/Visualizer';
import { WelcomeModal } from './components/WelcomeModal'; 
import { FretboardVisualizer } from './components/FretboardVisualizer'; 
import { ChordBrowser } from './components/ChordBrowser';
import { SuggestionStrip } from './components/SuggestionStrip';
import { InstallPWA } from './components/InstallPWA';
import { SongbookView } from './components/SongbookView';
import { TutorialOverlay } from './components/TutorialOverlay';
import { Toast, ToastType } from './components/Toast'; // Added
import { ChordData, BackingTrackStyle, GuitarEffects } from './types';
import { playProgression, stopPlayback, previewChord, initAudio, updateGuitarEffects, setMetronomeEnabled, exportToMidi } from './services/audioService';
import { getNextChordSuggestions } from './services/geminiService';
import { Guitar, Plus, Power, LayoutGrid, Loader2, Book, ChevronUp, ChevronDown, Lock, Unlock } from 'lucide-react';
import { transposeChord } from './utils';
import { ChordTemplate } from './services/chordDictionary';

const INITIAL_CHORDS: ChordData[] = [
  { id: '1', name: 'C', beats: 4, fingering: [-1, 3, 2, 0, 1, 0], fingers: [null, '3', '2', null, '1', null], section: 'Intro', strummingPattern: 'DOWN' },
  { id: '2', name: 'G', beats: 4, fingering: [3, 2, 0, 0, 0, 3], fingers: ['3', '2', null, null, null, '4'], section: 'Intro', strummingPattern: 'DU' },
];

const GUITAR_PRESETS: Record<string, GuitarEffects> = {
    'ACOUSTIC': { ampModel: 'ACOUSTIC_SIM', eq: { low: 2, mid: 0, high: 4 }, distortion: 0, chorus: 0, reverb: 0.15, delay: 0, masterGain: 0 },
    'CLEAN': { ampModel: 'CLEAN', eq: { low: 0, mid: 0, high: 2 }, distortion: 0, chorus: 0.2, reverb: 0.3, delay: 0.1, masterGain: 0 },
    'CHIME': { ampModel: 'BRITISH', eq: { low: 0, mid: 2, high: 5 }, distortion: 0.1, chorus: 0, reverb: 0.2, delay: 0.1, masterGain: -1 },
    'BLUES': { ampModel: 'TWEED', eq: { low: 2, mid: 1, high: 2 }, distortion: 0.3, chorus: 0, reverb: 0.15, delay: 0, masterGain: 0 },
    'BOUTIQUE': { ampModel: 'BOUTIQUE', eq: { low: 1, mid: 3, high: 1 }, distortion: 0.4, chorus: 0.1, reverb: 0.25, delay: 0.2, masterGain: -1 },
    'ROCK': { ampModel: 'PLEXI', eq: { low: 2, mid: 4, high: 3 }, distortion: 0.6, chorus: 0, reverb: 0.2, delay: 0, masterGain: -2 },
    'METAL': { ampModel: 'METAL', eq: { low: 5, mid: -5, high: 4 }, distortion: 0.9, chorus: 0, reverb: 0.1, delay: 0, masterGain: -3 },
};

function App() {
  const getInitialHistory = () => {
    const saved = localStorage.getItem('vibechord_session_history');
    return saved ? JSON.parse(saved) : [INITIAL_CHORDS];
  };

  const [history, setHistory] = useState<ChordData[][]>(getInitialHistory);
  const [historyIndex, setHistoryIndex] = useState(0);
  const chords = history[historyIndex] || [];
  
  const [clipboard, setClipboard] = useState<Partial<ChordData> | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [loopRange, setLoopRange] = useState<{start: number, end: number} | null>(null);
  
  const [isMetronomeEnabled, setIsMetronomeEnabledState] = useState(false);
  const [isBackingTrack, setIsBackingTrack] = useState(false);
  const [backingTrackStyle, setBackingTrackStyle] = useState<BackingTrackStyle>('ROCK');
  const [activeChordIndex, setActiveChordIndex] = useState<number>(-1);
  const [activeBeat, setActiveBeat] = useState<number>(-1);
  const [bpm, setBpm] = useState(90);
  const [lyrics, setLyrics] = useState('');
  const [capo, setCapo] = useState(0); 
  const [smartCapo, setSmartCapo] = useState(false);
  const [guitarEffects, setGuitarEffects] = useState<GuitarEffects>(GUITAR_PRESETS.CLEAN);
  const [selectedPreset, setSelectedPreset] = useState<string>('CLEAN');
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);
  const [isSamplesLoading, setIsSamplesLoading] = useState(false);
  
  const [suggestions, setSuggestions] = useState<ChordTemplate[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [selectedChordIndex, setSelectedChordIndex] = useState<number>(-1);

  const [modals, setModals] = useState({
      welcome: false, gemini: false, analysis: false, library: false,
      mixer: false, import: false, lyrics: false, pedalboard: false,
      dashboard: false, tuner: false, practice: false, looper: false,
      browser: false
  });

  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isFretboardVisible, setIsFretboardVisible] = useState(true);
  const [activeNote, setActiveNote] = useState<{stringIdx: number, fret: number} | null>(null);

  // TOAST STATE
  const [toast, setToast] = useState<{ message: string, type: ToastType, visible: boolean }>({ message: '', type: 'SUCCESS', visible: false });

  const showToast = (message: string, type: ToastType = 'SUCCESS') => {
      setToast({ message, type, visible: true });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
        localStorage.setItem('vibechord_session_history', JSON.stringify(history));
    }, 1000); 
    return () => clearTimeout(timer);
  }, [history]);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('vibechord_welcome_seen');
    if (hasSeenWelcome !== 'true') toggleModal('welcome', true);
    
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

        if (e.code === 'Space') {
            e.preventDefault();
            handlePlayPause();
        }
        if (e.code === 'ArrowRight') {
            setSelectedChordIndex(prev => Math.min(chords.length - 1, prev + 1));
        }
        if (e.code === 'ArrowLeft') {
            setSelectedChordIndex(prev => Math.max(0, prev - 1));
        }
        if ((e.code === 'Delete' || e.code === 'Backspace') && selectedChordIndex !== -1) {
            const newChords = chords.filter((_, i) => i !== selectedChordIndex);
            updateChords(newChords);
            setSelectedChordIndex(prev => Math.min(newChords.length - 1, prev));
            showToast("Accord supprimé", "INFO");
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isAudioInitialized, chords, bpm, capo, selectedChordIndex]);

  useEffect(() => {
    if (loopRange) {
        if (loopRange.start >= chords.length || loopRange.end >= chords.length) {
            setLoopRange(null); 
        }
    }
  }, [chords.length]);

  const fetchSuggestions = useCallback(async () => {
      if (chords.length === 0) {
          setSuggestions([]);
          return;
      }
      setIsSuggesting(true);
      try {
          const res = await getNextChordSuggestions(chords);
          setSuggestions(res);
      } catch (err) {
          console.error(err);
      } finally {
          setIsSuggesting(false);
      }
  }, [chords]);

  useEffect(() => {
      const timer = setTimeout(fetchSuggestions, 1000); // Debounce
      return () => clearTimeout(timer);
  }, [fetchSuggestions]);

  const toggleModal = (key: keyof typeof modals, state: boolean) => {
      setModals(prev => ({ ...prev, [key]: state }));
  };

  const handleStartAudio = async () => {
      setIsSamplesLoading(true);
      await initAudio(); 
      setIsSamplesLoading(false);
      setIsAudioInitialized(true);
      updateGuitarEffects(guitarEffects);
      setMetronomeEnabled(isMetronomeEnabled);
  };

  const updateChords = (newChords: ChordData[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newChords);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handlePlayPause = async () => {
    if (!isAudioInitialized) await handleStartAudio();
    if (isPlaying) {
      stopPlayback();
      setIsPlaying(false);
      setActiveChordIndex(-1);
      setActiveBeat(-1);
    } else {
      setIsPlaying(true);
      let chordsToPlay = chords;
      let offsetIndex = 0;
      if (loopRange) {
          chordsToPlay = chords.slice(loopRange.start, loopRange.end + 1);
          offsetIndex = loopRange.start;
      }
      playProgression(
          chordsToPlay, 
          bpm, 
          (i) => setActiveChordIndex(i + offsetIndex),
          (b) => setActiveBeat(b), 
          () => {
             setIsPlaying(false);
             setActiveChordIndex(-1);
             setActiveBeat(-1);
          }, 
          isLooping, 
          isBackingTrack, 
          backingTrackStyle, 
          false, 
          capo, 
          (s, f) => {
             setActiveNote({ stringIdx: s, fret: f });
             setTimeout(() => setActiveNote(null), 100);
          }
      );
    }
  };

  const handleAddChord = () => {
    const lastChord = chords[chords.length - 1];
    const newChord: ChordData = { 
        id: crypto.randomUUID(), name: '', beats: 4, 
        fingering: [-1, -1, -1, -1, -1, -1], fingers: [null, null, null, null, null, null],
        section: lastChord?.section || 'Intro',
        strummingPattern: 'ONCE'
    };
    updateChords([...chords, newChord]);
    setSelectedChordIndex(chords.length); 
    showToast("Accord ajouté", "SUCCESS");
  };

  const handleAddFromTemplate = useCallback((template: ChordTemplate) => {
    const lastChord = chords[chords.length - 1];
    const newChord: ChordData = {
        id: crypto.randomUUID(), name: template.name, beats: 4,
        fingering: template.fingering, fingers: [null, null, null, null, null, null],
        section: lastChord?.section || 'Intro',
        strummingPattern: 'ONCE'
    };
    updateChords([...chords, newChord]);
    previewChord(newChord, capo);
    setSelectedChordIndex(chords.length);
  }, [chords, capo]);

  const handleCapoChange = (newCapo: number) => {
    const diff = newCapo - capo;
    const boundedCapo = Math.max(0, Math.min(12, newCapo));
    if (smartCapo && diff !== 0) {
        const transposed = chords.map(c => transposeChord(c, -diff) || c);
        updateChords(transposed);
        showToast(`Capo ${boundedCapo} (Pitch Lock)`, "INFO");
    } else {
        showToast(`Capo ${boundedCapo}`, "INFO");
    }
    setCapo(boundedCapo);
  };

  const toggleMetronome = () => {
    const newState = !isMetronomeEnabled;
    setIsMetronomeEnabledState(newState);
    setMetronomeEnabled(newState);
    showToast(newState ? "Métronome ON" : "Métronome OFF", "INFO");
  };

  const handleSetLoopStart = (index: number) => {
      setLoopRange(prev => {
          if (!prev) return { start: index, end: chords.length - 1 };
          const newEnd = index > prev.end ? index : prev.end;
          return { start: index, end: newEnd };
      });
      setIsLooping(true);
      showToast("Début de boucle défini", "INFO");
  };

  const handleSetLoopEnd = (index: number) => {
      setLoopRange(prev => {
          if (!prev) return { start: 0, end: index };
          const newStart = index < prev.start ? index : prev.start;
          return { start: newStart, end: index };
      });
      setIsLooping(true);
      showToast("Fin de boucle définie", "INFO");
  };

  const toggleLoopMode = () => {
      setIsLooping(!isLooping);
      showToast(!isLooping ? "Boucle activée" : "Boucle désactivée", "INFO");
  };
  
  const clearLoopRange = () => {
      setLoopRange(null);
      showToast("Boucle réinitialisée", "INFO");
  };

  return (
    <>
      <div className="min-h-screen text-slate-100 pb-40 font-sans relative overflow-x-hidden bg-background print:hidden">
        <AnimatedBackground />
        <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast(prev => ({ ...prev, visible: false }))} />

        {!isAudioInitialized && !modals.welcome && (
            <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center backdrop-blur-md">
                <button onClick={handleStartAudio} disabled={isSamplesLoading} className="group flex flex-col items-center gap-6">
                    <div className={`p-10 rounded-full bg-primary shadow-[0_0_50px_rgba(34,197,94,0.4)] ${isSamplesLoading ? 'animate-pulse' : 'hover:scale-110 transition-transform'}`}>
                        {isSamplesLoading ? <Loader2 size={64} className="animate-spin text-white" /> : <Power size={64} className="text-white" />}
                    </div>
                    <h2 className="text-3xl font-black uppercase tracking-widest text-white">{isSamplesLoading ? "Chargement..." : "Entrer dans le Studio"}</h2>
                </button>
            </div>
        )}

        <header className="p-6 border-b border-slate-800/50 bg-background/50 sticky top-0 z-40 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary rounded-xl shadow-lg"><Guitar size={28} className="text-white" /></div>
              <h1 className="text-3xl font-black tracking-tighter italic">VIBE<span className="text-primary">CHORD</span></h1>
              <InstallPWA />
            </div>

            <div className="hidden sm:flex items-center gap-6">
                <div className="flex items-center gap-4 bg-slate-900/80 px-5 py-2.5 rounded-2xl border border-slate-700 backdrop-blur-md shadow-inner">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Capodastre</span>
                        <button 
                          onClick={() => setSmartCapo(!smartCapo)}
                          className={`flex items-center gap-1.5 text-[8px] font-black uppercase transition-colors ${smartCapo ? 'text-primary' : 'text-slate-600'}`}
                        >
                          {smartCapo ? <Lock size={10} /> : <Unlock size={10} />}
                          {smartCapo ? 'Pitch Lock ON' : 'Normal'}
                        </button>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => handleCapoChange(capo - 1)} className="p-1.5 bg-slate-800 rounded-lg hover:text-primary hover:bg-slate-700 transition-all active:scale-95 text-slate-400"><ChevronDown size={18}/></button>
                        <div className="flex flex-col items-center min-w-[2.5rem]">
                            <span className="text-2xl font-black text-white leading-none">{capo}</span>
                            <span className="text-[8px] text-slate-500 font-bold uppercase">fret</span>
                        </div>
                        <button onClick={() => handleCapoChange(capo + 1)} className="p-1.5 bg-slate-800 rounded-lg hover:text-primary hover:bg-slate-700 transition-all active:scale-95 text-slate-400"><ChevronUp size={18}/></button>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <Visualizer isPlaying={isPlaying} />
                    <button onClick={() => toggleModal('dashboard', true)} className="p-3 bg-slate-800 rounded-2xl hover:bg-slate-700 transition-all border border-slate-700">
                        <LayoutGrid size={24}/>
                    </button>
                </div>
            </div>
          </div>
        </header>

        <main className="max-w-[95rem] mx-auto p-6 md:p-10" onClick={() => setSelectedChordIndex(-1)}>
          <SuggestionStrip 
              suggestions={suggestions} 
              isLoading={isSuggesting} 
              onAdd={handleAddFromTemplate}
              onRefresh={fetchSuggestions}
              isVisible={chords.length > 0}
          />

          <div className="flex flex-wrap items-start gap-8 justify-center lg:justify-start">
              <Reorder.Group axis="x" values={chords} onReorder={updateChords} className="flex flex-wrap gap-8 justify-center lg:justify-start">
                  {chords.map((chord, index) => {
                      const isLoopStart = loopRange?.start === index;
                      const isLoopEnd = loopRange?.end === index;
                      const isInLoop = loopRange ? index >= loopRange.start && index <= loopRange.end : false;

                      return (
                      <Reorder.Item key={chord.id} value={chord} className="relative" onPointerDown={() => setSelectedChordIndex(index)}>
                          <div className={selectedChordIndex === index ? "ring-2 ring-indigo-500 rounded-2xl" : ""}>
                            <ChordCard 
                                chord={chord} 
                                isActive={activeChordIndex === index}
                                activeBeat={activeChordIndex === index ? activeBeat : -1}
                                onDelete={() => { updateChords(chords.filter(c => c.id !== chord.id)); showToast("Accord supprimé", "INFO"); }}
                                onDuplicate={() => {
                                    const newChords = [...chords];
                                    newChords.splice(index + 1, 0, { ...chord, id: crypto.randomUUID() });
                                    updateChords(newChords);
                                    showToast("Accord dupliqué", "SUCCESS");
                                }}
                                onCopy={() => { setClipboard(chord); showToast("Copié dans le presse-papier", "SUCCESS"); }}
                                onPaste={() => {
                                    if (clipboard) {
                                        updateChords(chords.map(c => c.id === chord.id ? { ...chord, ...clipboard, id: chord.id } : c));
                                        showToast("Collé !", "SUCCESS");
                                    }
                                }}
                                canPaste={!!clipboard}
                                index={index}
                                onFingeringChange={(s, f, l) => {
                                    const newChords = chords.map(c => {
                                        if (c.id === chord.id) {
                                            const nf = [...c.fingering];
                                            const nfingers = [...(c.fingers || [null,null,null,null,null,null])];
                                            nf[s] = f; nfingers[s] = l || null;
                                            return { ...c, fingering: nf, fingers: nfingers };
                                        }
                                        return c;
                                    });
                                    updateChords(newChords);
                                }}
                                onNameChange={(name) => updateChords(chords.map(c => c.id === chord.id ? { ...c, name } : c))}
                                onEditChord={(field, val) => updateChords(chords.map(c => c.id === chord.id ? { ...c, [field]: val } : c))}
                                onPlay={() => previewChord(chord, capo)}
                                capo={capo}
                                isLoopStart={isLoopStart}
                                isLoopEnd={isLoopEnd}
                                isInLoop={isInLoop}
                                onSetLoopStart={() => handleSetLoopStart(index)}
                                onSetLoopEnd={() => handleSetLoopEnd(index)}
                            />
                          </div>
                      </Reorder.Item>
                  )})}
              </Reorder.Group>
              
              <div className="flex flex-col gap-4 mt-8">
                  <button onClick={(e) => { e.stopPropagation(); toggleModal('browser', true); }} className="w-36 h-32 md:w-48 rounded-2xl border-4 border-primary/40 bg-primary/10 hover:bg-primary/20 flex flex-col items-center justify-center text-primary transition-all group">
                      <Book size={32} />
                      <span className="mt-4 text-[10px] font-black uppercase tracking-widest">Dictionnaire</span>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleAddChord(); }} className="w-36 h-24 md:w-48 rounded-2xl border-2 border-dashed border-slate-700 hover:bg-slate-800 flex flex-col items-center justify-center text-slate-500 transition-all">
                      <Plus size={24} />
                      <span className="mt-2 text-[10px] font-black uppercase tracking-widest">Accord Vide</span>
                  </button>
              </div>
          </div>
        </main>

        <Controls 
          isPlaying={isPlaying} onPlayPause={handlePlayPause} onReset={() => {stopPlayback(); setIsPlaying(false); setActiveChordIndex(-1);}}
          bpm={bpm} setBpm={setBpm} onAddChord={handleAddChord} onGenerate={() => toggleModal('gemini', true)}
          onUndo={() => historyIndex > 0 && setHistoryIndex(historyIndex - 1)}
          onRedo={() => historyIndex < history.length - 1 && setHistoryIndex(historyIndex + 1)}
          canUndo={historyIndex > 0} canRedo={historyIndex < history.length - 1} 
          isLooping={isLooping} onToggleLoop={toggleLoopMode} onClearLoopRange={clearLoopRange} hasLoopRange={!!loopRange}
          onTranspose={(s) => { updateChords(chords.map(c => transposeChord(c, s) || c)); showToast(s > 0 ? "Transposé +1" : "Transposé -1", "INFO"); }}
          onAnalyze={() => toggleModal('analysis', true)} isBackingTrack={isBackingTrack}
          onToggleBackingTrack={() => { setIsBackingTrack(!isBackingTrack); showToast(!isBackingTrack ? "Band Activé" : "Band Désactivé", "INFO"); }} backingTrackStyle={backingTrackStyle}
          onOpenLibrary={() => toggleModal('library', true)}
          onOpenMixer={() => toggleModal('mixer', true)} onImportAudio={() => toggleModal('import', true)}
          onOpenLyrics={() => toggleModal('lyrics', true)} onOpenPedalboard={() => toggleModal('pedalboard', true)}
          capo={capo} setCapo={handleCapoChange} currentPreset={selectedPreset}
          onSetPreset={(p) => {setSelectedPreset(p); updateGuitarEffects(GUITAR_PRESETS[p]); showToast(`Preset: ${p}`, "SUCCESS"); }}
          presets={Object.keys(GUITAR_PRESETS)} onOpenWelcome={() => toggleModal('welcome', true)}
          onToggleFretboard={() => setIsFretboardVisible(!isFretboardVisible)} isFretboardVisible={isFretboardVisible}
          isMetronomeEnabled={isMetronomeEnabled} onToggleMetronome={toggleMetronome}
          onOpenLooper={() => toggleModal('looper', true)}
          onMidiExport={() => { exportToMidi(chords, bpm, capo); showToast("Export MIDI commencé...", "SUCCESS"); }}
        />
        
        <TutorialOverlay isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />

        <FretboardVisualizer currentChord={activeChordIndex !== -1 ? chords[activeChordIndex] : (selectedChordIndex !== -1 ? chords[selectedChordIndex] : null)} capo={capo} isVisible={isFretboardVisible} onClose={() => setIsFretboardVisible(false)} activeNote={activeNote} />
        <WelcomeModal isOpen={modals.welcome} onClose={() => toggleModal('welcome', false)} onOpenAI={() => {toggleModal('welcome', false); toggleModal('gemini', true);}} onLoadDemo={() => {toggleModal('welcome', false); handleStartAudio();}} onStartTutorial={() => { toggleModal('welcome', false); setIsTutorialOpen(true); }} />
        <GeminiModal isOpen={modals.gemini} onClose={() => toggleModal('gemini', false)} onSuccess={(c, e) => {updateChords(c); if(e) updateGuitarEffects(e); showToast("Progression générée !", "SUCCESS"); }} />
        <AnalysisModal isOpen={modals.analysis} onClose={() => toggleModal('analysis', false)} currentChords={chords} onApplyVariation={(c) => { updateChords(c); showToast("Variation appliquée", "SUCCESS"); }} />
        <MixerModal isOpen={modals.mixer} onClose={() => toggleModal('mixer', false)} />
        <PedalboardModal isOpen={modals.pedalboard} onClose={() => toggleModal('pedalboard', false)} currentEffects={guitarEffects} onEffectsChange={setGuitarEffects} />
        <LibraryModal isOpen={modals.library} onClose={() => toggleModal('library', false)} currentChords={chords} currentBpm={bpm} currentStyle={backingTrackStyle} currentLyrics={lyrics} onLoad={(c, b, s, l) => {updateChords(c); setBpm(b); setBackingTrackStyle(s); setLyrics(l); showToast("Projet chargé", "SUCCESS"); }} />
        <AudioImportModal isOpen={modals.import} onClose={() => toggleModal('import', false)} onTrackLoaded={(n) => showToast(`Piste chargée: ${n}`, "SUCCESS")} onChordsTranscribed={(c) => { updateChords(c); showToast("Accords transcrits !", "SUCCESS"); }} currentTrackName={null} />
        <LyricsModal isOpen={modals.lyrics} onClose={() => toggleModal('lyrics', false)} lyrics={lyrics} setLyrics={setLyrics} chords={chords} />
        <LavaDashboard isOpen={modals.dashboard} onClose={() => toggleModal('dashboard', false)} onOpenApp={(a) => {
            if (a === 'tuner') toggleModal('tuner', true);
            if (a === 'practice') toggleModal('practice', true);
            if (a === 'loops') toggleModal('looper', true);
            if (a === 'library') toggleModal('browser', true);
        }} />
        <TunerModal isOpen={modals.tuner} onClose={() => toggleModal('tuner', false)} />
        <PracticeModal isOpen={modals.practice} onClose={() => toggleModal('practice', false)} chords={chords} />
        <LooperModal isOpen={modals.looper} onClose={() => toggleModal('looper', false)} isPlaying={isBackingTrack} onTogglePlay={() => setIsBackingTrack(!isBackingTrack)} currentStyle={backingTrackStyle} onStyleChange={setBackingTrackStyle} bpm={bpm} chords={chords} />
        <ChordBrowser isOpen={modals.browser} onClose={() => toggleModal('browser', false)} onAddChord={(c) => { handleAddFromTemplate(c); showToast(`${c.name} ajouté`, "SUCCESS"); }} />
      </div>
      <SongbookView chords={chords} lyrics={lyrics} bpm={bpm} capo={capo} />
    </>
  );
}

export default App;
