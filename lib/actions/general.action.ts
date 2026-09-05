"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { createAIService } from "@/lib/ai";
import { ObjectId } from "mongodb";

import { db } from "@/firebase/admin";
import { feedbackSchema } from "@/constants";
import { getCurrentUser } from "@/lib/actions/auth.action";
import {
  findFeedback,
  findInterviewById,
  findOwnedInterviewById,
  findInterviewsByUserId,
  findLatestInterviews,
  saveCodeSubmission,
  saveFeedback,
} from "@/modules/interviews/interview.repository";

interface TeachingSession {
  id: string;
  [key: string]: unknown;
}

/**
 * Create feedback with dynamic AI provider
 * Uses Bedrock/GLM if USE_AI_PROVIDER=bedrock, else Google Gemini
 */
export async function createFeedback(params: CreateFeedbackParams) {
  console.log("🚀 createFeedback STARTED");
  console.log("📥 Params:", { interviewId: params.interviewId, userId: params.userId, transcriptLength: params.transcript?.length, feedbackId: params.feedbackId });
  
  const { interviewId, userId, transcript, feedbackId } = params;

  try {
    console.log("🔐 Checking user authorization...");
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.id !== userId) {
      console.error("❌ Unauthorized: currentUser.id !== userId", { currentUserId: currentUser?.id, userId });
      throw new Error("Unauthorized feedback request");
    }
    console.log("✅ User authorized:", currentUser.id);
    console.log("📝 Formatting transcript...");
    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `- ${sentence.role}: ${sentence.content}\n`
      )
      .join("");
    
    console.log("📊 Transcript formatted, length:", formattedTranscript.length);
    console.log("📖 First 200 chars:", formattedTranscript.substring(0, 200));

    // 🎯 Check AI provider and use appropriate model
    const provider = process.env.USE_AI_PROVIDER || process.env.NEXT_PUBLIC_USE_AI_PROVIDER;
    console.log("🤖 AI Provider:", provider);
    
    let feedbackObject;
    
    if (provider === 'bedrock' || provider === 'bedrock-mantle') {
      // Use Bedrock/GLM for feedback generation
      console.log('🎯 Using Bedrock/GLM for feedback generation');
      
      const aiService = createAIService();
      const feedbackPrompt = `
You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.

Transcript:
${formattedTranscript}

Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
- **Communication Skills**: Clarity, articulation, structured responses.
- **Technical Knowledge**: Understanding of key concepts for the role.
- **Problem-Solving**: Ability to analyze problems and propose solutions.
- **Cultural & Role Fit**: Alignment with company values and job role.
- **Confidence & Clarity**: Confidence in responses, engagement, and clarity.

Return a JSON object with this structure:
{
  "totalScore": <number 0-100>,
  "categoryScores": [
    {"name": "Communication Skills", "score": <number>, "comment": "<string>"},
    {"name": "Technical Knowledge", "score": <number>, "comment": "<string>"},
    {"name": "Problem-Solving", "score": <number>, "comment": "<string>"},
    {"name": "Cultural & Role Fit", "score": <number>, "comment": "<string>"},
    {"name": "Confidence & Clarity", "score": <number>, "comment": "<string>"}
  ],
  "strengths": ["<string>", "<string>", "<string>"],
  "areasForImprovement": ["<string>", "<string>", "<string>"],
  "finalAssessment": "<string>"
}
      `;
      
      console.log("📤 Sending prompt to Bedrock...");
      const response = await aiService.chat([
        { role: 'system', content: 'You are a professional interviewer analyzing a mock interview. Return ONLY valid JSON, no markdown.' },
        { role: 'user', content: feedbackPrompt }
      ], { maxTokens: 2000, temperature: 0.7 });
      console.log("📥 Bedrock response received:", response.content?.substring(0, 200));
      
      // Parse JSON from Bedrock response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('❌ No JSON found in Bedrock response:', response.content);
        throw new Error('Invalid JSON response from Bedrock');
      }
      console.log("✅ JSON extracted from Bedrock response");
      feedbackObject = JSON.parse(jsonMatch[0]);
      console.log("✅ Parsed feedback object:", feedbackObject);
      
    } else {
      // Default: Use Google Gemini
      console.log('� Using Google Gemini for feedback generation');
      
      const result = await generateObject({
        model: google("gemini-2.0-flash-001", {
          structuredOutputs: false,
        }),
        schema: feedbackSchema,
        prompt: `
You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
Transcript:
${formattedTranscript}

Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
- **Communication Skills**: Clarity, articulation, structured responses.
- **Technical Knowledge**: Understanding of key concepts for the role.
- **Problem-Solving**: Ability to analyze problems and propose solutions.
- **Cultural & Role Fit**: Alignment with company values and job role.
- **Confidence & Clarity**: Confidence in responses, engagement, and clarity.
        `,
        system:
          "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
      });
      
      console.log("📤 Sent prompt to Gemini...");
      feedbackObject = result.object;
      console.log("✅ Received feedback from Gemini:", feedbackObject);
    }

    console.log("🔍 Validating ObjectIds...");
    if (!ObjectId.isValid(interviewId) || !ObjectId.isValid(userId)) {
      console.error("❌ Invalid ObjectId:", { interviewId, userId });
      throw new Error("Invalid interview or user identifier");
    }
    console.log("✅ ObjectIds are valid");

    const feedback = {
      interviewId: new ObjectId(interviewId),
      userId: new ObjectId(userId),
      totalScore: feedbackObject.totalScore,
      categoryScores: feedbackObject.categoryScores,
      strengths: feedbackObject.strengths,
      areasForImprovement: feedbackObject.areasForImprovement,
      finalAssessment: feedbackObject.finalAssessment,
    };
    
    console.log("💾 Saving feedback to MongoDB...");
    console.log("📊 Feedback object:", JSON.stringify(feedback, null, 2));
    const savedFeedbackId = await saveFeedback(feedback, feedbackId);
    console.log("✅ Feedback SAVED successfully with ID:", savedFeedbackId);

    return { success: true, feedbackId: savedFeedbackId };
  } catch (error) {
    console.error("❌ ERROR in createFeedback:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace");
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function getInterviewById(id: string): Promise<Interview | null> {
  return findInterviewById(id);
}

export async function getOwnedInterviewById(
  id: string,
  userId: string
): Promise<Interview | null> {
  return findOwnedInterviewById(id, userId);
}

export async function getSessionBySessionId(id: string): Promise<TeachingSession | null> {
  try {
    const session = await db.collection("teachingSessions").doc(id).get();
    
    if (!session.exists) {
      return null;
    }
    
    return { id: session.id, ...session.data() } as TeachingSession;
  } catch (error) {
    console.error("Error fetching teaching session:", error);
    return null;
  }
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } = params;

  return findFeedback(interviewId, userId);
}

