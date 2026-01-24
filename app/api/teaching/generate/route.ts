import { generateText } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

export async function POST(request: Request) {
  const { subject, topic, difficulty, userId } = await request.json();

  try {
    // Generate a comprehensive summary and key questions for the teaching session
    const { text: generatedContent } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: `Create a comprehensive teaching summary for a ${difficulty} level lesson on ${topic} in ${subject}.
        
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
      `,
    });

    console.log("Raw generated content:", generatedContent);
    
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
    
    console.log("Cleaned content:", cleanedContent);
    
    // Parse the cleaned content
    const parsedContent = JSON.parse(cleanedContent);
    
    // Create the teaching session object
    const teachingSession = {
      subject,
      topic,
      difficulty,
      summary: parsedContent.summary,
      keyPoints: parsedContent.keyPoints || [],
      importantQuestions: parsedContent.importantQuestions || [],
      userId,
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
    console.error("Error generating teaching content:", error);
    return Response.json({ 
      success: false, 
      error: String(error),
      rawContent: generatedContent || "No content generated" 
    }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ success: true, message: "Teaching generation API is working" }, { status: 200 });
}