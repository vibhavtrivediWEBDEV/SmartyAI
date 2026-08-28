/**
 * Career AI Business Logic Functions
 * 
 * These functions can be called directly from server-side code (executor)
 * or via HTTP API routes (frontend calls).
 * 
 * NO authentication required - these are pure business logic functions
 */

import { getAIService } from '@/lib/ai';

/**
 * Extract Job Profile and Compare with User Profile
 */
export async function extractJobProfileDirect(data: {
  jobDescription: string;
  company: string;
  role: string;
  userProfile?: any;
}) {
  const { jobDescription, company, role, userProfile } = data;
  
  console.log('[extractJobProfile] Starting analysis:', {
    company,
    role,
    hasJobDescription: !!jobDescription,
    hasUserProfile: !!userProfile
  });
  
  try {
    const aiService = await getAIService();
    
    // Build user profile summary for AI prompt
    const userProfileSummary = userProfile ? `
USER PROFILE (from database):
- Name: ${userProfile.displayName || 'Not provided'}
- Role: ${userProfile.role || 'Not provided'}
- Bio: ${userProfile.bio?.substring(0, 200) || 'Not provided'}...
- Skills: ${userProfile.skills?.slice(0, 10).join(', ') || 'Not provided'}
- Experience: ${userProfile.experience?.length || 0} positions
- Projects: ${userProfile.projects?.length || 0} projects
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
    
    // Parse JSON from response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      result.jobProfile.extractedAt = new Date();
      console.log('[extractJobProfile] Successfully parsed JSON result');
      return result;
    }
    
    // Fallback: Return basic structure with skill gaps
    console.log('[extractJobProfile] Using fallback response');
    const userSkills = userProfile?.skills || [];
    const requiredSkills = ['React', 'TypeScript', 'System Design'];
    
    const skillGaps = requiredSkills
      .filter(skill => !userSkills.includes(skill))
      .map(skill => ({
        skill,
        status: 'critical',
        category: 'technical'
      }));
    
    return {
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
    };
  } catch (error: any) {
    console.error('[extractJobProfile] Error:', error.message);
    console.error('[extractJobProfile] Stack:', error.stack);
    throw new Error('Failed to extract job profile: ' + error.message);
  }
}

/**
 * Generate Notes Content - AI Powered
 */
export async function generateNotesDirect(data: {
  company: string;
  role: string;
  jobProfile: any;
  userProfile: any;
  skillGaps: any[];
}) {
  const { company, role, jobProfile, userProfile, skillGaps } = data;
  
  try {
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
    
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return result;
    }
    
    // Fallback
    return {
      notes: [{
        title: `${company} - ${role} Interview Preparation`,
        content: `# Interview Preparation\n\nCompany: ${company}\nRole: ${role}\n\nGenerated by AI Career Agent`,
        category: 'career',
        tags: ['interview']
      }]
    };
  } catch (error: any) {
    console.error('[generateNotes] Error:', error.message);
    throw new Error('Failed to generate notes: ' + error.message);
  }
}

/**
 * Generate Calendar Events - AI Powered
 */
export async function generateCalendarEventsDirect(data: {
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
  
  try {
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
    
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return result;
    }
    
    // Fallback: Basic events
    return {
      events: generateBasicCalendarEvents(company, role, daysUntilInterview, new Date(startDate))
    };
  } catch (error: any) {
    console.error('[generateCalendarEvents] Error:', error.message);
    throw new Error('Failed to generate calendar events: ' + error.message);
  }
}

/**
 * Generate Learning Plan - AI Powered
 */
export async function generateLearningPlanDirect(data: {
  company: string;
  role: string;
  jobProfile: any;
  userProfile: any;
  skillGaps: any[];
  daysUntilInterview: number;
}) {
  const { company, role, jobProfile, userProfile, skillGaps, daysUntilInterview } = data;
  
  try {
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
    
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return result;
    }
    
    // Fallback
    return {
      lessons: [],
      codingExercises: [],
      topics: [],
      courses: [],
      practiceProblems: []
    };
  } catch (error: any) {
    console.error('[generateLearningPlan] Error:', error.message);
    throw new Error('Failed to generate learning plan: ' + error.message);
  }
}

/**
 * Generate Interview Session - AI Powered
 */
export async function generateInterviewSessionDirect(data: {
  company: string;
  role: string;
  jobProfile: any;
  userProfile: any;
}) {
  const { company, role, jobProfile, userProfile } = data;
  
  try {
    const aiService = await getAIService();
    
    const prompt = `Generate interview questions for ${company} ${role} position.

Job Requirements:
- Required Skills: ${jobProfile?.requiredSkills?.join(', ') || 'Not provided'}
- Technologies: ${jobProfile?.technologies?.join(', ') || 'Not provided'}
- Interview Topics: ${jobProfile?.interviewTopics?.join(', ') || 'Not provided'}

User Background:
- Skills: ${userProfile?.skills?.join(', ') || 'Not provided'}
- Experience: ${userProfile?.experience?.join(', ') || 'Not provided'}

Generate 15 mixed difficulty interview questions:
- 5 easy (warm-up questions)
- 7 medium (core technical questions)
- 3 hard (advanced/deep-dive questions)

Return JSON:
{
  "questions": [
    {
      "id": "unique-id",
      "question": "Question text?",
      "category": "technical|behavioral|system-design",
      "difficulty": "easy|medium|hard",
      "expectedAnswer": "Brief answer guide",
      "followUpQuestions": ["follow-up 1", "follow-up 2"]
    }
  ]
}

Only return valid JSON.`;

    const response = await aiService.complete(prompt);
    
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return result;
    }
    
    // Fallback
    return {
      questions: []
    };
  } catch (error: any) {
    console.error('[generateInterviewSession] Error:', error.message);
    throw new Error('Failed to generate interview session: ' + error.message);
  }
}

/**
 * Helper: Generate basic calendar events
 */
function generateBasicCalendarEvents(company: string, role: string, days: number, startDate: Date) {
  const events = [];
  for (let i = 0; i < Math.min(12, days); i++) {
    const eventDate = new Date(startDate);
    eventDate.setDate(eventDate.getDate() + i);
    
    events.push({
      title: `Day ${i + 1} - Interview Prep`,
      date: eventDate.toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '11:00',
      description: `Prepare for ${company} ${role} interview`,
      location: 'Online',
      reminder: 30
    });
  }
  return events;
}
