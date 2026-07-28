"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { createAIService } from "@/lib/ai";

import { db } from "@/firebase/admin";
import { feedbackSchema } from "@/constants";
import { limit } from "firebase/firestore";

/**
 * Create feedback with dynamic AI provider
 * Uses Bedrock/GLM if USE_AI_PROVIDER=bedrock, else Google Gemini
 */
export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, userId, transcript, feedbackId } = params;

  try {
    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `- ${sentence.role}: ${sentence.content}\n`
      )
      .join("");

    // 🎯 Check AI provider and use appropriate model
    const provider = process.env.USE_AI_PROVIDER || process.env.NEXT_PUBLIC_USE_AI_PROVIDER;
    
    let feedbackObject;
    
    if (provider === 'bedrock') {
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
      
      const response = await aiService.chat([
        { role: 'system', content: 'You are a professional interviewer analyzing a mock interview. Return ONLY valid JSON, no markdown.' },
        { role: 'user', content: feedbackPrompt }
      ], { maxTokens: 2000, temperature: 0.7 });
      
      // Parse JSON from Bedrock response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from Bedrock');
      }
      feedbackObject = JSON.parse(jsonMatch[0]);
      
    } else {
      // Default: Use Google Gemini
      console.log('🎯 Using Google Gemini for feedback generation');
      
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
      
      feedbackObject = result.object;
    }

    const feedback = {
      interviewId: interviewId,
      userId: userId,
      totalScore: feedbackObject.totalScore,
      categoryScores: feedbackObject.categoryScores,
      strengths: feedbackObject.strengths,
      areasForImprovement: feedbackObject.areasForImprovement,
      finalAssessment: feedbackObject.finalAssessment,
      createdAt: new Date().toISOString(),
    };

    let feedbackRef;

    if (feedbackId) {
      feedbackRef = db.collection("feedback").doc(feedbackId);
    } else {
      feedbackRef = db.collection("feedback").doc();
    }

    await feedbackRef.set(feedback);

    return { success: true, feedbackId: feedbackRef.id };
  } catch (error) {
    console.error("Error saving feedback:", error);
    return { success: false };
  }
}

export async function getInterviewById(id: any): Promise<Interview | null> {
  const interview = await db.collection("interviews").doc(id).get();

  return interview.data() as Interview | null;
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

  const querySnapshot = await db
    .collection("feedback")
    .where("interviewId", "==", interviewId)
    .where("userId", "==", userId)
    .limit(1)
    .get();

  if (querySnapshot.empty) return null;

  const feedbackDoc = querySnapshot.docs[0];
  return { id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;
}

export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
  const { userId, limit = 20 } = params;

  const interviews = await db
    .collection("interviews")
    .orderBy("createdAt", "desc")
    .where("finalized", "==", true)
    .where("userId", "!=", userId)
    .limit(limit)
    .get();

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

export async function getInterviewsByUserId(
  userId: string
): Promise<Interview[] | null> {
  const interviews = await db
    .collection("interviews")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();

    

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}


export async function getLastInterviewsByUserId(
  userId: string
): Promise<Interview[] | null> {
  const interviews = await db
    .collection("interviews")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

    

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}
