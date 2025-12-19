// @ts-nocheck
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ComplaintAnalysis, GroundingLink } from "../types";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("Gemini API Key is missing! Ensure it is set in your environment variables as API_KEY.");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeComplaint = async (description: string, imageUrl?: string, context?: string, trackingNumber?: string): Promise<ComplaintAnalysis> => {
  const ai = getAI();
  const model = "gemini-3-pro-preview";
  
  const systemInstruction = `
    You are the Principal Intelligence Architect for India Post (Posty).
    Your task is to generate a HIGH-DENSITY data briefing for postal staff.
    
    PRIORITY ENGINE (1-100):
    - keywordSeverity: Detect words like 'medicine', 'court', 'bank', 'passport', 'delay', 'urgent', 'loss', 'theft'.
    - sentimentImpact: Quantify anger, desperation, or frustration.
    - categoryWeight: 'Lost Parcel' (90), 'Staff Misconduct' (85), 'Delivery Delay' (60), 'General Enquiry' (30).
  `;

  const parts: any[] = [
    { text: `Staff Context: ${context || "None"}` },
    { text: `Grievance: ${description}` },
    { text: `Tracking ID: ${trackingNumber || "N/A"}` }
  ];
  
  if (imageUrl) {
    parts.push({
      inlineData: { mimeType: 'image/jpeg', data: imageUrl.split(',')[1] }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            sentiment: { type: Type.STRING },
            emotionalToneScore: { type: Type.INTEGER },
            urgencyScore: { type: Type.INTEGER },
            priorityScore: { type: Type.INTEGER },
            priorityLabel: { type: Type.STRING },
            summary: { type: Type.STRING },
            suggestedResponse: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            translatedText: { type: Type.STRING },
            slaDeadline: { type: Type.STRING },
            predictedResolutionHours: { type: Type.INTEGER },
            intelligenceBriefing: {
              type: Type.OBJECT,
              properties: {
                suggestedRegulations: { type: Type.ARRAY, items: { type: Type.STRING } },
                riskAssessment: { type: Type.STRING },
                investigationStrategy: { type: Type.ARRAY, items: { type: Type.STRING } },
                logisticsAudit: { type: Type.STRING },
                escalationProbability: { type: Type.INTEGER },
                recommendedTone: { type: Type.STRING },
                priorityBreakdown: {
                  type: Type.OBJECT,
                  properties: {
                    keywordSeverity: { type: Type.INTEGER },
                    sentimentImpact: { type: Type.INTEGER },
                    categoryWeight: { type: Type.INTEGER },
                    explanation: { type: Type.STRING }
                  }
                },
                citizenProfile: {
                  type: Type.OBJECT,
                  properties: {
                    loyaltyLevel: { type: Type.STRING },
                    previousResolutionSatisfaction: { type: Type.STRING },
                    historicalSentimentTrend: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text?.trim() || "{}");
  } catch (error) {
    console.error("AI Analysis Failed:", error);
    return { category: "Other", sentiment: "Neutral", summary: "Manual classification required." };
  }
};

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  const ai = getAI();
  const sanitizedMimeType = mimeType.split(';')[0];
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        parts: [
          { inlineData: { mimeType: sanitizedMimeType, data: base64Audio } },
          { text: "Transcribe the provided audio accurately. Output ONLY the transcribed text." }
        ]
      }]
    });
    return response.text?.trim() || "";
  } catch (e) {
    console.error("Transcription Failed. Likely MIME type or Key issue:", e);
    throw e;
  }
};

export const translateAndRefine = async (text: string): Promise<{ translated: string, originalLang: string }> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Input Text: "${text}"`,
      config: { 
        systemInstruction: "Detect language. If not English, translate to formal English. If English, refine grammar. Return JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translated: { type: Type.STRING },
            originalLang: { type: Type.STRING }
          }
        }
      }
    });
    return JSON.parse(response.text?.trim() || "{}");
  } catch (e) {
    return { translated: text, originalLang: "Unknown" };
  }
};

export const polishDraft = async (draft: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Polish this draft: "${draft}"`,
      config: { systemInstruction: "Make this response more professional for an India Post official." }
    });
    return response.text || draft;
  } catch (e) {
    return draft;
  }
};

export const getQuickSupport = async (query: string, userHistory?: string): Promise<any> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Query: ${query}\nContext: ${userHistory || "None"}`,
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: "You are Dak-Mitra, the India Post AI.",
    },
  });

  const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const links = rawChunks
    .filter(chunk => chunk.web && chunk.web.title && chunk.web.uri)
    .map(chunk => ({ title: chunk.web.title, uri: chunk.web.uri }));

  return {
    text: response.text || "I'm sorry, I could not find an answer.",
    links: links.length > 0 ? links : undefined
  };
};

export const findNearbyBranches = async (lat: number, lng: number): Promise<any> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Find 3 nearest India Post offices.",
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: { retrievalConfig: { latLng: { latitude: lat, longitude: lng } } }
      }
    });
    
    const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const mapsLinks = rawChunks
      .filter(chunk => chunk.maps && chunk.maps.uri)
      .map(chunk => chunk.maps.uri);

    return {
      text: response.text || "No branches found.",
      links: mapsLinks
    };
  } catch (e) {
    return { text: "Location services unavailable.", links: [] };
  }
};

export const extractDetailsFromImage = async (base64Image: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [{
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image.split(',')[1] } },
          { text: "Extract tracking number and post office from this receipt. Return JSON." }
        ]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            trackingNumber: { type: Type.STRING },
            postOffice: { type: Type.STRING }
          }
        }
      }
    });
    return JSON.parse(response.text?.trim() || "{}");
  } catch (e) {
    return null;
  }
};

export const generateSpeech = async (text: string): Promise<string | undefined> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (e) {
    console.error("TTS Failed:", e);
    return undefined;
  }
};

export const decodeAudio = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}