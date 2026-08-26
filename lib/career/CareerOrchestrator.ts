/**
 * Career Orchestrator
 * 
 * Coordinates Career Agent execution
 * Handles scheduling, state management, and recovery
 */

import type { CareerMission, PreparationTask } from '@/modules/career/career.types';
import * as careerRepository from '@/modules/career/career.repository';
import { CareerAgent } from './CareerAgent';

export class CareerOrchestrator {
  /**
   * Resume Unfinished Missions
   * Called on server start to recover interrupted tasks
   */
  static async resumeUnfinishedMissions(): Promise<void> {
    console.log('🔄 [Career Orchestrator] Checking for unfinished missions...');
    
    // Find all missions in non-final states
    // Note: We use a special query to find all active missions
    // In production, this would query all users' active missions
    // For now, we'll handle this in the API layer
    console.log('🔄 [Career Orchestrator] Auto-recovery will be handled per-user via API');
  }
  
  /**
   * Resume Single Mission
   */
  static async resumeMission(missionId: string, userId: string): Promise<void> {
    const agent = new CareerAgent(missionId, userId);
    
    try {
      await careerRepository.updateMission(missionId, { status: 'RESUMING' });
      await agent.startMission();
    } catch (error: any) {
      console.error(`Mission ${missionId} resume failed:`, error);
      await careerRepository.updateMission(missionId, { 
        status: 'CANCELLED',
        progress: 0
      });
    }
  }
  
  /**
   * Execute Daily Tasks
   * Called by scheduler to run today's preparation tasks
   */
  static async executeDailyTasks(userId: string): Promise<void> {
    const today = new Date();
    const tasks = await careerRepository.findTasksByDate(userId, today);
    
    for (const task of tasks) {
      if (task.status === 'pending') {
        await this.executeTask(task);
      }
    }
  }
  
  /**
   * Execute Single Task
   */
  static async executeTask(task: PreparationTask): Promise<void> {
    try {
      await careerRepository.updateTask(task.id as any as string, {
        status: 'running',
        startedAt: new Date()
      });
      
      // Task execution logic based on type
      await this.runTaskByType(task);
      
      await careerRepository.updateTask(task.id as any as string, {
        status: 'completed',
        completedAt: new Date()
      });
      
      // Update mission progress
      await this.updateMissionProgress(task.missionId as any as string);
      
    } catch (error: any) {
      await careerRepository.updateTask(task.id as any as string, {
        status: 'failed',
        failedAt: new Date(),
        error: error.message
      });
    }
  }
  
  /**
   * Run Task By Type
   */
  private static async runTaskByType(task: PreparationTask): Promise<void> {
    // Import adapters as needed
    const { teacherAdapter } = await import('./adapters/teacherAdapter');
    const { interviewAdapter } = await import('./adapters/interviewAdapter');
    const { telegramAdapter } = await import('./adapters/telegramAdapter');
    
    switch (task.type) {
      case 'teacher':
        await teacherAdapter.startTeachingSession({
          userId: task.id as any as string,
          topic: task.topic || '',
          subject: 'Career Preparation'
        });
        break;
        
      case 'interview':
        await interviewAdapter.createInterviewPrep({
          missionId: task.missionId as any as string,
          userId: task.id as any as string,
          jobProfile: task.result?.jobProfile || {},
          skillGaps: [],
          company: '',
          role: ''
        });
        break;
        
      case 'telegram':
        await telegramAdapter.sendNotification({
          userId: task.id as any as string,
          message: task.result?.message || 'Career preparation reminder'
        });
        break;
        
      // Add more task types as needed
      default:
        console.warn(`Task type ${task.type} not implemented`);
    }
  }
  
  /**
   * Update Mission Progress
   */
  private static async updateMissionProgress(missionId: string): Promise<void> {
    const tasks = await careerRepository.findTasksByMission(missionId);
    
    if (tasks.length === 0) return;
    
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const progress = Math.round((completedTasks / tasks.length) * 100);
    
    await careerRepository.updateMission(missionId, { progress });
    
    // If all tasks complete, mark mission as completed
    if (progress === 100) {
      await careerRepository.updateMission(missionId, {
        status: 'COMPLETED',
        completedAt: new Date()
      });
    }
  }
  
  /**
   * Generate Daily Plan
   * Creates tasks for today's preparation
   */
  static async generateDailyPlan(missionId: string): Promise<PreparationTask[]> {
    const mission = await careerRepository.findMissionById(missionId);
    
    if (!mission) {
      throw new Error('Mission not found');
    }
    
    // Calculate what needs to be done today
    const tasks: PreparationTask[] = [];
    
    // Add tasks based on mission progress and profile
    // This would use the job profile and skill gaps to prioritize
    
    return tasks;
  }
}

/**
 * Initialize Career Orchestrator
 * Call this on server start
 */
export async function initializeCareerOrchestrator(): Promise<void> {
  console.log('🚀 [Career Orchestrator] Initializing...');
  
  // Resume any unfinished missions
  await CareerOrchestrator.resumeUnfinishedMissions();
  
  // Setup scheduled checks (would use cron or similar)
  // For now, manual triggering
  
  console.log('✅ [Career Orchestrator] Initialized');
}
