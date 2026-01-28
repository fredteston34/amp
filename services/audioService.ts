
import * as Tone from 'tone';
import { ChordData, BackingTrackStyle, GuitarEffects, InstrumentType } from '../types';
import { Midi } from 'https://esm.sh/@tonejs/midi@^2.0.28';

let masterOutput: Tone.Volume | null = null;
let recorder: Tone.Recorder | null = null; 
let inputRecorder: Tone.Recorder | null = null;
let inputSourceStream: MediaStream | null = null;
let analyser: Tone.Analyser | null = null;

let guitarVol: Tone.Volume | null = null;
let metronomeSynth: Tone.MembraneSynth | null = null;
let guitarSampler: Tone.Sampler | null = null;

let guitarReverb: Tone.Reverb | null = null;
let guitarChorus: Tone.Chorus | null = null;
let guitarDistortion: Tone.Distortion | null = null;
let guitarEQ: Tone.EQ3 | null = null;
let guitarDelay: Tone.FeedbackDelay | null = null;
let guitarGate: Tone.Gate | null = null;
let guitarInputFilter: Tone.Filter | null = null;
let guitarInputGain: Tone.Gain | null = null;

// Backing Track Instruments
let bassSynth: Tone.MonoSynth | null = null;
let bassVol: Tone.Volume | null = null;
let drumKit: {
    kick: Tone.MembraneSynth,
    snare: Tone.NoiseSynth,
    hihat: Tone.MetalSynth
} | null = null;
let drumVol: Tone.Volume | null = null;

let vocalPlayer: Tone.Player | null = null;
let mic: Tone.UserMedia | null = null;
let tunerAnalyser: Tone.Analyser | null = null;
let liveInputActive = false;

let metronomeEnabled = false;

const TUNING = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'];

export const setMetronomeEnabled = (enabled: boolean) => {
  metronomeEnabled = enabled;
};

export const initAudio = async (): Promise<boolean> => {
  if (Tone.context.state !== 'running') await Tone.start();
  
  if (!masterOutput) {
      const limiter = new Tone.Limiter(-1).toDestination();
      masterOutput = new Tone.Volume(0).connect(limiter);
      recorder = new Tone.Recorder();
      inputRecorder = new Tone.Recorder();
      analyser = new Tone.Analyser("fft", 64); 
      limiter.connect(recorder);
      limiter.connect(analyser);
  }

  if (!guitarVol) guitarVol = new Tone.Volume(-2).connect(masterOutput);
  if (!bassVol) bassVol = new Tone.Volume(-2).connect(masterOutput!);
  if (!drumVol) drumVol = new Tone.Volume(-2).connect(masterOutput!);
  
  if (!metronomeSynth) {
      metronomeSynth = new Tone.MembraneSynth({
          pitchDecay: 0.008,
          octaves: 2,
          envelope: { attack: 0.0006, decay: 0.1, sustain: 0 }
      }).connect(masterOutput!);
      metronomeSynth.volume.value = -12;
  }

  // Initialize Backing Instruments
  if (!bassSynth) {
      bassSynth = new Tone.MonoSynth({
          oscillator: { type: "sawtooth" },
          envelope: { attack: 0.05, decay: 0.2, sustain: 0.4, release: 1 },
          filterEnvelope: { attack: 0.001, decay: 0.1, sustain: 0.2, baseFrequency: 200, octaves: 2 }
      }).connect(bassVol!);
  }

  if (!drumKit) {
      drumKit = {
          kick: new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 4, oscillator: { type: "sine" }, envelope: { attack: 0.001, decay: 0.2, sustain: 0 } }).connect(drumVol!),
          snare: new Tone.NoiseSynth({ noise: { type: "pink" }, envelope: { attack: 0.001, decay: 0.2, sustain: 0 } }).connect(drumVol!),
          hihat: new Tone.MetalSynth({ frequency: 200, envelope: { attack: 0.001, decay: 0.05, release: 0.05 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5 }).connect(drumVol!)
      };
      drumKit.hihat.volume.value = -15; // Tame the hihat
      drumKit.snare.volume.value = -10;
  }

  return new Promise((resolve) => {
      if (guitarSampler) return resolve(true);

      guitarReverb = new Tone.Reverb({ decay: 2.5, wet: 0.2 }).connect(guitarVol!);
      guitarDelay = new Tone.FeedbackDelay("8n.", 0.3).connect(guitarReverb);
      guitarChorus = new Tone.Chorus(2.5, 3.5, 0.5).start().connect(guitarDelay);
      guitarEQ = new Tone.EQ3(0, 0, 0).connect(guitarChorus);
      guitarDistortion = new Tone.Distortion(0).connect(guitarEQ);
      
      guitarGate = new Tone.Gate(-40).connect(guitarDistortion);
      guitarInputFilter = new Tone.Filter(80, "highpass").connect(guitarGate);
      guitarInputGain = new Tone.Gain(1).connect(guitarInputFilter);

      guitarSampler = new Tone.Sampler({
          urls: { "E2": "E2.mp3", "A2": "A2.mp3", "D3": "D3.mp3", "G3": "G3.mp3", "B3": "B3.mp3", "E4": "E4.mp3" },
          baseUrl: "https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/electric_guitar_clean-mp3/",
          onload: () => resolve(true)
      }).connect(guitarDistortion);
  });
};

