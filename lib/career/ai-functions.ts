/**
 * Career AI Business Logic Functions
 * 
 * These functions can be called directly from server-side code (executor)
 * or via HTTP API routes (frontend calls).
 * 
 * NO authentication required - these are pure business logic functions
 */

import { createMeteredAIService } from '@/lib/ai/metered';

/**
 * Extract Job Profile and Compare with User Profile
 */
export async function extractJobProfileDirect(data: {
  userId: string;
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
    const aiService = createMeteredAIService(data.userId, { source: 'career', feature: 'job-profile' });
    
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
  userId: string;
  company: string;
  role: string;
  jobProfile: any;
  userProfile: any;
  skillGaps: any[];
}) {
  const { company, role, jobProfile, userProfile, skillGaps } = data;
  
  try {
    const aiService = createMeteredAIService(data.userId, { source: 'career', feature: 'notes-generation' });
    
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

Make every note an easy-to-scan learning artifact using this exact content order:
## Quick summary
- 3 concise bullets with the most important facts or actions
## Why this matters
A short explanation tied to the ${company} ${role} interview
## Core concepts
Clear explanations with useful subheadings, tables, or code examples where relevant
## Interview-ready examples
Specific examples, sample answers, or talking points personalized to the user profile
## Action checklist
- [ ] 3 to 6 concrete preparation steps
## Key takeaways
- 3 memorable closing bullets

Keep the writing practical and specific, explain unfamiliar terms, and avoid generic filler. Do not repeat the note title as a Markdown H1 because the Notes app renders the title separately.

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
        content: `## Quick summary\n- Prepare examples that connect your experience to the ${role} role.\n- Prioritize the required skills from the job description.\n- Practice explaining your decisions clearly and concisely.\n\n## Why this matters\nFocused preparation helps you show ${company} how your experience maps to the role.\n\n## Action checklist\n- [ ] Review the job requirements\n- [ ] Prepare three experience stories\n- [ ] Practice role-specific questions\n\n## Key takeaways\n- Be specific.\n- Use evidence from your work.\n- Connect every answer to the role.`,
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
  userId: string;
  company: string;
  role: string;
  jobProfile: any;
  userProfile: any;
  skillGaps: any[];
  interviewDate: string;
  startDate: string;
  daysUntilInterview: number;
  eventCount: number;
}) {
  const { company, role, jobProfile, userProfile, skillGaps, interviewDate, startDate, daysUntilInterview, eventCount } = data;
  
  try {
    const aiService = createMeteredAIService(data.userId, { source: 'career', feature: 'calendar-generation' });
    
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

Generate exactly ${eventCount} focused calendar events for this ${daysUntilInterview}-day window. Do not add filler tasks. Each event should be 45-90 minutes long.

Return JSON array:
{
  "events": [
    {
      "title": "Day 1 - Topic Name",
      "taskType": "teacher|interview|coding|notes|calendar",
      "openIn": ["notes|ai-book|interview|vscode|teacher|youtube|career"],
      "date": "YYYY-MM-DD",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "description": "What to study/practice",
      "location": "Online",
      "reminder": 10
    }
  ]
}

Choose the taskType from the allowed values. openIn must contain one or more allowed app targets that fit the task. A task may open in multiple apps; for example, a concept review can use ["notes", "ai-book", "teacher", "career"], and coding practice can use ["vscode", "notes", "career"]. Always include "career".

Only return valid JSON.`;

    const response = await aiService.complete(prompt);
    
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return result;
    }
    
    // Fallback: Basic events
    return {
      events: generateBasicCalendarEvents(company, role, eventCount, new Date(startDate))
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
  userId: string;
  company: string;
  role: string;
  jobProfile: any;
  userProfile: any;
  skillGaps: any[];
  daysUntilInterview: number;
}) {
  const { company, role, jobProfile, userProfile, skillGaps, daysUntilInterview } = data;
  
  try {
    const aiService = createMeteredAIService(data.userId, { source: 'career', feature: 'learning-plan' });
    
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
      "language": "javascript|typescript|jsx|tsx|html|python|java|sql|mongodb",
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
  userId: string;
  company: string;
  role: string;
  jobProfile: any;
  userProfile: any;
}) {
  const { company, role, jobProfile, userProfile } = data;
  
  try {
    const aiService = createMeteredAIService(data.userId, { source: 'career', feature: 'interview-session' });
    
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
      try {
        const result = JSON.parse(jsonMatch[0]);
        if (Array.isArray(result.questions) && result.questions.length > 0) {
          return result;
        }
      } catch (error: any) {
        console.warn('[generateInterviewSession] Invalid AI JSON, using fallback:', error.message);
      }
    }
    
    return {
      questions: generateBasicInterviewQuestions(company, role, jobProfile)
    };
  } catch (error: any) {
    console.error('[generateInterviewSession] Error:', error.message);
    throw new Error('Failed to generate interview session: ' + error.message);
  }
}

/**
 * Helper: Generate basic calendar events
 */
function generateBasicCalendarEvents(company: string, role: string, eventCount: number, startDate: Date) {
  const events = [];
  for (let i = 0; i < eventCount; i++) {
    const eventDate = new Date(startDate);
    eventDate.setDate(eventDate.getDate() + i);
    
    events.push({
      title: `Day ${i + 1} - Interview Prep`,
      taskType: i % 2 === 0 ? 'coding' : 'calendar',
      openIn: i % 2 === 0 ? ['vscode', 'notes', 'career'] : ['ai-book', 'teacher', 'career'],
      date: eventDate.toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '11:00',
      description: `Prepare for ${company} ${role} interview`,
      location: 'Online',
      reminder: 10
    });
  }
  return events;
}

function generateBasicInterviewQuestions(company: string, role: string, jobProfile: any) {
  const topics = [
    ...(jobProfile?.interviewTopics || []),
    ...(jobProfile?.requiredSkills || []),
    ...(jobProfile?.technologies || [])
  ].filter((topic, index, allTopics) => topic && allTopics.indexOf(topic) === index);
  const focusTopics = topics.length > 0 ? topics : [role, 'problem solving', 'system design'];

  return Array.from({ length: 15 }, (_, index) => {
    const topic = focusTopics[index % focusTopics.length];
    const difficulty = index < 5 ? 'easy' : index < 12 ? 'medium' : 'hard';
    const category = index >= 12 ? 'system-design' : index % 4 === 3 ? 'behavioral' : 'technical';

    return {
      id: `fallback-${index + 1}`,
      question: category === 'behavioral'
        ? `Describe a situation where you applied ${topic} to solve a difficult problem.`
        : category === 'system-design'
          ? `How would you design and scale a ${topic} solution for ${company}?`
          : `Explain ${topic} and how you would apply it as a ${role}.`,
      category,
      difficulty,
      expectedAnswer: `Cover the core principles of ${topic}, practical tradeoffs, and a concrete example relevant to ${company}.`,
      followUpQuestions: [
        `What tradeoffs would you consider when using ${topic}?`,
        `How would you test or validate your approach?`
      ]
    };
  });
}
