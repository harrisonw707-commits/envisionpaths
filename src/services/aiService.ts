// AI Service calling Gemini directly from the frontend
// AI Service calling backend API (server handles Gemini)

// Initialize AI with the environment-provided API key
// The platform handles the injection of GEMINI_API_KEY


import { GoogleGenAI, Modality, HarmCategory, HarmBlockThreshold } from "@google/genai";

// Standard models according to guidelines
const MODELS = {
  TEXT: "gemini-3-flash-preview",
  TEXT_STABLE: "gemini-1.5-flash", // More widely available stable model
  PRO: "gemini-3.1-pro-preview",
  TTS: "gemini-2.5-flash-preview-tts"
};

// Safety settings to prevent empty responses due to over-eager filtering
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
];

// Initialize AI with the environment-provided API key
// The platform handles the injection of GEMINI_API_KEY
// We use a fallback to an empty string if the key is not set, 
// as the platform's proxy will handle the actual authentication.
const getAi = () => {
  // Check both standard and Vite-prefixed environment variables
  // The platform might inject GEMINI_API_KEY or API_KEY
  // We prioritize non-empty strings and use safe checks to avoid ReferenceErrors
  let apiKey = '';
  
  try {
    apiKey = 
      (window as any).GEMINI_API_KEY ||
      (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'undefined' ? process.env.GEMINI_API_KEY : '') || 
      (typeof process !== 'undefined' && process.env && process.env.API_KEY && process.env.API_KEY !== 'undefined' ? process.env.API_KEY : '') || 
      (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) ||
      (import.meta.env && import.meta.env.VITE_API_KEY) ||
      '';
  } catch (e) {
    // Fallback if any of the above checks fail
    apiKey = '';
  }
  
  if (!apiKey || apiKey === 'undefined') {
    console.error("CRITICAL: Gemini API Key is missing or invalid. Please ensure GEMINI_API_KEY or API_KEY is set in the environment.");
  }
  
  return new GoogleGenAI({ apiKey: apiKey as string });
};

export interface AIResponse {
  text: string;
}

/**
 * Helper to call Gemini with a robust fallback strategy
 */
async function callWithFallback(fn: (model: string) => Promise<any>) {
  const modelsToTry = [MODELS.TEXT, MODELS.TEXT_STABLE, "gemini-1.5-flash"];
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      return await fn(model);
    } catch (error: any) {
      lastError = error;
      const errorMsg = error.message || "";
      
      // Check if this is an error that justifies a fallback
      const isFallbackError = 
        errorMsg.includes('404') || 
        errorMsg.toLowerCase().includes('not found') || 
        errorMsg.includes('403') || 
        errorMsg.toLowerCase().includes('forbidden') ||
        errorMsg.includes('503') ||
        errorMsg.toLowerCase().includes('unavailable') ||
        errorMsg.includes('quota') ||
        errorMsg.includes('429');
        
      if (isFallbackError && model !== modelsToTry[modelsToTry.length - 1]) {
        console.warn(`[AI] Model ${model} failed (${errorMsg}). Trying next fallback model...`);
        continue;
      }
      
      // If it's not a fallback error, or we're out of models, throw it
      throw error;
    }
  }
  throw lastError;
}

export async function* generateAIStream(prompt: string): AsyncGenerator<string> {
  try {
    const ai = getAi();
    const modelsToTry = [MODELS.TEXT, MODELS.TEXT_STABLE, "gemini-1.5-flash"];
    let response = null;
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        response = await ai.models.generateContentStream({
          model,
          contents: prompt,
          config: { safetySettings }
        });
        break; // Success
      } catch (error: any) {
        lastError = error;
        const errorMsg = error.message || "";
        const isFallbackError = 
          errorMsg.includes('404') || 
          errorMsg.toLowerCase().includes('not found') || 
          errorMsg.includes('403') || 
          errorMsg.toLowerCase().includes('forbidden') ||
          errorMsg.includes('503') ||
          errorMsg.toLowerCase().includes('unavailable');

        if (isFallbackError && model !== modelsToTry[modelsToTry.length - 1]) {
          console.warn(`[AI] Streaming model ${model} failed (${errorMsg}). Trying next fallback...`);
          continue;
        }
        throw error;
      }
    }

    if (!response) throw lastError || new Error("Failed to initialize AI stream");
    
    for await (const chunk of response) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error("AI Streaming Error:", error);
    throw error;
  }
}

export async function generateAI(prompt: string): Promise<AIResponse> {
  try {
    const ai = getAi();
    const response = await callWithFallback((model) => 
      ai.models.generateContent({
        model,
        contents: prompt,
        config: { safetySettings }
      })
    );
    
    return { text: response.text || "" };
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
}

export async function generateContent(messageText: string, systemInstruction: string, history: any[]): Promise<AIResponse> {
  try {
    const ai = getAi();
    const response = await callWithFallback((model) => 
      ai.models.generateContent({
        model,
        contents: [
          ...history,
          { role: 'user', parts: [{ text: messageText }] }
        ],
        config: {
          systemInstruction: systemInstruction,
          safetySettings
        }
      })
    );

    return { text: response.text || "" };
  } catch (error) {
    console.error("AI Content Generation Error:", error);
    throw error;
  }
}

export async function generateSpeech(text: string, voiceName: string = 'Kore'): Promise<string | null> {
  const modelsToTry = [MODELS.TTS, "gemini-1.5-flash"];
  
  for (const model of modelsToTry) {
    try {
      const ai = getAi();
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: `Speak this as a warm, professional human career coach. Use natural human-like intonation, slight pauses for emphasis, and a supportive, engaging tone. Avoid sounding robotic or monotone. Text to speak: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) return base64Audio;
    } catch (error: any) {
      console.warn(`[AI] TTS attempt with ${model} failed:`, error.message);
      // If it's the last model, we just return null and let the browser fallback handle it
    }
  }
  return null;
}

export async function transcribeAudio(base64Audio: string, mimeType: string): Promise<string | null> {
  try {
    const ai = getAi();
    const response = await callWithFallback((model) => 
      ai.models.generateContent({
        model,
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Audio,
                },
              },
              {
                text: "Transcribe the audio exactly as spoken. If there is no speech, return an empty string. Only return the transcription, nothing else.",
              },
            ],
          },
        ],
        config: { safetySettings }
      })
    );

    return response.text?.trim() || null;
  } catch (error) {
    console.error("Transcription Error:", error);
    return null;
  }
}

 
       
   
 
   

