/**
 * Career Scheduler
 * 
 * Background job scheduler for Career Agent
 * Handles daily planning, reminders, and progress tracking
 */

import { findActiveMissions, updateMission } from '@/modules/career/career.repository';
import { telegramAdapter, formatCareerUpdate } from './adapters/telegramAdapter';

export class CareerScheduler {
  private static instance: CareerScheduler;
  private intervalId: NodeJS.Timeout | null = null;
  
  static getInstance(): CareerScheduler {
    if (!CareerScheduler.instance) {
      CareerScheduler.instance = new CareerScheduler();
    }
    return CareerScheduler.instance;
  }
  
  /**
   * Start Scheduler
   * Runs daily checks for all active missions
   */
  start(): void {
    console.log('⏰ [Career Scheduler] Starting...');
    
    // Run every hour
    this.intervalId = setInterval(() => {
      this.runDailyChecks().catch(err => {
        console.error('Career Scheduler error:', err);
      });
    }, 60 * 60 * 1000); // 1 hour
    
    // Also run immediately
    this.runDailyChecks().catch(err => {
      console.error('Initial Career Scheduler run failed:', err);
    });
    
    console.log('✅ [Career Scheduler] Started');
  }
  
  /**
   * Stop Scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 [Career Scheduler] Stopped');
    }
  }
  
  /**
   * Run Daily Checks
   */
  private async runDailyChecks(): Promise<void> {
    console.log('📅 [Career Scheduler] Running daily checks...');
    
    try {
      // Note: In production, this would query all active missions
      // For now, we'll handle this through user-specific API calls
      console.log('📅 [Career Scheduler] Daily checks will be handled per-user via API');
      
    } catch (error) {
      console.error('Daily check failed:', error);
    }
  }
  
  /**
   * Check Mission Progress
   */
  private async checkMissionProgress(mission: any): Promise<void> {
    if (!mission.interviewDate) return;
    
    const now = new Date();
    const interviewDate = new Date(mission.interviewDate);
    const daysUntilInterview = Math.ceil(
      (interviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Send notifications
    await this.sendNotifications(mission, daysUntilInterview);
    
    // Update progress
    await this.updateProgress(mission, daysUntilInterview);
  }
  
  /**
   * Send Notifications
   */
  private async sendNotifications(mission: any, daysUntil: number): Promise<void> {
    // Check if we should send notification
    const now = new Date();
    const lastNotification = mission.lastNotificationAt 
      ? new Date(mission.lastNotificationAt)
      : null;
    
    // Send notification once per day
    if (!lastNotification || (now.getTime() - lastNotification.getTime()) > 24 * 60 * 60 * 1000) {
      const message = formatCareerUpdate({
        company: mission.company,
        role: mission.role,
        daysUntilInterview: daysUntil,
        progress: mission.progress
      });
      
      await telegramAdapter.sendNotification({
        userId: mission.userId,
        message
      });
      
      // Update last notification time
      await updateMission(mission.id as any as string, {
        lastNotificationAt: now
      });
    }
  }
  
  /**
   * Update Progress
   */
  private async updateProgress(mission: any, daysUntil: number): Promise<void> {
    // Auto-progress based on timeline
    if (mission.interviewDate) {
      const createdDate = new Date(mission.createdAt);
      const interviewDate = new Date(mission.interviewDate);
      
      const totalDays = Math.ceil(
        (interviewDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      const daysPassed = Math.ceil(
        (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      const expectedProgress = Math.min(100, Math.round((daysPassed / totalDays) * 100));
      
      // Update progress if it's behind
      if (mission.progress < expectedProgress - 10) {
        await updateMission(mission.id as any as string, {
          progress: expectedProgress
        });
      }
    }
    
    // Mark as completed if interview date passed
    if (daysUntil <= 0) {
      await updateMission(mission.id as any as string, {
        status: 'COMPLETED',
        completedAt: new Date()
      });
    }
  }
}

/**
 * Initialize Career Scheduler
 */
export function startCareerScheduler(): void {
  const scheduler = CareerScheduler.getInstance();
  scheduler.start();
}

/**
 * Stop Career Scheduler
 */
export function stopCareerScheduler(): void {
  const scheduler = CareerScheduler.getInstance();
  scheduler.stop();
}
