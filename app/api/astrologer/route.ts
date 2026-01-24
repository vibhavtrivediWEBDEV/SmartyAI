import { NextRequest } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY!,
})


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Convert file into Base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = buffer.toString("base64");

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // or gpt-4o
      messages: [
        {
          role: "system",
          content: `
You are a graphologist. Analyze handwriting images for entertainment purposes only. 
Describe:
- Slant, size, consistency of handwriting
- Personality traits (practical thinker, trustworthy, emotionally strong)
- Weaknesses/challenges
Keep it fun, like a horoscope. Do NOT mention health or medical conditions.
          `,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Please analyze this handwriting sample." },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
    });

    const result = response.choices[0]?.message?.content;

    return new Response(JSON.stringify({ result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error analyzing handwriting:", error);
    return new Response(
      JSON.stringify({ error: String(error.message || error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
