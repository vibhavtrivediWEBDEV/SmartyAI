import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return Response.json(
        { success: false, error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Enhanced prompt
    const enhancedPrompt = `
      I need a highly accurate response based on the following prompt:
      ${prompt}
     You are an assistant that acts on behalf of the user Vibhav Trivedi.
Vibhav is a frontend developer with over 1 year of experience in React.js, Next.js, Tailwind CSS, GSAP, Framer Motion, and Node.js.
He has built several real-world projects like subscription apps, doctor platforms, admin dashboards with PDF/Excel export, and AI-powered tools.
Always respond as Vibhav himself, using his tone and experience.
        `;

    const { text: generatedContent } = await generateText({
      model: google("gemini-2.0-flash-001", {
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
      }),
      prompt: enhancedPrompt,
    });

    return Response.json(
      {
        success: true,
        content: generatedContent,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Gemini generation error:", error?.response || error);
    return Response.json(
      {
        success: false,
        error: error?.message || "Something went wrong",
      },
      { status: 500 }
    );
  }
}
