/**
 * Calendar Adapter
 * 
 * Uses existing Calendar service (modules/calendar)
 * Respects Capability Manager for permissions
 */

import { createEvent, findEventsByDate } from '@/modules/calendar/calendar.repository';
import capabilityManager from '@/lib/capabilityManager';
import type { JobProfile } from '@/modules/career/career.types';

export const calendarAdapter = {
  /**
   * Create Preparation Schedule
   * Creates calendar events for career preparation
   */
  async createPreparationSchedule(params: {
    missionId: string;
    userId: string;
    jobProfile: JobProfile;
    interviewDate?: Date | string;
  }): Promise<any[]> {
    const { missionId, userId, jobProfile, interviewDate } = params;
    
    // Check capability
    const hasPermission = await capabilityManager.checkCapabilities(['calendar.write']);
    
    if (!hasPermission.granted) {
      // Queue permission request
      await capabilityManager.requestCapability('calendar.write', {
        source: 'career_agent',
        missionId,
        reason: 'Create interview preparation schedule'
      });
      
      throw new Error('CALENDAR_PERMISSION_REQUIRED');
    }
    
    const events = [];
    const startDate = new Date();
    const targetDate = interviewDate ? new Date(interviewDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    // Calculate days
    const daysUntil = Math.ceil((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Create daily preparation events
    for (let day = 1; day <= Math.min(daysUntil, 7); day++) {
      const eventDate = new Date(startDate);
      eventDate.setDate(eventDate.getDate() + day - 1);
      
      // Morning session
      const morningEvent = await createEvent({
        userId,
        calendarId: 'default',
        title: `${jobProfile.company || 'Company'} Interview Prep - Day ${day}`,
        date: eventDate.toISOString().split('T')[0],
        startTime: '18:00',
        endTime: '19:00',
        description: getDailyTopic(day, jobProfile),
        location: 'SmartyAI Career Agent',
        source: 'ai',
        reminder: 30
      });
      
      events.push(morningEvent);
    }
    
    // Mock interview day
    if (interviewDate) {
      const mockInterviewEvent = await createEvent({
        userId,
        calendarId: 'default',
        title: `Mock Interview - ${jobProfile.company || 'Company'}`,
        date: new Date(interviewDate).toISOString().split('T')[0],
        startTime: '17:00',
        endTime: '18:00',
        description: 'Practice interview with SmartyAI',
        source: 'ai',
        reminder: 60
      });
      
      events.push(mockInterviewEvent);
    }
    
    return events;
  },
  
  /**
   * Get Today's Schedule
   */
  async getTodaySchedule(userId: string): Promise<any[]> {
    const hasPermission = await capabilityManager.checkCapabilities(['calendar.read']);
    
    if (!hasPermission.granted) {
      return [];
    }
    
    const today = new Date().toISOString().split('T')[0];
    const events = await findEventsByDate(userId, today);
    
    return events;
  }
};

/**
 * Get daily preparation topic
 */
function getDailyTopic(day: number, jobProfile: JobProfile): string {
  const topics = [
    'Overview & Company Research',
    'Technical Skills Review',
    'Coding Practice',
    'System Design (if applicable)',
    'Behavioral Questions',
    'Mock Interview',
    'Final Review'
  ];
  
  return topics[Math.min(day - 1, topics.length - 1)] || 'Practice';
}
