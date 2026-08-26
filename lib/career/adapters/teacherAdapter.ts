/**
 * Teacher Adapter
 * 
 * Uses existing Teacher Agent (components/TeacherAgent)
 * Coordinates through existing architecture
 */

import capabilityManager from '@/lib/capabilityManager';
import type { JobProfile, SkillGap } from '@/modules/career/career.types';

export const teacherAdapter = {
  /**
   * Create Teaching Plan
   * Uses existing Teacher Agent for structured learning
   */
  async createTeachingPlan(params: {
    missionId: string;
    userId: string;
    jobProfile: JobProfile;
    weakTopics: string[];
    interviewDate?: Date;
  }): Promise<any> {
    const { missionId, userId, jobProfile, weakTopics, interviewDate } = params;
    
    // Teacher sessions don't require special permission
    // They use existing voice/app architecture
    
    // Calculate days until interview
    const daysUntilInterview = interviewDate
      ? Math.max(1, Math.ceil(
          (new Date(interviewDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        ))
      : 7;
    
    // Generate teaching schedule
    const teachingPlan = {
      missionId,
      userId,
      totalDays: daysUntilInterview,
      sessions: [],
      focusTopics: weakTopics
    };
    
    // Distribute topics across days
    const topicsPerDay = Math.ceil(weakTopics.length / daysUntilInterview);
    
    for (let day = 1; day <= daysUntilInterview; day++) {
      const startIndex = (day - 1) * topicsPerDay;
      const dayTopics = weakTopics.slice(startIndex, startIndex + topicsPerDay);
      
      if (dayTopics.length > 0) {
        teachingPlan.sessions.push({
          day,
          date: new Date(Date.now() + (day - 1) * 24 * 60 * 60 * 1000),
          topics: dayTopics,
          duration: 30, // minutes
          type: 'teacher_session'
        });
      }
    }
    
    return teachingPlan;
  },
  
  /**
   * Start Teaching Session
   * Initiates a Teacher Agent session
   */
  async startTeachingSession(params: {
    userId: string;
    topic: string;
    subject: string;
  }): Promise<any> {
    const { userId, topic, subject } = params;
    
    // Use existing architecture to start teacher session
    // This will route through Terminal/SmartyAI system
    
    return {
      type: 'teacher_session',
      status: 'ready',
      topic,
      subject,
      message: 'Teacher session ready. Open Teacher App to start.',
      action: 'open_teacher_app',
      data: {
        topic,
        subject,
        userId
      }
    };
  }
};
