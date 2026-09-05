/**
 * Career AI API
 * 
 * AI endpoints for Career Agent
 * Handles job profile extraction, plan generation, etc.
 * 
 * CRITICAL: Uses persistent CareerSession for conversation state
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth/session';
import { getAIService } from '@/lib/ai';
import * as sessionRepo from '@/modules/career/careerSession.repository';
import { CareerSessionManager } from '@/lib/career/CareerSessionManager';

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
        return await handleConversation(userId, data);
      
      case 'extract_job_profile':
        return await extractJobProfile(data);
      
      case 'generate_preparation_plan':
        return await generatePreparationPlan(data);
      
      case 'generate_questions':
        return await generateInterviewQuestions(data);
      
      case 'generate_calendar_events':
        return await generateCalendarEvents(data);
      
      case 'generate_notes':
        return await generateNotesContent(data);
      
      case 'generate_learning_plan':
        return await generateLearningPlan(data);
      
      case 'generate_interview_session':
        return await generateInterviewSession(data);
      
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
 * Extract Job Profile AND Compare with User Profile
 */
async function extractJobProfile(data: {
  jobDescription: string;
  company: string;
  role: string;
  userProfile?: any; // User's actual profile from database
}) {
  try {
    const { jobDescription, company, role, userProfile } = data;
    
    console.log('[extractJobProfile] Starting analysis:', {
      company,
      role,
      hasJobDescription: !!jobDescription,
      hasUserProfile: !!userProfile,
      userSkillsCount: userProfile?.professional?.skills?.length || 0
    });
    
    // Use existing AI service
    const aiService = await getAIService();
    
    // Build user profile summary for AI prompt
    const userProfileSummary = userProfile ? `
USER PROFILE (from database):
- Name: ${userProfile.personal?.fullName || 'Not provided'}
- Headline: ${userProfile.personal?.headline || 'Not provided'}
- Summary: ${userProfile.personal?.summary?.substring(0, 200) || 'Not provided'}...
- Skills: ${userProfile.professional?.skills?.slice(0, 10).join(', ') || 'Not provided'}
- Experience: ${userProfile.professional?.experience?.length || 0} positions
- Education: ${userProfile.professional?.education?.length || 0} entries
` : 'No user profile data available';

    const prompt = `Analyze this job description and compare it with the user's profile.

JOB DESCRIPTION:
Company: ${company}
Role: ${role}
Description: ${jobDescription}

${userProfileSummary}

TASKS:
1. Extract structured job profile from the job description
2. Identify skill gaps between user's current skills and job requirements
3. Suggest focus areas for interview preparation

Return JSON with:
{
  "jobProfile": {
    "company": "${company}",
    "role": "${role}",
    "experienceLevel": "extract from JD",
    "requiredSkills": ["array of required skills"],
    "preferredSkills": ["array of preferred skills"],
    "technologies": ["array of technologies mentioned"],
    "responsibilities": ["array of key responsibilities"],
    "interviewTopics": ["array of likely interview topics based on skills/responsibilities"],
    "codingTopics": ["array of coding topics"],
    "softSkills": ["array of soft skills mentioned"]
  },
  "userProfile": {
    "strengths": ["skills user has that match job requirements"],
    "weaknesses": ["skills user lacks for this role"],
    "experience": ["array of relevant experience"],
    "education": ["education details"]
  },
  "skillGaps": [
    {
      "skill": "skill name",
      "status": "critical|moderate|nice-to-have",
      "category": "technical|soft-skill|domain"
    }
  ],
  "focusAreas": ["priority areas for interview prep"]
}

Only return valid JSON.`;

    console.log('[extractJobProfile] Calling AI service...');
    const response = await aiService.complete(prompt);
    console.log('[extractJobProfile] AI response received');
    
    try {
      // Parse JSON from response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        result.jobProfile.extractedAt = new Date();
        console.log('[extractJobProfile] Successfully parsed JSON result');
        return NextResponse.json(result);
      } else {
        console.error('[extractJobProfile] No JSON found in response');
      }
    } catch (parseError) {
      console.error('[extractJobProfile] JSON parse error:', parseError);
    }
    
    // Fallback: Return basic structure with skill gaps
    console.log('[extractJobProfile] Using fallback response');
    const userSkills = userProfile?.professional?.skills || [];
    const requiredSkills = ['React', 'TypeScript', 'System Design']; // Basic fallback
    
    const skillGaps = requiredSkills
      .filter(skill => !userSkills.includes(skill))
      .map(skill => ({
        skill,
        status: 'critical',
        category: 'technical'
      }));
    
    return NextResponse.json({
      jobProfile: {
        company,
        role,
        experienceLevel: 'Not specified',
        requiredSkills,
        preferredSkills: [],
        technologies: [],
        responsibilities: [],
        interviewTopics: [],
        codingTopics: [],
        softSkills: [],
        extractedAt: new Date()
      },
      userProfile: {
        strengths: userSkills.slice(0, 3),
        weaknesses: [],
        experience: [],
        education: []
      },
      skillGaps,
      focusAreas: ['Interview preparation', 'Technical skills']
    });
  } catch (error: any) {
    console.error('[extractJobProfile] Error:', error.message);
    console.error('[extractJobProfile] Stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to extract job profile: ' + error.message },
      { status: 500 }
    );
  }
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
 * Generate Calendar Events - AI Powered
 */
