import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return Response.json({ success: false, error: "Prompt is required" }, { status: 400 });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      responseModalities: ["TEXT", "IMAGE"],  // Necessary to request image content
      contents: [
        {
          parts: [
            { text: prompt },
          ],
        },
      ],
    });

    const parts = response.candidates[0]?.content.parts;
    const imagePart = parts?.find((p: any) => p.inlineData);
    const textParts = parts?.filter((p: any) => p.text).map((p: any) => p.text);

    if (!imagePart) {
      return Response.json({ success: false, error: "No image returned" }, { status: 500 });
    }

    const imageData = imagePart.inlineData.data;

    return Response.json({
      success: true,
      text: textParts.join("\n"),
      imageBase64: imageData,
    }, { status: 200 });

  } catch (err: any) {
    console.error("Gemini image generation error:", err?.response || err);
    return Response.json({
      success: false,
      error: err?.message || "Something went wrong",
    }, { status: 500 });
  }
}
