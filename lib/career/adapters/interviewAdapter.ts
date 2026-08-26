/**
 * Interview Adapter
 * 
 * Uses existing Interview system (modules/interviews)
 * Creates interview preparation sessions
 */

import capabilityManager from '@/lib/capabilityManager';
import type { JobProfile, SkillGap } from '@/modules/career/career.types';

export const interviewAdapter = {
  /**
   * Create Interview Prep
   * Generates interview preparation using existing Interview system
   */
  async createInterviewPrep(params: {
    missionId: string;
    userId: string;
    jobProfile: JobProfile;
    skillGaps: SkillGap[];
    company: string;
    role: string;
  }): Promise<any> {
    const { missionId, userId, jobProfile, skillGaps, company, role } = params;
    
    // Interview creation doesn't require special permission
    // Uses existing Interview module
    
    // Prepare interview data for existing Interview system
    const interviewData = {
      role,
      type: 'Technical',
      level: 'Intermediate',
      techstack: jobProfile.technologies,
      userId: userId,
      jobDescription: jobProfile.jobDescription,
      questions: generateInterviewQuestions(jobProfile, skillGaps),
      finalized: false,
      coverImage: '/images/interview-default.png'
    };
    
    return {
      type: 'interview_preparation',
      status: 'created',
      company,
      role,
      totalQuestions: interviewData.questions.length,
      categories: [
        'Technical',
        'Behavioral', 
        'Coding',
        'System Design'
      ],
      data: interviewData,
      message: 'Interview preparation ready. Open Interview App to practice.'
    };
  }
};

/**
 * Generate Interview Questions
 * Creates structured question bank
 */
function generateInterviewQuestions(
  jobProfile: JobProfile, 
  skillGaps: SkillGap[]
): any[] {
  const questions = [];
  
  // Technical questions
  jobProfile.interviewTopics.forEach((topic, idx) => {
    questions.push({
      id: `tech-${idx}`,
      text: `Explain your experience with ${topic}`,
      type: 'regular',
      category: 'technical',
      difficulty: 'medium',
      skills: [topic],
      evaluationCriteria: [
        'Clear explanation',
        'Real-world examples',
        'Depth of knowledge'
      ]
    });
  });
  
  // Coding questions
  jobProfile.codingTopics.forEach((topic, idx) => {
    questions.push({
      id: `coding-${idx}`,
      text: `Implement a solution for: ${topic}`,
      type: 'coding',
      category: 'coding',
      difficulty: 'medium',
      skills: [topic],
      language: detectLanguage(jobProfile),
      starterCode: `// Implement your solution for: ${topic}\n\nfunction solution() {\n  // Your code here\n}`,
      evaluationCriteria: [
        'Correctness',
        'Time complexity',
        'Code quality',
        'Edge cases'
      ]
    });
  });
  
  // Behavioral questions
  jobProfile.softSkills.forEach((skill, idx) => {
    questions.push({
      id: `behavioral-${idx}`,
      text: `Tell me about a time when you demonstrated ${skill}`,
      type: 'regular',
      category: 'behavioral',
      difficulty: 'easy',
      skills: [skill],
      evaluationCriteria: [
        'STAR method',
        'Clear structure',
        'Relevant example',
        'Outcome focused'
      ]
    });
  });
  
  // Resume-based questions
  if (skillGaps.length > 0) {
    skillGaps.forEach((gap, idx) => {
      if (gap.status === 'strong') {
        questions.push({
          id: `resume-${idx}`,
          text: `Tell me about your experience with ${gap.skill}`,
          type: 'regular',
          category: 'resume',
          difficulty: 'medium',
          skills: [gap.skill],
          evaluationCriteria: [
            'Specific examples',
            'Project details',
            'Impact achieved'
          ]
        });
      }
    });
  }
  
  return questions;
}

/**
 * Detect programming language from job profile
 */
function detectLanguage(jobProfile: JobProfile): string {
  const techStack = jobProfile.technologies.map(t => t.toLowerCase());
  
  if (techStack.includes('python')) return 'python';
  if (techStack.includes('javascript') || techStack.includes('typescript')) return 'javascript';
  if (techStack.includes('java')) return 'java';
  if (techStack.includes('c++') || techStack.includes('cpp')) return 'cpp';
  if (techStack.includes('go')) return 'go';
  if (techStack.includes('rust')) return 'rust';
  
  return 'javascript'; // Default
}