async function generateCalendarEvents(data: {
  company: string;
  role: string;
  jobProfile: any;
  userProfile: any;
  skillGaps: any[];
  interviewDate: string;
  startDate: string;
  daysUntilInterview: number;
}) {
  const { company, role, jobProfile, userProfile, skillGaps, interviewDate, startDate, daysUntilInterview } = data;
  
  const aiService = await getAIService();
  
  const prompt = `Generate a ${daysUntilInterview}-day interview preparation calendar schedule for ${company} ${role}.

User Profile:
- Skills: ${userProfile?.skills?.join(', ') || 'Not provided'}
- Experience: ${userProfile?.experience?.join(', ') || 'Not provided'}
- Weaknesses: ${userProfile?.weaknesses?.join(', ') || 'Not provided'}

Job Requirements:
- Required Skills: ${jobProfile?.requiredSkills?.join(', ') || 'Not provided'}
- Technologies: ${jobProfile?.technologies?.join(', ') || 'Not provided'}
- Interview Topics: ${jobProfile?.interviewTopics?.join(', ') || 'Not provided'}

Skill Gaps to Address:
${skillGaps.map(g => `- ${g.skill}: ${g.status}`).join('\n')}

Generate exactly 12 calendar events spread across the ${daysUntilInterview} days. Each event should be 1-2 hours long.

Return JSON array:
{
  "events": [
    {
      "title": "Day 1 - Topic Name",
      "date": "YYYY-MM-DD",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "description": "What to study/practice",
      "location": "Online",
      "reminder": 30
    }
  ]
}

Only return valid JSON.`;

  const response = await aiService.complete(prompt);
  
  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return NextResponse.json(result);
    }
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
  }
  
  // Fallback: Basic events
  return NextResponse.json({
    events: generateBasicCalendarEvents(company, role, daysUntilInterview, new Date(startDate))
  });
}

/**
 * Generate Notes Content - AI Powered
 */
