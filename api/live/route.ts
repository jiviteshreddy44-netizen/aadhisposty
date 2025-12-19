import { GoogleGenAI, Modality } from "@google/genai";

export const runtime = "nodejs"; // IMPORTANT

let session: any = null;

export async function POST(req: Request) {
  const body = await req.json();

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
  });

  // Create session once
  if (!session) {
    session = await ai.live.connect({
      model: "gemini-2.5-flash-native-audio-preview-09-2025",
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Zephyr" },
          },
        },
        systemInstruction:
          "You are Dak-Sarthi, the India Post AI voice interface. Be concise and helpful.",
      },
    });
  }

  // Send audio chunk from client
  if (body?.audio) {
    await session.sendRealtimeInput({
      media: {
        data: body.audio,
        mimeType: "audio/pcm;rate=16000",
      },
    });
  }

  // Read response (if any)
  const response = await session.receive();
  const audioChunks: string[] = [];

  if (response?.serverContent?.modelTurn?.parts) {
    for (const part of response.serverContent.modelTurn.parts) {
      if (part.inlineData?.data) {
        audioChunks.push(part.inlineData.data);
      }
    }
  }

  return Response.json({ audioChunks });
}