export const getAvailableAudioInputs = async (): Promise<MediaDeviceInfo[]> => {
    if (!mic) mic = new Tone.UserMedia();
    try {
        const devices = await mic.enumerateDevices();
        return devices.filter(d => d.kind === 'audioinput');
    } catch (e) {
        console.error("Error enumerating devices", e);
        return [];
    }
};

export const toggleLiveGuitarInput = async (active: boolean, deviceId?: string) => {
    await initAudio();
    if (!mic) {
        mic = new Tone.UserMedia();
        mic.connect(guitarInputGain!);
    }

    if (active) {
        try {
            await mic.open(deviceId); 
            liveInputActive = true;
        } catch (e) {
            console.error("Failed to open mic", e);
            liveInputActive = false;
            throw e;
        }
    } else {
        mic.close();
        liveInputActive = false;
    }
    return liveInputActive;
};

export const setInputGain = (gain: number) => {
    if (guitarInputGain) {
        guitarInputGain.gain.value = gain; 
    }
};

export const updateGuitarEffects = (effects: GuitarEffects) => {
    if (!guitarDistortion || !guitarEQ || !guitarChorus || !guitarReverb || !guitarDelay || !guitarGate) return;
    
    let drive = effects.distortion;
    let low = effects.eq.low;
    let mid = effects.eq.mid;
    let high = effects.eq.high;

    switch (effects.ampModel) {
        case 'CITRUS': drive = Math.min(1, drive * 1.2 + 0.1); mid += 4; break;
        case 'METAL': drive = Math.min(1, drive * 1.5 + 0.3); mid -= 6; low += 4; break;
        case 'BRITISH': mid += 2; high += 3; break;
        case 'PLEXI': drive = Math.max(0.2, drive); mid += 5; low += 2; break;
        case 'BOUTIQUE': mid += 1; low += 1; break;
        case 'ACOUSTIC_SIM': drive = 0; high += 5; low += 2; break;
    }

    guitarDistortion.distortion = drive;
    guitarEQ.low.value = low;
    guitarEQ.mid.value = mid;
    guitarEQ.high.value = high;
    guitarChorus.wet.value = effects.chorus;
    guitarReverb.wet.value = effects.reverb;
    guitarDelay.wet.value = effects.delay;

    if (effects.noiseGateThreshold !== undefined) {
        guitarGate.threshold = effects.noiseGateThreshold;
    }
    
    if (guitarVol) guitarVol.volume.value = effects.masterGain;
};

export const playNote = async (stringIdx: number, fret: number, capo: number = 0) => {
    await initAudio();
    if (!guitarSampler || fret < 0) return;
    const note = Tone.Frequency(TUNING[stringIdx]).transpose(fret + capo).toNote();
    guitarSampler.triggerAttackRelease(note, "4n", undefined, 0.7 + Math.random() * 0.1); // Slight humanize
};

export const previewChord = async (chord: ChordData, capo: number = 0, velocity = 0.8) => {
    await initAudio();
    if (!guitarSampler || !chord.fingering) return;
    const now = Tone.now();
    chord.fingering.forEach((fret, i) => {
        if (fret !== -1) {
            const note = Tone.Frequency(TUNING[i]).transpose(fret + capo).toNote();
            // Stagger notes slightly for strum effect + Humanize velocity
            guitarSampler?.triggerAttackRelease(note, "2n", now + (i * 0.03) + (Math.random() * 0.01), velocity + (Math.random() * 0.1 - 0.05));
        }
    });
};

