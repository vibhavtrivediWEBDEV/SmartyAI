/**
 * Career AI API
 * 
 * AI endpoints for Career Agent
 * Handles job profile extraction, plan generation, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth/session';
import { getAIService } from '@/lib/ai';

/**
 * POST /api/career/ai
 * Process AI tasks for Career Agent
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await getSessionUserId();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { task, data } = body;
    
    switch (task) {
      case 'conversation':
        return await handleConversation(data);
      
      case 'extract_job_profile':
        return await extractJobProfile(data);
      
      case 'generate_preparation_plan':
        return await generatePreparationPlan(data);
      
      case 'generate_questions':
        return await generateInterviewQuestions(data);
      
      default:
        return NextResponse.json(
          { error: 'Unknown task' },
          { status: 400 }
        );
    }
    
  } catch (error: any) {
    console.error('Career AI error:', error);
    return NextResponse.json(
      { error: error.message || 'AI processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Extract Job Profile
 */
async function extractJobProfile(data: {
  jobDescription: string;
  company: string;
  role: string;
}) {
  const { jobDescription, company, role } = data;
  
  // Use existing AI service
  const aiService = await getAIService();
  
  const prompt = `Extract structured job profile from this job description for a ${role} position at ${company}.

Job Description:
${jobDescription}

Return JSON with:
{
  "company": "${company}",
  "role": "${role}",
  "experienceLevel": "extract from JD",
  "requiredSkills": ["array of required skills"],
  "preferredSkills": ["array of preferred skills"],
  "technologies": ["array of technologies mentioned"],
  "responsibilities": ["array of key responsibilities"],
  "interviewTopics": ["array of likely interview topics based on skills/responsibilities"],
  "codingTopics": ["array of coding topics"],
  "softSkills": ["array of soft skills mentioned"],
  "jobDescription": "original JD text"
}

Only return valid JSON.`;

  const response = await aiService.complete(prompt);
  
  try {
    // Parse JSON from response
    const jsonMatch = response.content.match(/\\{[\\s\\S]*\\}/);
    if (jsonMatch) {
      const jobProfile = JSON.parse(jsonMatch[0]);
      jobProfile.extractedAt = new Date();
      return NextResponse.json(jobProfile);
    }
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
  }
  
  // Fallback: Return basic structure
  return NextResponse.json({
    company,
    role,
    experienceLevel: 'Not specified',
    requiredSkills: [],
    preferredSkills: [],
    technologies: [],
    responsibilities: [],
    interviewTopics: [],
    codingTopics: [],
    softSkills: [],
    jobDescription,
    extractedAt: new Date()
  });
}

/**
 * Generate Preparation Plan
 */
async function generatePreparationPlan(data: {
  jobProfile: any;
  skillGaps: any[];
  daysUntilInterview: number;
  startDate: Date;
  interviewDate?: Date;
}) {
  const { jobProfile, skillGaps, daysUntilInterview, startDate, interviewDate } = data;
  
  // Use existing AI service
  const aiService = await getAIService();
  
  const prompt = `Generate a ${daysUntilInterview}-day preparation plan for ${jobProfile.company} ${jobProfile.role} interview.

Job Profile:
- Required Skills: ${jobProfile.requiredSkills?.join(', ')}
- Technologies: ${jobProfile.technologies?.join(', ')}
- Interview Topics: ${jobProfile.interviewTopics?.join(', ')}
- Coding Topics: ${jobProfile.codingTopics?.join(', ')}

Skill Gaps:
${skillGaps.map(g => `- ${g.skill}: ${g.status}`).join('\n')}

Return JSON with:
{
  "missionId": "provided separately",
  "totalDays": ${daysUntilInterview},
  "dailySchedule": [
    {
      "day": 1,
      "tasks": ["task descriptions"],
      "focusArea": "main topic",
      "hours": 1
    }
  ],
  "estimatedHours": total_hours,
  "focusAreas": ["priority areas"]
}

Only return valid JSON.`;

  const response = await aiService.complete(prompt);
  
  try {
    const jsonMatch = response.content.match(/\\{[\\s\\S]*\\}/);
    if (jsonMatch) {
      const plan = JSON.parse(jsonMatch[0]);
      
      // Convert day numbers to dates
      plan.dailySchedule.forEach((day: any) => {
        day.date = new Date(startDate);
        day.date.setDate(day.date.getDate() + day.day - 1);
      });
      
      return NextResponse.json(plan);
    }
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
  }
  
  // Fallback: Generate basic schedule
  const basicPlan = generateBasicPlan(jobProfile, skillGaps, daysUntilInterview, startDate);
  return NextResponse.json(basicPlan);
}