async function generateNotesContent(data: {
  company: string;
  role: string;
  jobProfile: any;
  userProfile: any;
  skillGaps: any[];
}) {
  const { company, role, jobProfile, userProfile, skillGaps } = data;
  
  const aiService = await getAIService();
  
  const prompt = `Generate comprehensive interview preparation notes for ${company} ${role} position.

User Profile:
- Skills: ${userProfile?.skills?.join(', ') || 'Not provided'}
- Experience: ${userProfile?.experience?.join(', ') || 'Not provided'}

Job Requirements:
- Required Skills: ${jobProfile?.requiredSkills?.join(', ') || 'Not provided'}
- Technologies: ${jobProfile?.technologies?.join(', ') || 'Not provided'}

Generate 8 detailed notes covering:
1. Company Research
2. Role-specific Technical Topics
3. Behavioral Questions
4. System Design (if applicable)
5. Coding Practice Topics
6. Past Experience Talking Points
7. Questions to Ask Interviewer
8. Common Mistakes to Avoid

Return JSON:
{
  "notes": [
    {
      "title": "Note Title",
      "content": "Detailed markdown content...",
      "category": "career",
      "tags": ["tag1", "tag2"]
    }
  ]
}

Only return valid JSON.`;

  const response = await aiService.complete(prompt);
  
  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return NextResponse.json(result);
    }
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
  }
  
  // Fallback
  return NextResponse.json({
    notes: [{
      title: `${company} - ${role} Interview Preparation`,
      content: `# Interview Preparation\n\nCompany: ${company}\nRole: ${role}\n\nGenerated by AI Career Agent`,
      category: 'career',
      tags: ['interview']
    }]
  });
}

/**
 * Generate Learning Plan - AI Powered
 */
async function generateLearningPlan(data: {
  company: string;
  role: string;
  jobProfile: any;
  userProfile: any;
  skillGaps: any[];
  daysUntilInterview: number;
}) {
  const { company, role, jobProfile, userProfile, skillGaps, daysUntilInterview } = data;
  
  const aiService = await getAIService();
  
  const prompt = `Generate a ${daysUntilInterview}-day learning plan for ${company} ${role} interview.

Skill Gaps to Address:
${skillGaps.map(g => `- ${g.skill}: ${g.status}`).join('\n')}

Topics to Master:
${jobProfile?.interviewTopics?.join(', ') || 'General interview prep'}

Generate 6 teacher lessons and 15 coding exercises.

Return JSON:
{
  "lessons": [
    {
      "topic": "Lesson Topic",
      "duration": 45,
      "concepts": ["concept1", "concept2"],
      "exercises": ["exercise1"]
    }
  ],
  "codingExercises": [
    {
      "title": "Exercise Name",
      "difficulty": "easy|medium|hard",
      "topics": ["topic1"],
      "description": "Brief description"
    }
  ],
  "topics": ["React", "System Design"],
  "courses": ["Course Name"],
  "practiceProblems": ["Problem 1", "Problem 2"]
}

Only return valid JSON.`;

  const response = await aiService.complete(prompt);
  
  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return NextResponse.json(result);
    }
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
  }
  
  // Fallback
  return NextResponse.json({
    lessons: [],
    codingExercises: [],
    topics: jobProfile?.interviewTopics || [],
    courses: [],
    practiceProblems: []
  });
}

/**
 * Generate Interview Session - AI Powered
 */
async function generateInterviewSession(data: {
  company: string;
  role: string;
  jobProfile: any;
  userProfile: any;
}) {
  const { company, role, jobProfile, userProfile } = data;
  
  const aiService = await getAIService();
  
  const prompt = `Generate interview questions for ${company} ${role} position.

User Skills: ${userProfile?.skills?.join(', ') || 'Not provided'}
Required Skills: ${jobProfile?.requiredSkills?.join(', ') || 'Not provided'}

Generate 24 interview questions (8 technical, 8 behavioral, 8 coding).

Return JSON:
{
  "questions": [
    {
      "type": "technical|behavioral|coding",
      "question": "Question text",
      "expectedAnswer": "Brief expected answer",
      "difficulty": "easy|medium|hard",
      "topic": "Topic category"
    }
  ]
}

Only return valid JSON.`;

  const response = await aiService.complete(prompt);
  
  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return NextResponse.json(result);
    }
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
  }
  
  // Fallback
  return NextResponse.json({
    questions: [
      { type: 'behavioral', question: 'Tell me about yourself', difficulty: 'easy', topic: 'general' },
      { type: 'technical', question: 'Explain React component lifecycle', difficulty: 'medium', topic: 'react' }
    ]
  });
}

/**
 * Helper: Generate Basic Calendar Events Fallback
 */
