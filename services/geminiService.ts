
import { GoogleGenAI, Type } from "@google/genai";
import { ChordData, AnalysisResult, GuitarEffects } from "../types";
import { ChordTemplate } from "./chordDictionary";

// We instantiate inside functions to ensure process.env.API_KEY is ready and to handle errors better.
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is missing. Please check your environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

// Switching to PRO model for better adherence to complex JSON schemas (Chords + FX)
const MODEL_ID = "gemini-3-pro-preview";

interface GenerationResponse {
  chords: ChordData[];
  effects: GuitarEffects;
}

export const generateChordProgression = async (prompt: string): Promise<GenerationResponse> => {
  try {
    const ai = getAiClient();
    
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: `You are an expert music composer and sound engineer. 
      Generate a guitar chord progression based on this request: "${prompt}". 
      
      Part 1: The Chords.
      Return a list of chords with realistic guitar voicings (fingering).
      
      Part 2: The Sound (Audio Engineering).
      Based on the genre/mood of the request, configure the guitar effects pedalboard.
      - distortion: 0.0 (Clean) to 1.0 (Heavy Metal). Use >0.4 for Rock/Blues.
      - chorus: 0.0 to 1.0. High for 80s, Dream Pop, Shoegaze.
      - reverb: 0.0 (Dry) to 1.0 (Cathedral).
      - delay: 0.0 to 1.0.
      - masterGain: -5 to 5. If high distortion, lower gain slightly (-2) to prevent clipping.

      Return ONLY JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            progression: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                    name: { type: Type.STRING, description: "The chord name, e.g., Am7" },
                    beats: { type: Type.INTEGER, description: "Duration in beats" },
                    fingering: { 
                        type: Type.ARRAY, 
                        items: { type: Type.INTEGER },
                        description: "Array of 6 integers representing fret numbers (-1 for mute, 0 for open)"
                    }
                    },
                    required: ["name", "beats", "fingering"],
                },
            },
            soundSettings: {
                type: Type.OBJECT,
                properties: {
                    distortion: { type: Type.NUMBER },
                    chorus: { type: Type.NUMBER },
                    reverb: { type: Type.NUMBER },
                    delay: { type: Type.NUMBER },
                    masterGain: { type: Type.NUMBER }
                },
                required: ["distortion", "chorus", "reverb", "delay", "masterGain"]
            }
          },
          required: ["progression", "soundSettings"]
        },
      },
    });

    if (response.text) {
      const rawData = JSON.parse(response.text);
      
      const chords = rawData.progression.map((c: any) => ({
        id: crypto.randomUUID(),
        name: c.name,
        beats: c.beats,
        fingering: c.fingering
      }));

      const effects: GuitarEffects = rawData.soundSettings;

      return { chords, effects };
    }
    
    throw new Error("No data returned from Gemini");
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Unknown Gemini API Error");
  }
};

export const getNextChordSuggestions = async (currentChords: ChordData[]): Promise<ChordTemplate[]> => {
  try {
    const ai = getAiClient();
    if (currentChords.length === 0) return [];
    const chordNames = currentChords.map(c => c.name).join(', ');
    
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: `Based on this guitar chord progression: [${chordNames}], suggest 4 logical and musically pleasing "next" chords. 
      Provide common guitar fingerings for each. 
      Return ONLY a JSON array of objects with "name" and "fingering" (6 integers).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              fingering: { type: Type.ARRAY, items: { type: Type.INTEGER } }
            },
            required: ["name", "fingering"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ChordTemplate[];
    }
    return [];
  } catch (error) {
    console.error("Suggestions Error:", error);
    return [];
  }
};

export const analyzeChordProgression = async (chords: ChordData[]): Promise<AnalysisResult> => {
  try {
    const ai = getAiClient();
    const chordList = chords.map(c => `${c.name} (${c.fingering?.join(',')})`).join(' -> ');
    
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: `Analyze the following guitar chord progression: ${chordList}.
      
      1. Provide a concise harmonic analysis (what key, functionality, mood).
      2. Suggest 2 alternative variations or improvements (e.g., adding extensions, jazz substitution, modal interchange).
      
      Return JSON with 'analysis' (string) and 'variations' (array of objects with 'name', 'description', and 'chords').
      The 'chords' in variations must strictly follow the same JSON structure as the input chords (name, beats, fingering).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING, description: "Harmonic analysis of the progression" },
            variations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Title of the variation" },
                  description: { type: Type.STRING, description: "Why this variation works" },
                  chords: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        beats: { type: Type.INTEGER },
                        fingering: { 
                          type: Type.ARRAY, 
                          items: { type: Type.INTEGER } 
                        }
                      },
                      required: ["name", "beats", "fingering"]
                    }
                  }
                },
                required: ["name", "description", "chords"]
              }
            }
          },
          required: ["analysis", "variations"]
        }
      }
    });

    if (response.text) {
      const result = JSON.parse(response.text);
      // Ensure IDs are generated for the new chords
      result.variations = result.variations.map((v: any) => ({
        ...v,
        chords: v.chords.map((c: any) => ({
          ...c,
          id: crypto.randomUUID()
        }))
      }));
      return result as AnalysisResult;
    }

    throw new Error("No analysis returned");
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const transcribeChordsFromAudio = async (base64Data: string, mimeType: string): Promise<ChordData[]> => {
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: MODEL_ID,
            contents: [
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: mimeType
                    }
                },
                {
                    text: `Listen to this music and transcribe the chord progression accurately. 
                    Identify the main chords, their duration (in beats), and provide common guitar fingerings for each.
                    Return ONLY a JSON array of objects with "name", "beats", and "fingering" (6 integers array).`
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            beats: { type: Type.INTEGER },
                            fingering: { type: Type.ARRAY, items: { type: Type.INTEGER } }
                        },
                        required: ["name", "beats", "fingering"]
                    }
                }
            }
        });

        if (response.text) {
            const chords = JSON.parse(response.text);
            return chords.map((c: any) => ({
                ...c,
                id: crypto.randomUUID()
            }));
        }
        throw new Error("Transcription failed");
    } catch (error) {
        console.error("Gemini Transcription Error:", error);
        throw error;
    }
};

export const generateLyrics = async (chords: ChordData[], topic?: string): Promise<string> => {
    try {
        const ai = getAiClient();
        const chordNames = chords.map(c => c.name).join(', ');
        const prompt = topic 
            ? `Write song lyrics about "${topic}" that fit this chord progression: ${chordNames}.` 
            : `Write creative song lyrics that fit the mood of this chord progression: ${chordNames}.`;

        const response = await ai.models.generateContent({
            model: MODEL_ID,
            contents: `${prompt} Structure the lyrics with [Verse], [Chorus], etc. Keep it concise.`,
        });

        if (response.text) {
            return response.text;
        }
        throw new Error("No lyrics generated");
    } catch (error) {
        console.error("Lyrics Generation Error", error);
        throw error;
    }
};
