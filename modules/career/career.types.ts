/**
 * Career Agent Types
 * 
 * Core data structures for Career Agent orchestration
 */

export type CareerMissionStatus = 
  | 'CREATED'
  | 'ANALYZING'
  | 'PLANNING'
  | 'WAITING_FOR_PERMISSION'
  | 'READY'
  | 'EXECUTING'
  | 'WAITING_FOR_USER'
  | 'RESUMING'
  | 'COMPLETED'
  | 'CANCELLED';

export type TaskStatus = 
  | 'pending'
  | 'running'
  | 'waiting_permission'
  | 'waiting_user'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type TaskType = 
  | 'teacher'
  | 'interview'
  | 'coding'
  | 'youtube'
  | 'notes'
  | 'calendar'
  | 'telegram'
  | 'mail'
  | 'resume';

export type CareerTaskOpenTarget = 'notes' | 'ai-book' | 'interview' | 'vscode' | 'teacher' | 'youtube' | 'career';

export interface JobProfile {
  company: string;
  role: string;
  experienceLevel?: string;
  
  requiredSkills: string[];
  preferredSkills: string[];
  technologies: string[];
  responsibilities: string[];
  
  interviewTopics: string[];
  codingTopics: string[];
  softSkills: string[];
  
  jobDescription?: string;
  jobDescriptionUrl?: string;
  
  extractedAt: Date;
}

export interface SkillGap {
  skill: string;
  status: 'strong' | 'needs_improvement' | 'missing';
  priority: 'high' | 'medium' | 'low';
  evidence?: string;
}

export interface CareerMission {
  id: string;
  userId: string;
  
  // Core Info
  company: string;
  role: string;
  jobDescription?: string;
  jobProfile?: JobProfile;
  
  // Timeline
  interviewDate?: Date;
  applicationDeadline?: Date;
  
  // Resume
  resumeVersion?: string;
  skillGaps?: SkillGap[];
  
  // Planning
  preparationPlan?: PreparationPlan;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // State
  status: CareerMissionStatus;
  progress: number; // 0-100
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface PreparationTask {
  id: string;
  missionId: string;
  userId: string;
  
  type: TaskType;
  openIn?: CareerTaskOpenTarget[];
  title: string;
  description?: string;
  
  scheduledDate: Date;
  duration?: number; // minutes
  
  status: TaskStatus;
  
  // Task-specific data
  topic?: string;
  subtasks?: string[];
  
  // Execution tracking
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  
  // Results
  result?: any;
  error?: string;
  
  // Retry logic
  retryCount: number;
  maxRetries: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface PreparationPlan {
  missionId: string;
  
  totalDays: number;
  dailySchedule: DailySchedule[];
  
  estimatedHours: number;
  focusAreas: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface DailySchedule {
  day: number;
  date: Date;
  
  tasks: PreparationTask[];
  
  totalHours: number;
  focusAreas: string[];
  
  completed: boolean;
}

export interface CareerContext {
  mission: CareerMission;
  userProfile?: any;
  resume?: any;
  jobProfile?: JobProfile;
  progress: number;
  upcomingEvents: any[];
  weakAreas: string[];
  completedTasks: string[];
}

export interface CareerAgentLog {
  id: string;
  missionId: string;
  userId: string;
  
  timestamp: Date;
  action: string;
  details?: string;
  
  status: 'started' | 'in_progress' | 'completed' | 'failed' | 'waiting';
  
  metadata?: Record<string, any>;
}