const strumChord = (chord: ChordData, time: number, capo: number, direction: 'UP' | 'DOWN' = 'DOWN', velocity = 0.7, onNote?: (s: number, f: number) => void) => {
    if (!guitarSampler || !chord.fingering) return;
    const indices = direction === 'DOWN' ? [0, 1, 2, 3, 4, 5] : [5, 4, 3, 2, 1, 0];
    indices.forEach((i, step) => {
        const fret = chord.fingering[i];
        if (fret !== -1) {
            const note = Tone.Frequency(TUNING[i]).transpose(fret + capo).toNote();
            const humanVel = velocity + (Math.random() * 0.15 - 0.075); // Velocity Variation
            const humanTiming = step * 0.015 + (Math.random() * 0.005); // Timing Variation
            const triggerTime = time + humanTiming;
            
            guitarSampler?.triggerAttackRelease(note, "4n", triggerTime, Math.max(0.1, Math.min(1, humanVel)));
            if (onNote) {
                Tone.Draw.schedule(() => onNote(i, fret), triggerTime);
            }
        }
    });
};

// Helper: Extract root note from chord name for Bass
const getRootNote = (chordName: string): string => {
    const match = chordName.match(/^([A-G][#b]?)/);
    return match ? match[1] + "2" : "C2"; // Default octave 2 for bass
};

export const stopPlayback = () => {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    if (guitarSampler) guitarSampler.releaseAll();
    if (bassSynth) bassSynth.releaseAll();
    if (vocalPlayer) vocalPlayer.stop();
};

export const playProgression = async (
    chords: ChordData[], 
    bpm: number, 
    onChordChange: (index: number) => void,
    onBeat: (beat: number) => void,
    onFinish: () => void,
    isLooping: boolean = false,
    isBackingTrack: boolean = false,
    style: BackingTrackStyle = 'ROCK',
    isSoloist: boolean = false,
    capo: number = 0,
    onNote?: (s: number, f: number) => void
) => {
    await initAudio();
    stopPlayback();
    Tone.Transport.bpm.value = bpm;

    let totalBeats = 0;
    chords.forEach((chord, idx) => {
        const chordStartBeat = totalBeats;
        const pattern = chord.strummingPattern || 'ONCE';
        const root = getRootNote(chord.name);
        const fifth = Tone.Frequency(root).transpose(7).toNote();

        for (let b = 0; b < chord.beats; b++) {
            const absoluteBeat = chordStartBeat + b;
            const beatTime = absoluteBeat * Tone.Time("4n").toSeconds();
            const localBeat = absoluteBeat % 4; // 0, 1, 2, 3
            
            Tone.Transport.schedule((t) => {
                Tone.Draw.schedule(() => onBeat(b), t);
                
                // --- METRONOME ---
                if (metronomeSynth && metronomeEnabled) {
                    const isFirstBeatOfChord = b === 0;
                    metronomeSynth.triggerAttackRelease(isFirstBeatOfChord ? 'C6' : 'C5', "32n", t, isFirstBeatOfChord ? 1 : 0.6);
                }

                // --- BACKING TRACK LOGIC ---
                if (isBackingTrack && drumKit && bassSynth) {
                    const kick = drumKit.kick;
                    const snare = drumKit.snare;
                    const hat = drumKit.hihat;
                    
                    // Simple 8th note definition for sub-beats
                    const t_and = t + Tone.Time("8n").toSeconds();
                    const t_e = t + Tone.Time("16n").toSeconds();
                    const t_a = t + Tone.Time("8n.").toSeconds();

                    switch (style) {
                        case 'ROCK': // Kick on 1, 3. Snare on 2, 4. Bass 8ths.
                            if (localBeat === 0) { kick.triggerAttackRelease("C1", "8n", t); }
                            if (localBeat === 2) { kick.triggerAttackRelease("C1", "8n", t); }
                            if (localBeat === 1 || localBeat === 3) { snare.triggerAttackRelease("16n", t); }
                            
                            hat.triggerAttackRelease("32n", t, 0.5);
                            hat.triggerAttackRelease("32n", t_and, 0.3);
                            
                            bassSynth.triggerAttackRelease(root, "8n", t);
                            bassSynth.triggerAttackRelease(root, "8n", t_and);
                            break;

                        case 'BLUES': // Shuffle feel. Kick 1, 3. Snare 2, 4. Walking bass.
                            // Bass walk: 1->Root, 2->3rd/5th, 3->5th/6th, 4->Root
                            if (localBeat === 0) kick.triggerAttackRelease("C1", "8n", t);
                            if (localBeat === 2) kick.triggerAttackRelease("C1", "8n", t);
                            if (localBeat === 1 || localBeat === 3) snare.triggerAttackRelease("16n", t);
                            
                            hat.triggerAttackRelease("32n", t, 0.6); // Swing handled by Transport? Ideally yes, manual swing here:
                            hat.triggerAttackRelease("32n", t + Tone.Time("8n").toSeconds() * 1.3, 0.4); // Poor man's swing

                            const note = localBeat === 0 ? root : (localBeat === 2 ? fifth : root);
                            bassSynth.triggerAttackRelease(note, "4n", t);
                            break;

                        case 'REGGAE': // One Drop. Kick & Snare on 3. Bass on 1 & 3 syncopated.
                            if (localBeat === 2) { // Beat 3
                                kick.triggerAttackRelease("C1", "8n", t);
                                snare.triggerAttackRelease("16n", t, 0.8); // Rimshot-ish
                            }
                            hat.triggerAttackRelease("32n", t_and, 0.6); // Offbeats

                            if (localBeat === 0 || localBeat === 2) {
                                bassSynth.triggerAttackRelease(root, "8n", t);
                            }
                            if (localBeat === 1) bassSynth.triggerAttackRelease(root, "8n", t_and);
                            break;

                        case 'FUNK': // Kick 1. Snare 2, 4. Ghost notes. Bass Slap.
                            if (localBeat === 0) kick.triggerAttackRelease("C1", "8n", t);
                            if (localBeat === 2 && Math.random() > 0.5) kick.triggerAttackRelease("C1", "16n", t_and);
                            if (localBeat === 1 || localBeat === 3) snare.triggerAttackRelease("16n", t);
                            
                            hat.triggerAttackRelease("32n", t, 0.7);
                            hat.triggerAttackRelease("32n", t_e, 0.3);
                            hat.triggerAttackRelease("32n", t_and, 0.5);
                            hat.triggerAttackRelease("32n", t_a, 0.3);

                            if (localBeat === 0) bassSynth.triggerAttackRelease(root, "16n", t);
                            if (localBeat === 0) bassSynth.triggerAttackRelease(root, "16n", t_a); // Octave pop?
                            break;

                        case 'LOFI': // Laid back. Kick 1, 2-and. Snare 4.
                            if (localBeat === 0) kick.triggerAttackRelease("C1", "8n", t);
                            if (localBeat === 1) kick.triggerAttackRelease("C1", "8n", t_and); // 2-and
                            if (localBeat === 3) snare.triggerAttackRelease("8n", t); // 4
                            
                            hat.triggerAttackRelease("8n", t, 0.3); // Soft hats

                            if (localBeat === 0) bassSynth.triggerAttackRelease(root, "1m", t); // Long bass
                            break;

                        case 'METAL': // Double kick. Fast 8ths.
                            kick.triggerAttackRelease("C1", "16n", t);
                            kick.triggerAttackRelease("C1", "16n", t_and);
                            if (localBeat === 1 || localBeat === 3) snare.triggerAttackRelease("16n", t, 1);
                            
                            hat.triggerAttackRelease("32n", t, 0.8);
                            hat.triggerAttackRelease("32n", t_and, 0.8);

                            bassSynth.triggerAttackRelease(root, "8n", t);
                            bassSynth.triggerAttackRelease(root, "8n", t_and);
                            break;

                        case 'COUNTRY': // Train beat. Kick 1, 3. Snare (brush) all 8ths, accent 2, 4. Bass Root-5.
                            if (localBeat === 0 || localBeat === 2) kick.triggerAttackRelease("C1", "8n", t);
                            snare.triggerAttackRelease("32n", t, localBeat % 2 === 1 ? 0.8 : 0.3); // Accent 2 & 4
                            snare.triggerAttackRelease("32n", t_and, 0.3); 

                            if (localBeat === 0) bassSynth.triggerAttackRelease(root, "4n", t);
                            if (localBeat === 2) bassSynth.triggerAttackRelease(fifth, "4n", t);
                            break;
                        
                        case 'JAZZ': // Ride pattern. Walk bass.
                            hat.triggerAttackRelease("32n", t, 0.3); // Pedal hat on 2 & 4?
                            if (localBeat === 1 || localBeat === 3) hat.triggerAttackRelease("32n", t, 0.2); // Just keep time
                            // Ride cymbal usually...
                            
                            bassSynth.triggerAttackRelease(root, "4n", t); // Walking logic is complex, keep simple root/5
                            break;

                        case 'LATIN': // Bossa. Kick on 1, 2-and (syncopated). Clave.
                            if (localBeat === 0) kick.triggerAttackRelease("C1", "8n", t);
                            if (localBeat === 2) kick.triggerAttackRelease("C1", "8n", t); // Surdo pattern
                            
                            // Rim clicks (clave-ish)
                            if (localBeat === 0) snare.triggerAttackRelease("32n", t, 0.6);
                            if (localBeat === 1) snare.triggerAttackRelease("32n", t_and, 0.6);
                            if (localBeat === 3) snare.triggerAttackRelease("32n", t_and, 0.6);

                            if (localBeat === 0) bassSynth.triggerAttackRelease(root, "4n.", t);
                            if (localBeat === 2) bassSynth.triggerAttackRelease(fifth, "4n", t);
                            break;
                    }
                }

                // --- GUITAR STRUMMING ---
                if (pattern === 'DOWN') {
                    strumChord(chord, t, capo, 'DOWN', 0.7, onNote);
                } else if (pattern === 'DU') {
                    strumChord(chord, t, capo, 'DOWN', 0.7, onNote);
                    strumChord(chord, t + Tone.Time("8n").toSeconds(), capo, 'UP', 0.5, onNote);
                } else if (pattern === 'DDU') {
                    strumChord(chord, t, capo, 'DOWN', 0.7, onNote);
                    strumChord(chord, t + Tone.Time("8n").toSeconds() * 0.5, capo, 'DOWN', 0.6, onNote);
                    strumChord(chord, t + Tone.Time("8n").toSeconds(), capo, 'UP', 0.5, onNote);
                } else if (pattern === 'FOLK') {
                    if (b % 4 === 0) strumChord(chord, t, capo, 'DOWN', 0.8, onNote);
                    if (b % 4 === 1) {
                        strumChord(chord, t, capo, 'DOWN', 0.7, onNote);
                        strumChord(chord, t + Tone.Time("8n").toSeconds(), capo, 'UP', 0.6, onNote);
                    }
                    if (b % 4 === 2) {
                        strumChord(chord, t + Tone.Time("8n").toSeconds(), capo, 'UP', 0.6, onNote);
                    }
                    if (b % 4 === 3) {
                        strumChord(chord, t, capo, 'DOWN', 0.7, onNote);
                        strumChord(chord, t + Tone.Time("8n").toSeconds(), capo, 'UP', 0.6, onNote);
                    }
                }
            }, beatTime);
        }

        Tone.Transport.schedule((time) => {
            Tone.Draw.schedule(() => onChordChange(idx), time);
            if (pattern === 'ONCE') {
                strumChord(chord, time, capo, 'DOWN', 0.8, onNote);
            }
        }, chordStartBeat * Tone.Time("4n").toSeconds());

        totalBeats += chord.beats;
    });

    const endTime = totalBeats * Tone.Time("4n").toSeconds();
    Tone.Transport.schedule((time) => { 
        if (!isLooping) {
            Tone.Draw.schedule(onFinish, time);
            stopPlayback();
        }
    }, endTime);

    if (isLooping) {
        Tone.Transport.loop = true;
        Tone.Transport.loopEnd = endTime;
    }
    
    Tone.Transport.start();
};

export const getAnalyserData = () => analyser ? analyser.getValue() as Float32Array : null;

export const loadVocalTrack = async (file: File) => {
    const url = URL.createObjectURL(file);
    if (vocalPlayer) vocalPlayer.dispose();
    vocalPlayer = new Tone.Player(url).toDestination();
    await Tone.loaded();
};

export const removeVocalTrack = () => {
    if (vocalPlayer) {
        vocalPlayer.dispose();
        vocalPlayer = null;
    }
};

export const startTuner = async () => {
    if (!mic) {
        mic = new Tone.UserMedia();
        tunerAnalyser = new Tone.Analyser("fft", 1024);
        mic.connect(tunerAnalyser);
    }
    await mic.open();
};

export const stopTuner = () => mic?.close();

export const getPitch = () => {
    if (!tunerAnalyser) return null;
    const buffer = tunerAnalyser.getValue() as Float32Array;
    let maxVal = -1;
    let maxIdx = -1;
    for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] > maxVal) { maxVal = buffer[i]; maxIdx = i; }
    }
    const hz = maxIdx * (Tone.context.sampleRate / 1024);
    if (hz < 50 || hz > 1000) return null;
    const freq = Tone.Frequency(hz);
    return { note: freq.toNote(), hz, cents: 0 };
};

