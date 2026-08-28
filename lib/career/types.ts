import { ObjectId } from 'mongodb';

export interface CareerPlan {
  _id?: ObjectId;
  missionId: ObjectId;
  userId: string;
  
  // Overall plan status
  status: 'planning' | 'in_progress' | 'completed' | 'cancelled';
  overallProgress: number; // 0-100
  
  // Steps
  steps: PlanStep[];
  
  // Generated content
  generatedNotes?: {
    title: string;
    content: string;
    sections: {
      companyResearch: string;
      roleAnalysis: string;
      technicalPrep: string;
      behavioralPrep: string;
      systemDesign: string;
    };
  };
  
  calendarEvents?: {
    prepSession1?: Date;
    prepSession2?: Date;
    prepSession3?: Date;
    mockInterview?: Date;
    finalReview?: Date;
  };
  
  learningResources?: {
    topics: string[];
    courses: string[];
    practiceProblems: string[];
    focusAreas: string[];
  };
  
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number; // 0-100
  order: number;
  
  // Specific step data
  stepType: 'analyze_profile' | 'generate_notes' | 'schedule_sessions' | 'setup_learning' | 'mock_interview';
  
  // Execution details
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  
  // Step output
  output?: any;
}

export const CAREER_PLAN_STEPS: Omit<PlanStep, 'id' | 'status' | 'progress' | 'startedAt' | 'completedAt' | 'error' | 'output'>[] = [
  {
    order: 1,
    stepType: 'analyze_profile',
    name: 'Analyze Profile & Job Description',
    description: 'AI analyzing your resume, skills, and job requirements to create personalized prep plan'
  },
  {
    order: 2,
    stepType: 'generate_notes',
    name: 'Generate Interview Notes',
    description: 'Creating comprehensive study notes based on company, role, and your weaknesses'
  },
  {
    order: 3,
    stepType: 'schedule_sessions',
    name: 'Schedule Preparation Sessions',
    description: 'Setting up calendar events for study sessions, practice, and mock interviews'
  },
  {
    order: 4,
    stepType: 'setup_learning',
    name: 'Setup Learning Resources',
    description: 'Configuring personalized learning materials and practice problems'
  },
  {
    order: 5,
    stepType: 'mock_interview',
    name: 'Prepare Mock Interview',
    description: 'Setting up AI mock interview session tailored to the role'
  }
];
