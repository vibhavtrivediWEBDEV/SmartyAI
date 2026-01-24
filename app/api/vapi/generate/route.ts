import { generateText } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

export async function POST(request: Request) {
  const { type, role, level, techstack, amount, userid } = await request.json();

  try {
    // Calculate how many coding questions to include (20% of total)
    const codingQuestionsCount = Math.max(1, Math.ceil(amount * 0.2));
    const regularQuestionsCount = amount - codingQuestionsCount;

    const { text: questions } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: `Prepare questions for a job interview.
        The job role is ${role}.
        The job experience level is ${level}.
        The tech stack used in the job is: ${techstack}.
        The focus between behavioural and technical questions should lean towards: ${type}.
        The total amount of questions required is: ${amount}.
        
        I need ${regularQuestionsCount} regular interview questions and ${codingQuestionsCount} coding questions.
        if tech is not IT then dont generate coding question please 
        
        For the coding questions, please prefix them with "[CODING]" so they can be identified as coding challenges.
        These coding questions should be practical problems that can be solved during an interview, appropriate for the role and level.
        
        Please return only the questions, without any additional text.
        The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
        Return the questions formatted like this:
        ["Question 1", "Question 2", "[CODING] Write a function that...", "Question 4"]
        
        Thank you! <3
    `,
    });

    // Parse the questions and add metadata for coding questions
    const parsedQuestions = JSON.parse(questions);
    const processedQuestions = parsedQuestions.map(question => {
      if (question.startsWith("[CODING]")) {
        return {
          text: question.replace("[CODING]", "").trim(),
          type: "coding"
        };
      }
      return {
        text: question,
        type: "regular"
      };
    });

    const interview = {
      role: role,
      type: type,
      level: level,
      techstack: techstack.split(","),
      questions: processedQuestions,
      userId: userid,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

    await db.collection("interviews").add(interview);

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ success: false, error: error }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ success: true, data: "Thank you!" }, { status: 200 });
}
