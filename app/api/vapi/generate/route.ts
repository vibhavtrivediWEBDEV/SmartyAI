import { createMeteredAIService, CreditLimitError } from '@/lib/ai/metered'
import { ObjectId } from "mongodb";
import { getRandomInterviewCover } from "@/lib/utils";
import { getSessionUserId } from "@/lib/auth/session";
import { consumePlanUsage, findUserById, refundPlanUsage } from "@/modules/users/user.repository";
import { createInterview, findInterviewsByUserId, type InterviewQuestion } from "@/modules/interviews/interview.repository";

export async function POST(request: Request) {
  console.log('🎯 [generate] Interview creation request received');
  let reservedUserId: string | null = null;
  
  try {
    const { type, role, level, techstack, amount, userid, jobDescription, createFromProfile } = await request.json();
    const sessionUserId = await getSessionUserId();
    console.log('📝 Request data:', { type, role, level, techstack, amount, userid, createFromProfile, hasJobDescription: Boolean(jobDescription) });

    if (!sessionUserId || !ObjectId.isValid(sessionUserId) || (userid && userid !== sessionUserId)) {
      console.error('❌ Missing required fields');
      return Response.json({ 
        success: false, 
        error: 'You must be signed in to create an interview.'
      }, { status: 401 });
    }

    const user = await findUserById(sessionUserId);
    if (!user) return Response.json({ success: false, error: "User not found." }, { status: 404 });

    const resume = user.resumeProfile;
    if (createFromProfile) {
      const existingInterview = (await findInterviewsByUserId(sessionUserId, 1))[0];
      if (existingInterview) {
        return Response.json({ success: true, interviewId: existingInterview.id, created: false }, { status: 200 });
      }
      if (!resume) {
        return Response.json({
          success: false,
          code: "RESUME_REQUIRED",
          error: "Upload a resume before creating your automatic profile interview.",
        }, { status: 422 });
      }
    }

    const selectedRole = String(role || resume?.goals?.[0] || resume?.headline || "General professional").trim().slice(0, 120);
    const selectedTechstack = String(techstack || resume?.skills?.slice(0, 12).join(", ") || "");
    const questionCount = Math.max(4, Math.min(12, Number.parseInt(String(amount), 10) || 7));
    const safeJobDescription = String(jobDescription || "").trim().slice(0, 8000);

    const usage = await consumePlanUsage(sessionUserId, "interviews");
    if (!usage.allowed) {
      return Response.json({ success: false, error: `Your plan includes ${usage.limit} interviews per month.`, code: "INTERVIEW_LIMIT_REACHED", usage }, { status: 429 });
    }
    reservedUserId = sessionUserId;

    // Calculate how many coding questions to include (20% of total)
    const codingQuestionsCount = Math.max(1, Math.ceil(questionCount * 0.25));
    const regularQuestionsCount = questionCount - codingQuestionsCount;

    // Use AI abstraction layer (auto-detects: OpenAI, Bedrock, or Gemini)
    const aiService = createMeteredAIService(sessionUserId, { source: 'interview', feature: 'question-generation' })
    console.log('🤖 AI Service created:', aiService.constructor.name);
    
    const prompt = `Create a structured, realistic mock interview question set.
      The job role is ${selectedRole}.
        The job experience level is ${level}.
      The tech stack used in the job is: ${selectedTechstack || "not specified"}.
        The focus between behavioural and technical questions should lean towards: ${type}.
      The total amount of questions required is: ${questionCount}.
      Optional job description: ${safeJobDescription || "not provided"}.
      Candidate resume headline: ${resume?.headline || "not provided"}.
      Candidate skills: ${resume?.skills?.join(", ") || "not provided"}.
      Candidate experience: ${resume?.experience?.slice(0, 8).join(" | ") || "not provided"}.
      Candidate projects: ${resume?.projects?.slice(0, 6).map((project) => `${project.name}: ${project.description}`).join(" | ") || "not provided"}.
        
        I need ${regularQuestionsCount} regular interview questions and ${codingQuestionsCount} coding questions.
      If this is clearly a non-software role, replace coding questions with practical case or work-sample questions and mark them regular.
      Use a balanced progression: warm-up, resume evidence, role knowledge, scenario or behavioral STAR, deeper technical reasoning, and work sample.
      Avoid trivia, brainteasers, discriminatory topics, duplicate questions, or questions answerable only by guessing.
      Coding tasks must be solvable in 15 to 25 minutes, state constraints and examples, and assess a skill relevant to the resume or job description.
      Do not invent claims about the candidate. Ask them to explain evidence from their resume.

      Return ONLY a JSON array of exactly ${questionCount} objects with this shape:
      {"id":"q1","text":"question","type":"regular or coding","category":"resume or technical or behavioral or situational or coding","difficulty":"easy or medium or hard","skills":["skill"],"evaluationCriteria":["observable criterion"],"starterCode":"optional code","language":"optional language"}
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

    if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
      throw new Error("AI did not return a question array");
    }
    const processedQuestions: InterviewQuestion[] = parsedQuestions.slice(0, questionCount).map((question: unknown, index: number) => {
      if (typeof question === "string") {
        const coding = question.startsWith("[CODING]");
        return { id: `q${index + 1}`, text: question.replace("[CODING]", "").trim(), type: coding ? "coding" as const : "regular" as const };
      }
      const value = question as Record<string, unknown>;
      const questionType: InterviewQuestion["type"] = value.type === "coding" ? "coding" : "regular";
      return {
        id: String(value.id || `q${index + 1}`),
        text: String(value.text || "").trim(),
        type: questionType,
        category: String(value.category || (questionType === "coding" ? "coding" : "technical")) as InterviewQuestion["category"],
        difficulty: String(value.difficulty || "medium") as InterviewQuestion["difficulty"],
        skills: Array.isArray(value.skills) ? value.skills.map(String).slice(0, 8) : [],
        evaluationCriteria: Array.isArray(value.evaluationCriteria) ? value.evaluationCriteria.map(String).slice(0, 8) : [],
        starterCode: value.starterCode ? String(value.starterCode) : undefined,
        language: value.language ? String(value.language) : undefined,
      };
    }).filter((question) => question.text);

    if (processedQuestions.length < 4) throw new Error("AI returned too few valid questions");

    const interview = {
      role: selectedRole,
      type: String(type || "mixed"),
      level: String(level || "intermediate"),
      techstack: selectedTechstack.split(",").map((skill) => skill.trim()).filter(Boolean),
      questions: processedQuestions,
      userId: new ObjectId(sessionUserId),
      jobDescription: safeJobDescription || undefined,
      resumeSnapshot: resume ? {
        headline: resume.headline,
        skills: resume.skills.slice(0, 30),
        projects: resume.projects.slice(0, 10).map((project) => project.name),
      } : undefined,
      finalized: true,
      coverImage: getRandomInterviewCover(),
    };

    console.log('💾 Saving interview to database...');
    const interviewId = await createInterview(interview);
    console.log('✅ Interview saved successfully with ID:', interviewId);

    return Response.json({ 
      success: true, 
      interviewId,
      created: true,
    }, { status: 200 });
  } catch (error: any) {
    if (reservedUserId) await refundPlanUsage(reservedUserId, "interviews");
    if (error instanceof CreditLimitError) {
      return Response.json({ success: false, error: error.message }, { status: error.status });
    }
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