export const setInstrumentVolume = (i: InstrumentType, v: number) => {
    if (i === 'master' && masterOutput) masterOutput.volume.value = v;
    if (i === 'guitar' && guitarVol) guitarVol.volume.value = v;
    if (i === 'bass' && bassVol) bassVol.volume.value = v;
    if (i === 'drums' && drumVol) drumVol.volume.value = v;
    if (i === 'vocals' && vocalPlayer) vocalPlayer.volume.value = v;
};

export const startRecording = async () => {
    if (!recorder) await initAudio();
    recorder?.start();
};

export const stopRecording = async () => {
    if (!recorder) return null;
    const recording = await recorder.stop();
    return recording;
};

export const startInputRecording = async (sourceType: 'MIC' | 'SYSTEM') => {
    if (!navigator.mediaDevices) throw new Error("UNSUPPORTED_BROWSER");
    let stream: MediaStream;
    try {
        if (sourceType === 'MIC') {
             stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } else {
             // @ts-ignore
             if (!navigator.mediaDevices.getDisplayMedia) throw new Error("SYSTEM_AUDIO_NOT_SUPPORTED");
             // @ts-ignore
             stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
             if (stream.getAudioTracks().length === 0) {
                 stream.getTracks().forEach(t => t.stop());
                 throw new Error("NO_AUDIO_TRACK");
             }
        }
    } catch (err: any) {
        console.error("Stream setup error", err);
        if (err.message === "UNSUPPORTED_BROWSER" || err.message === "SYSTEM_AUDIO_NOT_SUPPORTED" || err.message === "NO_AUDIO_TRACK") throw err;
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') throw new Error("PERMISSION_DENIED");
        throw new Error("UNKNOWN_ERROR");
    }
    await initAudio();
    if (inputRecorder) try { inputRecorder.dispose(); } catch (e) { }
    inputRecorder = new Tone.Recorder();
    if (inputSourceStream) {
        inputSourceStream.getTracks().forEach(track => track.stop());
        inputSourceStream = null;
    }
    inputSourceStream = stream;
    const sourceNode = Tone.context.createMediaStreamSource(stream);
    const gain = new Tone.Gain(1);
    sourceNode.connect(gain.input as unknown as AudioNode);
    gain.connect(inputRecorder);
    inputRecorder.start();
};