export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
  const { userId, limit = 20 } = params;

  return findLatestInterviews(userId, limit);
}

export async function getInterviewsByUserId(
  userId: string
): Promise<Interview[] | null> {
  return findInterviewsByUserId(userId);
}


export async function getLastInterviewsByUserId(
  userId: string
): Promise<Interview[] | null> {
  return findInterviewsByUserId(userId, 1);
}

export async function reviewCodeSubmission(params: {
  interviewId: string;
  question: string;
  code: string;
  language: string;
}) {
  const user = await getCurrentUser();
  if (!user || !ObjectId.isValid(params.interviewId) || params.code.trim().length < 3) {
    return { success: false, message: "Unable to review this submission." };
  }

  const interview = await findInterviewById(params.interviewId);
  if (!interview || !interview.finalized) {
    return { success: false, message: "Interview not found." };
  }

  try {
    const response = await createAIService().chat([
      {
        role: "system",
        content: "You are a senior technical interviewer. Evaluate code accurately, never claim it was executed, and return only valid JSON.",
      },
      {
        role: "user",
        content: `Question: ${params.question}\nLanguage: ${params.language}\nCandidate code:\n${params.code}\n\nReturn JSON: {"score":0-100,"summary":"concise feedback","strengths":["..."],"improvements":["..."],"complexity":"time and space complexity, or unknown"}`,
      },
    ], { temperature: 0.2, maxTokens: 1200 });
    const match = response.content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI returned invalid code review JSON");
    const review = JSON.parse(match[0]) as {
      score: number;
      summary: string;
      strengths: string[];
      improvements: string[];
      complexity?: string;
    };
    const score = Math.max(0, Math.min(100, Number(review.score) || 0));
    await saveCodeSubmission({
      interviewId: new ObjectId(params.interviewId),
      userId: new ObjectId(user.id),
      question: params.question,
      code: params.code,
      language: params.language,
      score,
      summary: review.summary,
      strengths: review.strengths ?? [],
      improvements: review.improvements ?? [],
      complexity: review.complexity,
      createdAt: new Date(),
    });
    return { success: true, review: { ...review, score } };
  } catch (error) {
    console.error("Error reviewing code:", error);
    return { success: false, message: "Code review is temporarily unavailable." };
  }
}
