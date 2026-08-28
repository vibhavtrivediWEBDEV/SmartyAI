import * as careerPlanRepo from '@/modules/career/career-plan.repository';
import type { PlanStep } from '@/lib/career/types';
import { getUserAIContextById } from '@/lib/ai/userAIContext.server';
import { ObjectId } from 'mongodb';
import {
  extractJobProfileDirect,
  generateNotesDirect,
  generateCalendarEventsDirect,
  generateLearningPlanDirect,
  generateInterviewSessionDirect
} from './ai-functions';

interface ExecutionContext {
  planId: string;
  missionId: string;
  userId: string;
  company?: string;
  role?: string;
  jobDescription?: string;
  interviewDate?: Date;
  jobProfile?: any;
  userProfile?: any;
}

export class CareerPlanExecutor {
  /**
   * Execute a specific step in the career plan
   */
  async executeStep(stepId: string, planId: string, context: ExecutionContext): Promise<any> {
    // Get the plan
    const plan = await careerPlanRepo.findPlanById(planId);
    
    if (!plan) {
      throw new Error('Plan not found');
    }
    
    const step = plan.steps.find((s: PlanStep) => s.id === stepId);
    if (!step) {
      throw new Error('Step not found');
    }
    
    console.log(`[CareerPlanExecutor] Executing step: ${step.name}`);
    
    try {
      // Mark step as in progress
      await careerPlanRepo.updatePlanStep(planId, stepId, {
        status: 'in_progress',
        progress: 10
      });
      
      let output: any;
      
      // Execute based on step type - USE AI POWERED FUNCTIONS
      switch (step.stepType) {
        case 'analyze_profile':
          output = await this.executeAnalyzeProfile(context);
          break;
        case 'generate_notes':
          output = await this.executeGenerateNotes(context);
          break;
        case 'schedule_sessions':
          output = await this.executeScheduleSessions(context);
          break;
        case 'setup_learning':
          output = await this.executeSetupLearning(context);
          break;
        case 'mock_interview':
          output = await this.executeMockInterview(context);
          break;
        default:
          throw new Error(`Unknown step type: ${step.stepType}`);
      }
      
      // Mark step as completed
      await careerPlanRepo.updatePlanStep(planId, stepId, {
        status: 'completed',
        progress: 100,
        output
      });
      
      return output;
    } catch (error: any) {
      // Mark step as failed
      await careerPlanRepo.updatePlanStep(planId, stepId, {
        status: 'failed',
        progress: 0,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Step 1: Analyze user profile and job description - AI POWERED
   */
  private async executeAnalyzeProfile(context: ExecutionContext): Promise<any> {
    console.log('[Step 1] Analyzing user profile with AI...');
    console.log('[Step 1] Context:', {
      userId: context.userId,
      company: context.company,
      role: context.role,
      hasJobDescription: !!context.jobDescription
    });
    
    // Use existing getUserAIContextById helper from userAIContext.ts
    let userProfileData: any = null;
    
    try {
      console.log('[Step 1] Fetching user profile using getUserAIContextById...');
      userProfileData = await getUserAIContextById(context.userId);
      console.log('[Step 1] Fetched user profile:', {
        name: userProfileData?.displayName,
        skills: userProfileData?.skills?.length || 0
      });
    } catch (error) {
      console.log('[Step 1] Warning: Failed to fetch profile, continuing without it');
    }
    
    // Call AI directly - NO HTTP NEEDED
    console.log('[Step 1] Calling AI analysis directly...');
    
    try {
      const analysisResult = await extractJobProfileDirect({
        company: context.company || '',
        role: context.role || '',
        jobDescription: context.jobDescription || '',
        userProfile: userProfileData
      });
      
      console.log('[Step 1] Analysis result received:', {
        hasJobProfile: !!analysisResult.jobProfile,
        hasSkillGaps: !!analysisResult.skillGaps,
        skillGapsCount: analysisResult.skillGaps?.length || 0
      });
      
      // Save analysis to plan
      await careerPlanRepo.updatePlan(context.planId, {
        userProfile: userProfileData || {},
        jobProfile: analysisResult.jobProfile || {},
        skillGaps: analysisResult.skillGaps || []
      } as any);
      
      return analysisResult;
    } catch (error: any) {
      console.error('[Step 1] Error during analysis:', error.message);
      console.error('[Step 1] Stack:', error.stack);
      throw error;
    }
  }
  
  /**
   * Step 2: Generate interview notes - AI POWERED
   */
  private async executeGenerateNotes(context: ExecutionContext): Promise<any> {
    console.log('[Step 2] Generating interview notes with AI...');
    
    try {
      // Call AI directly - NO HTTP NEEDED
      const notesResult = await generateNotesDirect({
        company: context.company || '',
        role: context.role || '',
        jobProfile: context.jobProfile,
        userProfile: context.userProfile,
        skillGaps: context.jobProfile?.skillGaps || []
      });
      
      // Create each note in database
      const createdNotes = [];
      for (const note of notesResult.notes || []) {
        const noteId = await careerPlanRepo.createNote({
          userId: new ObjectId(context.userId),
          title: note.title,
          content: note.content,
          category: note.category || 'career',
          tags: note.tags || ['interview']
        });
        createdNotes.push({ noteId, ...note });
      }
      
      // Save notes to plan
      await careerPlanRepo.updatePlan(context.planId, {
        generatedNotes: {
          total: createdNotes.length,
          notes: createdNotes
        }
      } as any);
      
      return { notes: createdNotes };
    } catch (error: any) {
      console.error('[Step 2] Error:', error.message);
      throw error;
    }
  }
  
  /**
   * Step 3: Schedule preparation sessions - AI POWERED
   */
  private async executeScheduleSessions(context: ExecutionContext): Promise<any> {
    console.log('[Step 3] Scheduling preparation sessions with AI...');
    
    if (!context.interviewDate) {
      throw new Error('Interview date required');
    }
    
    const startDate = new Date();
    const daysUntilInterview = Math.ceil(
      (context.interviewDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    try {
      // Call AI directly - NO HTTP NEEDED
      const eventsResult = await generateCalendarEventsDirect({
        company: context.company || '',
        role: context.role || '',
        jobProfile: context.jobProfile,
        userProfile: context.userProfile,
        skillGaps: context.jobProfile?.skillGaps || [],
        interviewDate: context.interviewDate.toISOString(),
        startDate: startDate.toISOString(),
        daysUntilInterview
      });
      
      // Create each event in calendar via API
      const createdEvents = [];
      for (const event of eventsResult.events || []) {
        try {
          const eventResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/calendar/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: event.title,
              date: event.date,
              startTime: event.startTime,
              endTime: event.endTime,
              allDay: event.allDay || false,
              description: event.description,
              location: event.location || 'Online',
              reminder: event.reminder || 30,
              source: 'career_agent'
            })
          });
          
          if (eventResponse.ok) {
            const created = await eventResponse.json();
            createdEvents.push({
              eventId: created.eventId,
              ...event
            });
          }
        } catch (error) {
          console.error('Failed to create event:', error);
        }
      }
      
      await careerPlanRepo.updatePlan(context.planId, {
        calendarEvents: {
          total: createdEvents.length,
          events: createdEvents
        }
      } as any);
      
      return { events: createdEvents };
    } catch (error: any) {
      console.error('[Step 3] Error:', error.message);
      throw error;
    }
  }
  
  /**
   * Step 4: Setup learning resources - AI POWERED
   */
  private async executeSetupLearning(context: ExecutionContext): Promise<any> {
    console.log('[Step 4] Setting up learning resources with AI...');
    
    const startDate = new Date();
    const daysUntilInterview = context.interviewDate 
      ? Math.ceil((context.interviewDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      : 7;
    
    try {
      // Call AI directly - NO HTTP NEEDED
      const learningResult = await generateLearningPlanDirect({
        company: context.company || '',
        role: context.role || '',
        jobProfile: context.jobProfile,
        userProfile: context.userProfile,
        skillGaps: context.jobProfile?.skillGaps || [],
        daysUntilInterview
      });
      
      // Create learning session
      const sessionId = await careerPlanRepo.createLearningSession({
        userId: new ObjectId(context.userId),
        topic: `${context.role} Interview Prep`,
        company: context.company,
        resources: learningResult,
        status: 'active'
      });
      
      await careerPlanRepo.updatePlan(context.planId, {
        learningResources: {
          sessionId,
          ...learningResult
        }
      } as any);
      
      return { sessionId, ...learningResult };
    } catch (error: any) {
      console.error('[Step 4] Error:', error.message);
      throw error;
    }
  }
  
  /**
   * Step 5: Setup mock interview - AI POWERED
   */
  private async executeMockInterview(context: ExecutionContext): Promise<any> {
    console.log('[Step 5] Setting up mock interview with AI...');
    
    try {
      // Call AI directly - NO HTTP NEEDED
      const interviewResult = await generateInterviewSessionDirect({
        company: context.company || '',
        role: context.role || '',
        jobProfile: context.jobProfile,
        userProfile: context.userProfile
      });
      
      // Create interview session
      const sessionId = await careerPlanRepo.createInterviewSession({
        userId: new ObjectId(context.userId),
        missionId: new ObjectId(context.missionId),
        company: context.company,
        role: context.role,
        type: 'technical',
        status: 'scheduled',
        questions: interviewResult.questions || []
      });
      
      return { sessionId, totalQuestions: interviewResult.questions?.length || 0 };
    } catch (error: any) {
      console.error('[Step 5] Error:', error.message);
      throw error;
    }
  }
}

export const careerPlanExecutor = new CareerPlanExecutor();