/**
 * Generate Interview Questions
 */
async function generateInterviewQuestions(data: {
  jobProfile: any;
  category: string;
  count: number;
}) {
  const { jobProfile, category, count } = data;
  
  // This would use AI to generate questions
  // For now, return structure
  
  return NextResponse.json({
    questions: [],
    category,
    total: count
  });
}

/**
 * Handle Conversational AI
 * Manages interactive dialogue to gather career mission data
 */
async function handleConversation(data: {
  userInput: string;
  currentState: string;
  missionData: any;
  userContext: any;
}) {
  const { userInput, currentState, missionData, userContext } = data;
  
  const aiService = await getAIService();
  
  // Initialize missionData if empty
  const currentMission = missionData || {};
  
  // CHECK IF USER IS CONFIRMING MISSION CREATION
  if (currentState === 'confirming' || currentState === 'complete') {
    const userConfirmed = userInput.toLowerCase().includes('yes') || 
                          userInput.toLowerCase().includes('create') ||
                          userInput.toLowerCase().includes('confirm') ||
                          userInput.toLowerCase().includes('sure') ||
                          userInput.toLowerCase().includes('go ahead');
    
    if (userConfirmed && currentMission.company && currentMission.role && currentMission.interviewDate) {
      return NextResponse.json({
        response: "Perfect! Creating your career mission now...",
        nextState: {
          stage: 'complete',
          missionData: currentMission,
          awaitingInput: null
        },
        shouldCreateMission: true
      });
    }
  }
  
  // Extract information from user input
  let updatedMissionData = { ...currentMission };
  
  // IMPROVED entity extraction - more flexible patterns
  
  // Company patterns (flexible)
  const companyPatterns = [
    /(?:at|with)\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?)(?:\s|$)/i, // "at Google" or "at Goldman Sachs"
    /^([A-Z][A-Za-z]+)(?:\s|$)/i, // Just company name at start (e.g., "Google")
    /company[:\s]+([A-Z][A-Za-z\s]+?)(?:\s|and|$)/i,
    /interview(?:ing)?\s+(?:at|with)\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?)/i
  ];
  
  for (const pattern of companyPatterns) {
    const match = userInput.match(pattern);
    if (match && match[1] && match[1].length > 2 && match[1].length < 30) {
      updatedMissionData.company = match[1].trim();
      break;
    }
  }
  
  // Role patterns (flexible)
  const rolePatterns = [
    /(?:role|position|title|job|as)\s+(?:a\s+)?([A-Za-z\s]+?)(?:\s+(?:at|for|with|in)|$)/i,
    /(?:applying|apply|apply for|hired as)\s+(?:a\s+|for\s+)?([A-Za-z\s]+?)(?:\s+(?:at|for|with)|$)/i,
    /^([A-Za-z\s]+?)\s+(?:role|position|developer|engineer|manager)/i
  ];
  
  for (const pattern of rolePatterns) {
    const match = userInput.match(pattern);
    if (match && match[1] && match[1].length > 3) {
      updatedMissionData.role = match[1].trim();
      break;
    }
  }
  
  // Date patterns (flexible)
  const datePatterns = [
    /(?:in|within|after)\s+(\d+)\s+days?/i,
    /(?:next|this|coming)\s+(\w+)/i,
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/, // Date format MM/DD/YYYY
    /(\w+\s+\d{1,2},?\s+\d{4})/i // Month Day, Year
  ];
  
  for (const pattern of datePatterns) {
    const match = userInput.match(pattern);
    if (match) {
      if (match[1] && match[1].match(/^\d+$/)) {
        // "in 5 days" format
        const days = parseInt(match[1]);
        const interviewDate = new Date();
        interviewDate.setDate(interviewDate.getDate() + days);
        updatedMissionData.interviewDate = interviewDate.toISOString();
      }
      break;
    }
  }
  
  // Determine what's missing
  const missing = [];
  if (!updatedMissionData.company) missing.push('company');
  if (!updatedMissionData.role) missing.push('role');
  if (!updatedMissionData.interviewDate) missing.push('interview date');
  
  // Generate response based on what's missing
  let response = '';
  let nextState = 'gathering';
  let shouldCreateMission = false;
  
  if (missing.length === 0) {
    // All data collected
    response = `Perfect! Let me confirm:\n\nCompany: ${updatedMissionData.company}\nRole: ${updatedMissionData.role}\nInterview: ${new Date(updatedMissionData.interviewDate).toLocaleDateString()}\n\nShould I create this career mission now?`;
    nextState = 'confirming';
  } else {
    // Ask for missing information
    const nextMissing = missing[0];
    if (nextMissing === 'company') {
      response = "Great! Which company are you interviewing with?";
    } else if (nextMissing === 'role') {
      response = `What role or position at ${updatedMissionData.company || 'the company'}?`;
    } else if (nextMissing === 'interview date') {
      response = "When is your interview? You can say something like 'in 5 days' or give a specific date.";
    }
  }
  
  const prompt = `You are a Career Mission SCHEDULER, NOT an interviewer.

Your ONLY job: Collect 3 pieces of information to schedule a career preparation mission:
1. Company name
2. Job role/title  
3. Interview date

User said: "${userInput}"
Extracted data: Company="${updatedMissionData.company || 'unknown'}", Role="${updatedMissionData.role || 'unknown'}", Interview="${updatedMissionData.interviewDate || 'unknown'}"
Still need: ${missing.join(', ') || 'nothing - all data collected'}

CRITICAL RULES:
- DO NOT ask technical questions (NO React, NO coding questions)
- DO NOT conduct interviews
- DO NOT ask about skills or experience
- ONLY ask for missing info: company, role, or date
- Be brief (max 15 words)
- If all data collected, confirm: "Create mission for [Company] [Role] interview on [Date]?"

Your response:`;
  
  const aiResponse = await aiService.complete(prompt);
  
  // Use AI response if available, otherwise use fallback
  const finalResponse = aiResponse.content?.trim() || response;
  
  // If all data collected, check if we should create mission
  if (missing.length === 0) {
    shouldCreateMission = userInput.toLowerCase().includes('yes') || 
                          userInput.toLowerCase().includes('create') ||
                          userInput.toLowerCase().includes('confirm');
  }
  
  return NextResponse.json({
    response: finalResponse,
    nextState: {
      stage: nextState,
      missionData: updatedMissionData,
      awaitingInput: missing[0] || null
    },
    shouldCreateMission: shouldCreateMission && missing.length === 0
  });
}

/**
 * Generate Basic Plan (Fallback)
 */
function generateBasicPlan(
  jobProfile: any, 
  skillGaps: any[], 
  days: number, 
  startDate: Date
): any {
  const dailySchedule = [];
  
  for (let day = 1; day <= days; day++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + day - 1);
    
    dailySchedule.push({
      day,
      date,
      tasks: [
        'Review job description',
        'Practice technical skills',
        'Prepare behavioral examples'
      ],
      focusArea: 'General preparation',
      hours: 1.5
    });
  }
  
  return {
    missionId: '',
    totalDays: days,
    dailySchedule,
    estimatedHours: days * 1.5,
    focusAreas: ['Technical skills', 'Behavioral preparation', 'Company research']
  };
}
