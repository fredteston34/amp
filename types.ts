
export interface ChordData {
  id: string;
  name: string; 
  beats: number; 
  fingering: number[]; // Fret numbers
  fingers?: (string | null)[]; 
  strummingPattern?: StrummingPattern;
  section?: string; // e.g. "Intro", "Verse", "Chorus"
}

export type StrummingPattern = 'ONCE' | 'DOWN' | 'DU' | 'DDU' | 'FOLK';

export interface PlaybackState {
  isPlaying: boolean;
  currentChordIndex: number;
  bpm: number;
}

export interface GenerateRequest {
  prompt: string;
  style?: string;
}

export interface ProgressionVariation {
  name: string;
  description: string;
  chords: ChordData[];
}

export interface AnalysisResult {
  analysis: string;
  variations: ProgressionVariation[];
}

export type BackingTrackStyle = 'ROCK' | 'JAZZ' | 'FUNK' | 'BLUES' | 'REGGAE' | 'LOFI' | 'METAL' | 'COUNTRY' | 'LATIN';

export interface SavedProgression {
  id: string;
  name: string;
  date: number;
  bpm: number;
  style: BackingTrackStyle;
  chords: ChordData[];
  lyrics?: string;
}

export type InstrumentType = 'master' | 'guitar' | 'bass' | 'drums' | 'lead' | 'vocals';
export type AmpModel = 'CLEAN' | 'TWEED' | 'CITRUS' | 'METAL' | 'BRITISH' | 'PLEXI' | 'BOUTIQUE' | 'ACOUSTIC_SIM';

export interface GuitarEffects {
  ampModel: AmpModel;
  eq: { low: number; mid: number; high: number };
  distortion: number;
  chorus: number;
  reverb: number;
  delay: number;
  masterGain: number;
  noiseGateThreshold?: number; // Added for feedback control
}
