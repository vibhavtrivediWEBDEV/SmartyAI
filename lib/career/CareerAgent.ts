/**
 * Career Agent - Orchestration Layer
 * 
 * RESPONSIBILITIES:
 * - Coordinate career preparation activities
 * - Call existing agents/services (Teacher, Interview, Calendar, etc.)
 * - NEVER execute automation directly
 * - Pass through Capability Manager for permissions
 * 
 * ARCHITECTURE:
 * User → CareerAgent → Existing Agents/Services → CapabilityManager → Execution
 */

import type { 
  CareerMission, 
  JobProfile, 
  SkillGap,
  PreparationTask,
  CareerContext 
} from '@/modules/career/career.types';
import * as careerRepository from '@/modules/career/career.repository';

// Import existing adapters (we'll create these next)
import { calendarAdapter } from './adapters/calendarAdapter';
import { notesAdapter } from './adapters/notesAdapter';
import { interviewAdapter } from './adapters/interviewAdapter';
import { teacherAdapter } from './adapters/teacherAdapter';
import { vscodeAdapter } from './adapters/vscodeAdapter';
import { telegramAdapter } from './adapters/telegramAdapter';
import { youtubeAdapter } from './adapters/youtubeAdapter';
import { atsAdapter } from './adapters/atsAdapter';
import { mailAdapter } from './adapters/mailAdapter';

export class CareerAgent {
  private missionId: string;
  private userId: string;
  private mission: CareerMission | null = null;
  
  constructor(missionId: string, userId: string) {
    this.missionId = missionId;
    this.userId = userId;
  }
  
  // ============================================
  // CORE ORCHESTRATION METHODS
  // ============================================
  
  /**
   * Start Career Mission
   * Analyzes JD, extracts job profile, creates preparation plan
   */
  async startMission(): Promise<void> {
    await this.loadMission();
    
    if (!this.mission) {
      throw new Error('Mission not found');
    }
    
    await this.log('Career Agent started', 'Mission initialization');
    
    try {
      // Phase 1: Analyze Job Description
      await this.updateStatus('ANALYZING');
      const jobProfile = await this.analyzeJobDescription();
      
      // Phase 2: Analyze Resume vs JD
      const skillGaps = await this.analyzeSkillGaps(jobProfile);
      
      // Phase 3: Create Preparation Plan
      await this.updateStatus('PLANNING');
      const plan = await this.createPreparationPlan(jobProfile, skillGaps);
      
      // Phase 4: Execute initial setup
      await this.updateStatus('EXECUTING');
      await this.executeInitialSetup(jobProfile, skillGaps);
      
      // Phase 5: Ready for ongoing execution
      await this.updateStatus('READY');
      await this.log('Mission ready', 'Preparation plan activated');
      
    } catch (error: any) {
      await this.log('Mission failed', error.message, 'failed');
      await this.updateStatus('CANCELLED');
      throw error;
    }
  }
  
  /**
   * Analyze Job Description
   * Uses AI to extract structured job profile
   */
  private async analyzeJobDescription(): Promise<JobProfile> {
    await this.log('Analyzing job description', 'Extracting job requirements');
    
    if (!this.mission?.jobDescription) {
      throw new Error('No job description provided');
    }
    
    // Call AI service to extract structured data
    const jobProfile = await this.callAIService('extract_job_profile', {
      jobDescription: this.mission.jobDescription,
      company: this.mission.company,
      role: this.mission.role
    });
    
    // Update mission with job profile
    await careerRepository.updateMission(this.missionId, {
      jobProfile
    });
    
    await this.log('Job profile extracted', `${jobProfile.requiredSkills.length} required skills found`);
    
    return jobProfile;
  }
  
  /**
   * Analyze Skill Gaps
   * Compare user's resume against job requirements
   */
  private async analyzeSkillGaps(jobProfile: JobProfile): Promise<SkillGap[]> {
    await this.log('Analyzing resume', 'Comparing against job requirements');
    
    // Get user's resume
    const resume = await this.getUserResume();
    
    if (!resume) {
      await this.log('No resume found', 'Cannot analyze skill gaps', 'waiting');
      return [];
    }
    
    // Use ATS adapter to analyze gaps
    const skillGaps = await atsAdapter.analyzeGaps(resume, jobProfile);
    
    // Update mission with skill gaps
    await careerRepository.updateMission(this.missionId, {
      skillGaps
    });
    
    await this.log('Skill gaps identified', `${skillGaps.filter(g => g.status === 'missing').length} missing skills`);
    
    return skillGaps;
  }
  
