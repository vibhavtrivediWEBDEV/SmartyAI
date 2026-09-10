import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { chatOpenAIFirst } from "@/lib/ai/fallback";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { subject, topic, difficulty } = await request.json() as { subject?: string; topic?: string; difficulty?: string };
    if (typeof subject !== "string" || !subject.trim() || subject.length > 200 || typeof topic !== "string" || !topic.trim() || topic.length > 300) {
      return Response.json({ success: false, error: "A valid subject and topic are required." }, { status: 400 });
    }
    
    const prompt = `Create a comprehensive teaching summary for a ${difficulty} level lesson on ${topic} in ${subject}.ay
        
        Please generate:
        1. A detailed summary of the key concepts that should be covered in this lesson (around 300-500 words)
        2. A list of 5-8 important questions that would help reinforce understanding of these concepts
        
        The content should be appropriate for a student at the ${difficulty} level.
        
        
        Return the response in this exact JSON format without any markdown formatting or code blocks:
        {
          "summary": "The detailed summary text goes here...",
          "keyPoints": ["Key point 1", "Key point 2", "Key point 3", "Key point 4"],
          "importantQuestions": ["Question 1?", "Question 2?", "Question 3?"]
        }
        
        The content will be read by a voice assistant, so avoid using special characters like "/" or "*" that might affect speech.
      `;

    const response = await chatOpenAIFirst([{ role: "user", content: prompt }], {
      temperature: 0.7,
      maxTokens: 1500,
      openAIModel: "gpt-5.6-sol",
      metering: { userId: user.id, source: "teacher", feature: "lesson-summary" },
    })
    
    const generatedContent = response.content

    // Clean up the response to handle potential markdown formatting
    let cleanedContent = generatedContent;
    
    // Remove markdown code block indicators if present
    if (cleanedContent.includes("```json")) {
      cleanedContent = cleanedContent.replace(/```json\n|\n```/g, "");
    } else if (cleanedContent.includes("```")) {
      cleanedContent = cleanedContent.replace(/```\n|\n```/g, "");
    }
    
    // Trim any whitespace
    cleanedContent = cleanedContent.trim();
    
    const objectStart = cleanedContent.indexOf("{");
    const objectEnd = cleanedContent.lastIndexOf("}");
    if (objectStart < 0 || objectEnd <= objectStart) throw new Error("The lesson provider returned malformed content.");
    const parsedContent = JSON.parse(cleanedContent.slice(objectStart, objectEnd + 1));
    if (typeof parsedContent.summary !== "string") throw new Error("The lesson provider returned an invalid summary.");
    
    // Create the teaching session object
    const teachingSession = {
      subject,
      topic,
      difficulty,
      summary: parsedContent.summary,
      keyPoints: parsedContent.keyPoints || [],
      importantQuestions: parsedContent.importantQuestions || [],
      userId: user.id,
      completed: false,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

    // Save to database
    const docRef = await db.collection("teachingSessions").add(teachingSession);

    return Response.json({ 
      success: true, 
      sessionId: docRef.id,
      session: { id: docRef.id, ...teachingSession }
    }, { status: 200 });
  } catch (error) {
    console.error("Error generating teaching content:", error instanceof Error ? error.name : "unknown error");
    return Response.json({ 
      success: false, 
      error: "Teaching content could not be generated. Please try again.",
    }, { status: 500 });
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  return Response.json({ success: true, message: "Teaching generation API is working" }, { status: 200 });
}