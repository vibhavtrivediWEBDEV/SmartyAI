import { createAIService } from '@/lib/ai'

import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

export async function POST(request: Request) {
  console.log('🎯 [generate] Interview creation request received');
  
  try {
    const { type, role, level, techstack, amount, userid } = await request.json();
    console.log('📝 Request data:', { type, role, level, techstack, amount, userid });

    if (!role || !userid) {
      console.error('❌ Missing required fields');
      return Response.json({ 
        success: false, 
        error: 'Missing required fields: role and userid' 
      }, { status: 400 });
    }

    // Calculate how many coding questions to include (20% of total)
    const codingQuestionsCount = Math.max(1, Math.ceil(amount * 0.2));
    const regularQuestionsCount = amount - codingQuestionsCount;

    // Use AI abstraction layer (auto-detects: OpenAI, Bedrock, or Gemini)
    const aiService = createAIService()
    console.log('🤖 AI Service created:', aiService.constructor.name);
    
    const prompt = `Prepare questions for a job interview.
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
    `;

    console.log('🚀 Calling AI service...');
    const response = await aiService.complete(prompt, {
      temperature: 0.7,
      maxTokens: 2000
    });

    console.log('✅ AI response received:', response.content.substring(0, 100));

    const questions = response.content

    // Parse the questions and add metadata for coding questions
    let parsedQuestions;
    try {
      // Remove markdown fences if present
      const cleanedQuestions = questions.replace(/```json\n?|\n?```/g, '').trim();
      parsedQuestions = JSON.parse(cleanedQuestions);
    } catch (parseError) {
      console.error('❌ Failed to parse questions JSON:', questions);
      return Response.json({ 
        success: false, 
        error: 'Failed to parse AI response as JSON',
        rawResponse: questions 
      }, { status: 500 });
    }

    const processedQuestions = parsedQuestions.map((question: string) => {
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

    console.log('💾 Saving interview to database...');
    const docRef = await db.collection("interviews").add(interview);
    console.log('✅ Interview saved successfully with ID:', docRef.id);

    return Response.json({ 
      success: true, 
      interviewId: docRef.id 
    }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Interview creation error:", error);
    return Response.json({ 
      success: false, 
      error: error.message || String(error),
      stack: error.stack 
    }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ success: true, data: "Thank you!" }, { status: 200 });
}