  /**
   * Create Preparation Plan
   * Generate daily tasks based on job profile and timeline
   */
  private async createPreparationPlan(
    jobProfile: JobProfile, 
    skillGaps: SkillGap[]
  ): Promise<any> {
    await this.log('Creating preparation plan', 'Generating daily schedule');
    
    // Calculate days until interview
    const daysUntilInterview = this.mission?.interviewDate
      ? Math.max(1, Math.ceil(
          (new Date(this.mission.interviewDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        ))
      : 7;
    
    // Call AI to generate plan
    const plan = await this.callAIService('generate_preparation_plan', {
      jobProfile,
      skillGaps,
      daysUntilInterview,
      startDate: new Date(),
      interviewDate: this.mission?.interviewDate
    });
    
    await this.log('Preparation plan created', `${plan.totalDays} days scheduled`);
    
    return plan;
  }
  
  /**
   * Execute Initial Setup
   * Create calendar events, notes, initial tasks
   */
  private async executeInitialSetup(
    jobProfile: JobProfile, 
    skillGaps: SkillGap[]
  ): Promise<void> {
    await this.log('Executing initial setup', 'Creating calendar events, notes, and tasks');
    
    try {
      // 1. Create Calendar Schedule
      await this.createCalendarSchedule(jobProfile);
      
      // 2. Create Interview Notes
      await this.createInterviewNotes(jobProfile, skillGaps);
      
      // 3. Create YouTube Learning Playlist
      await this.createLearningPlaylist(jobProfile);
      
      // 4. Setup Coding Practice
      await this.setupCodingPractice(jobProfile);
      
      // 5. Generate Interview Questions
      await this.generateInterviewPrep(jobProfile, skillGaps);
      
      await this.log('Initial setup completed', 'All systems prepared');
      
    } catch (error: any) {
      await this.log('Setup failed', error.message, 'failed');
      // Continue even if some parts fail
    }
  }
  
  // ============================================
  // COORDINATION METHODS (Use Existing Adapters)
  // ============================================
  
  /**
   * Create Calendar Schedule
   * Uses existing Calendar adapter
   */
  private async createCalendarSchedule(jobProfile: JobProfile): Promise<void> {
    await this.log('Creating calendar schedule', 'Setting up preparation timeline');
    
    try {
      // Use Calendar Adapter (goes through Capability Manager)
      const events = await calendarAdapter.createPreparationSchedule({
        missionId: this.missionId,
        userId: this.userId,
        jobProfile,
        interviewDate: this.mission?.interviewDate
      });
      
      await this.log('Calendar events created', `${events.length} events scheduled`);
      
    } catch (error: any) {
      await this.log('Calendar creation failed', error.message, 'failed');
    }
  }
  
  /**
   * Create Interview Notes
   * Uses existing Notes system
   */
  private async createInterviewNotes(
    jobProfile: JobProfile, 
    skillGaps: SkillGap[]
  ): Promise<void> {
    await this.log('Creating interview notes', 'Structured notes for preparation');
    
    try {
      await notesAdapter.createInterviewNotes({
        missionId: this.missionId,
        userId: this.userId,
        company: this.mission?.company || '',
        role: this.mission?.role || '',
        jobProfile,
        skillGaps
      });
      
      await this.log('Interview notes created', 'Notes ready for review');
      
    } catch (error: any) {
      await this.log('Notes creation failed', error.message, 'failed');
    }
  }
  
  /**
   * Create YouTube Learning Playlist
   * Uses existing YouTube integration
   */
  private async createLearningPlaylist(jobProfile: JobProfile): Promise<void> {
    await this.log('Creating learning playlist', 'Finding relevant videos');
    
    const topics = [
      ...jobProfile.requiredSkills,
      ...jobProfile.codingTopics,
      ...jobProfile.interviewTopics
    ];
    
    try {
      await youtubeAdapter.createPlaylist({
        missionId: this.missionId,
        userId: this.userId,
        topics,
        title: `${this.mission?.company} ${this.mission?.role} Interview Prep`
      });
      
      await this.log('Learning playlist created', `${topics.length} topics`);
      
    } catch (error: any) {
      await this.log('YouTube playlist failed', error.message, 'failed');
    }
  }
  
  /**
   * Setup Coding Practice
   * Uses existing VS Code/Workspace system
   */
  private async setupCodingPractice(jobProfile: JobProfile): Promise<void> {
    await this.log('Setting up coding practice', 'Creating practice tasks');
    
    try {
      await vscodeAdapter.createPracticeTasks({
        missionId: this.missionId,
        userId: this.userId,
        codingTopics: jobProfile.codingTopics,
        role: this.mission?.role || ''
      });
      
      await this.log('Coding practice setup', `${jobProfile.codingTopics.length} tasks`);
      
    } catch (error: any) {
      await this.log('Coding setup failed', error.message, 'failed');
    }
  }
  
  /**
   * Generate Interview Prep
   * Uses existing Interview Agent
   */
  private async generateInterviewPrep(
    jobProfile: JobProfile, 
    skillGaps: SkillGap[]
  ): Promise<void> {
    await this.log('Generating interview prep', 'Creating questions');
    
    try {
      await interviewAdapter.createInterviewPrep({
        missionId: this.missionId,
        userId: this.userId,
        jobProfile,
        skillGaps,
        company: this.mission?.company || '',
        role: this.mission?.role || ''
      });
      
      await this.log('Interview prep created', 'Questions generated');
      
    } catch (error: any) {
      await this.log('Interview prep failed', error.message, 'failed');
    }
  }
  
  // ============================================
  // NOTIFICATION METHODS
  // ============================================
  
  /**
   * Send Telegram Notification
   * Uses existing Telegram adapter
   */
  async sendTelegramNotification(message: string): Promise<void> {
    try {
      await telegramAdapter.sendNotification({
        userId: this.userId,
        message
      });
    } catch (error: any) {
      console.error('Telegram notification failed:', error);
    }
  }
  
  // ============================================
  // HELPER METHODS
  // ============================================
  
  private async loadMission(): Promise<void> {
    this.mission = await careerRepository.findMissionById(this.missionId);
  }
  
  private async updateStatus(status: CareerMission['status']): Promise<void> {
    await careerRepository.updateMission(this.missionId, { status });
    this.mission = await careerRepository.findMissionById(this.missionId);
  }
  
  private async log(
    action: string, 
    details: string, 
    status: 'started' | 'in_progress' | 'completed' | 'failed' | 'waiting' = 'in_progress'
  ): Promise<void> {
    console.log(`📍 [Career Agent] ${action}: ${details}`);
    
    await careerRepository.logCareerAction(
      this.missionId,
      this.userId,
      action,
      details,
      status
    );
  }
  
  private async getUserResume(): Promise<any> {
    // Get from user profile
    try {
      const response = await fetch(`/api/user/profile?userId=${this.userId}`);
      if (response.ok) {
        const profile = await response.json();
        return profile?.resume;
      }
    } catch (error) {
      console.error('Failed to fetch resume:', error);
    }
    return null;
  }
  
  /**
   * Call AI Service
   * Uses existing AI infrastructure
   */
  private async callAIService(task: string, data: any): Promise<any> {
    try {
      const response = await fetch('/api/career/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task,
          data,
          missionId: this.missionId,
          userId: this.userId
        })
      });
      
      if (!response.ok) {
        throw new Error(`AI service failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('AI service error:', error);
      throw error;
    }
  }
}

// ============================================
// FACTORY FUNCTION
// ============================================

export async function createCareerMission(
  userId: string,
  company: string,
  role: string,
  jobDescription?: string,
  interviewDate?: Date
): Promise<CareerMission> {
  // Create mission in database
  const missionId = await careerRepository.createCareerMission({
    userId,
    company,
    role,
    jobDescription,
    status: 'CREATED',
    priority: 'medium',
    progress: 0,
    interviewDate
  });
  
  // Get created mission
  const mission = await careerRepository.findMissionById(missionId);
  
  if (!mission) {
    throw new Error('Failed to create mission');
  }
  
  return mission;
}

/**
 * Start Career Agent for a mission
 */
export async function startCareerAgent(missionId: string, userId: string): Promise<void> {
  const agent = new CareerAgent(missionId, userId);
  await agent.startMission();
}
