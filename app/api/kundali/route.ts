import { NextRequest } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY!,
})


export async function POST(request: NextRequest) {
  try {
    const { dob, time, place } = await request.json();

    if (!dob || !time || !place) {
      return new Response(
        JSON.stringify({ error: "dob, time and place are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const fullPrompt = `
    You are an expert Vedic astrologer.
    Based on the given birth details, generate a very detailed kundali (astrological chart) style report.
    
    Inputs:
    - Date of Birth: ${dob}
    - Time of Birth: ${time}
    - Place of Birth: ${place}
    
    Output must include:
    1. General Personality traits
    2. Strengths and Weaknesses
    3. Career insights
    4. Relationship and Marriage aspects
    5. Health aspects
    6. Future predictions (based on planetary alignment)
    7. Remedies if needed

    Write in a structured way like a kundali explanation.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a Vedic astrologer." },
        { role: "user", content: fullPrompt },
      ],
      temperature: 0.7,
    });

    const kundaliText = response.choices[0].message?.content;

    return new Response(
      JSON.stringify({ result: kundaliText }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Kundali API error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
