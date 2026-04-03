import { GoogleGenAI, Modality } from "@google/genai";

/**
 * Neural Engine Configuration
 * Utilizes advanced sentiment analysis and high-fidelity speech synthesis.
 */
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface EmotionData {
  emotion: string;
  intensity: number;
  vocalPrompt: string;
  suggestedVoice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
}

/**
 * Analyzes the emotional context and intensity of the input text.
 */
export async function analyzeEmotion(text: string): Promise<EmotionData> {
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    if (!response.ok) throw new Error("Backend analysis failed");
    const data = await response.json();
    
    // Map backend response to frontend EmotionData interface
    return {
      emotion: data.primaryEmotion,
      intensity: data.intensity,
      vocalPrompt: data.modulationStrategy,
      suggestedVoice: "Zephyr" // Default for synthesis
    };
  } catch (error) {
    console.error("Neural Analysis Error:", error);
    return {
      emotion: "Calm",
      intensity: 0.5,
      vocalPrompt: "Speak in a steady, neutral tone.",
      suggestedVoice: "Zephyr"
    };
  }
}

/**
 * Synthesizes emotionally-resonant speech based on the analyzed metadata.
 */
export async function generateEmpathicSpeech(text: string, emotionData: EmotionData): Promise<string> {
  const prompt = `Say ${emotionData.vocalPrompt}: ${text}`;
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: emotionData.suggestedVoice },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("Neural synthesis failed");
  }

  return base64Audio;
}
