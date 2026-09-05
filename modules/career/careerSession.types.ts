/**
 * Career Session Types
 * 
 * Persistent conversation state for Career Agent
 */

export type CareerSessionStatus = 
  | 'collecting'      // Gathering information from user
  | 'confirming'      // Asking for confirmation
  | 'created'         // Mission created, session complete
  | 'running'         // Mission is actively running
  | 'completed'       // Mission completed
  | 'cancelled';      // Session cancelled

export type CareerSessionState = 
  | 'COLLECTING_COMPANY'
  | 'COLLECTING_ROLE'
  | 'COLLECTING_INTERVIEW_DATE'
  | 'OPTIONAL_JOB_DESCRIPTION'
  | 'CONFIRMING'
  | 'CREATE_MISSION'
  | 'RUNNING';

export interface CareerSessionDraft {
  company?: string;
  role?: string;
  interviewDate?: Date;
  jobDescription?: string;
  resumeId?: string;
}

export interface CareerSessionConversation {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface CareerSession {
  id: string;
  userId: string;
  
  // Session state
  status: CareerSessionStatus;
  state: CareerSessionState;
  
  // Draft mission data
  draft: CareerSessionDraft;
  
  // Missing fields (server-managed)
  missingFields: string[];
  
  // Current question being asked
  currentQuestion?: string;
  
  // Full conversation history
  conversation: CareerSessionConversation[];
  
  // Linked mission (after creation)
  missionId?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

/**
 * Structured AI Response
 * NEVER parse natural language to determine actions
 */
export interface StructuredCareerResponse {
  message: string;
  extracted: {
    company?: string;
    role?: string;
    interviewDate?: Date;
    jobDescription?: string;
  };
  nextField: string | null;
  shouldCreateMission: boolean;
  missionId?: string;
  state: CareerSessionState;
}

/**
 * Career Mission (created after session completes)
 */
export interface CareerMissionCreate {
  userId: string;
  company: string;
  role: string;
  interviewDate: Date;
  jobDescription?: string;
  status: 'created';
  objectives: string[];
  tasks: any[];
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}