export const stopInputRecording = async () => {
    if (!inputRecorder) return null;
    let recording;
    try { recording = await inputRecorder.stop(); } catch(e) { }
    if (inputSourceStream) {
        inputSourceStream.getTracks().forEach(track => track.stop());
        inputSourceStream = null;
    }
    return recording;
};

export const exportToMidi = async (chords: ChordData[], bpm: number, capo: number = 0) => {
    const midi = new Midi();
    const track = midi.addTrack();
    track.name = "VibeChord Export";
    track.instrument.name = "Electric Guitar (Clean)";
    midi.header.setTempos([bpm]);
    midi.header.timeSignatures.push({ timeSignature: [4, 4] });
    let currentTime = 0;
    chords.forEach(chord => {
        const fingering = chord.fingering || [-1, -1, -1, -1, -1, -1];
        const durationBeats = chord.beats;
        const durationSeconds = durationBeats * (60 / bpm);
        fingering.forEach((fret, stringIdx) => {
            if (fret !== -1) {
                const note = Tone.Frequency(TUNING[stringIdx]).transpose(fret + capo).toNote();
                track.addNote({
                    midi: Tone.Frequency(note).toMidi(),
                    time: currentTime,
                    duration: durationSeconds,
                    velocity: 0.8
                });
            }
        });
        currentTime += durationSeconds;
    });
    const output = await midi.toArray();
    const blob = new Blob([output], { type: "audio/midi" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vibechord_project_${Date.now()}.mid`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
