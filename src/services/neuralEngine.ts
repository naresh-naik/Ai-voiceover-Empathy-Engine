import { GoogleGenAI, Modality, ThinkingLevel } from "@google/genai";

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
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: `Analyze text emotion. Return JSON: {emotion, intensity(0-1), vocalPrompt(TTS instruction), suggestedVoice(Puck|Charon|Kore|Fenrir|Zephyr)}. Text: "${text}"`,
    config: {
      responseMimeType: "application/json",
      thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL }
    },
  });

  return JSON.parse(response.text || "{}") as EmotionData;
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
