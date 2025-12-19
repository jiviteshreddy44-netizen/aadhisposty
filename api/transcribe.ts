// api/transcribe.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "API key missing" });
    }

    const { audioBase64, mimeType } = req.body;

    if (!audioBase64 || !mimeType) {
      return res.status(400).json({ error: "Audio data missing" });
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: mimeType.split(";")[0],
                data: audioBase64,
              },
            },
            {
              text: "Transcribe the provided audio accurately. Output ONLY the transcribed text.",
            },
          ],
        },
      ],
    });

    res.status(200).json({
      text: response.text?.trim() || "",
    });
  } catch (error: any) {
    console.error("Transcription error:", error);
    res.status(500).json({ error: "Transcription failed" });
  }
}