function generateBasicCalendarEvents(company: string, role: string, daysUntilInterview: number, startDate: Date): any[] {
  const events = [];
  
  for (let day = 1; day <= Math.min(daysUntilInterview, 12); day++) {
    const eventDate = new Date(startDate);
    eventDate.setDate(eventDate.getDate() + day - 1);
    
    events.push({
      title: `${company} Prep - Day ${day}`,
      date: eventDate.toISOString().split('T')[0],
      startTime: '10:00',
      endTime: '12:00',
      description: `${role} preparation session`,
      location: 'Online',
      reminder: 30
    });
  }
  
  return events;
}

/**
 * Handle Conversational AI
 * 
 * CRITICAL: Uses persistent CareerSession from MongoDB
 * Session survives between voice turns, page refreshes, etc.
 * 
 * ENHANCED: Properly captures job description and verifies all required fields
 */
async function handleConversation(
  userId: string,
  data: {
    userInput: string;
    currentState?: string;
    missionData?: any;
    userContext?: any;
  }
) {
  const { userInput } = data;
  
  console.log('\n🎯 [CAREER API] ========== NEW CONVERSATION TURN ==========');
  console.log(`[CAREER API] User: ${userId}`);
  console.log(`[CAREER API] Input: "${userInput}"`);
  
  try {
    // GET OR CREATE ACTIVE SESSION
    const session = await sessionRepo.getOrCreateActiveSession(userId);
    
    console.log(`[CAREER API] Session: ${session.id}`);
    console.log(`[CAREER API] State: ${session.state}`);
    console.log(`[CAREER API] Draft: ${JSON.stringify(session.draft)}`);
    
    // USE SESSION MANAGER TO PROCESS RESPONSE
    const manager = new CareerSessionManager(session);
    const result = await manager.processUserResponse(userInput);
    
    console.log(`[CAREER API] ✓ Processed successfully`);
    console.log(`[CAREER API] Next state: ${result.state}`);
    console.log(`[CAREER API] Missing: ${result.nextField || 'None'}`);
    console.log(`[CAREER API] Should create mission: ${result.shouldCreateMission}`);
    
    // ENHANCED: Validate all required fields before allowing mission creation
    if (result.shouldCreateMission) {
      const { company, role, interviewDate } = result.extracted;
      
      if (!company || !role || !interviewDate) {
        console.log(`[CAREER API] ⚠️ Missing required fields - preventing mission creation`);
        console.log(`[CAREER API] Company: ${company || 'MISSING'}`);
        console.log(`[CAREER API] Role: ${role || 'MISSING'}`);
        console.log(`[CAREER API] Interview Date: ${interviewDate || 'MISSING'}`);
        
        // Determine what's missing and ask for it
        const missingFields = [];
        if (!company) missingFields.push('company');
        if (!role) missingFields.push('role');
        if (!interviewDate) missingFields.push('interview date');
        
        return NextResponse.json({
          response: `I need a bit more information before creating your mission. Please tell me your ${missingFields.join(' and ')}.`,
          nextState: {
            stage: result.state.toLowerCase(),
            missionData: result.extracted,
            awaitingInput: missingFields[0]
          },
          shouldCreateMission: false,
          sessionId: session.id
        });
      }
      
      console.log(`[CAREER API] ✅ All required fields present - allowing mission creation`);
      console.log(`[CAREER API] Company: ${company}`);
      console.log(`[CAREER API] Role: ${role}`);
      console.log(`[CAREER API] Interview Date: ${interviewDate}`);
    }
    
    // Return structured response
    return NextResponse.json({
      response: result.message,
      nextState: {
        stage: result.state.toLowerCase(),
        missionData: result.extracted,
        awaitingInput: result.nextField
      },
      shouldCreateMission: result.shouldCreateMission,
      missionId: result.missionId,
      sessionId: session.id
    });
    
  } catch (error: any) {
    console.error('[CAREER ERROR]', error);
    
    return NextResponse.json(
      { 
        error: 'Conversation processing failed',
        details: error.message 
      },
      { status: 500 }
    );
  }
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
