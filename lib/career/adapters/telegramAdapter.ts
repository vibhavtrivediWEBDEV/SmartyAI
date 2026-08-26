/**
 * Telegram Adapter
 * 
 * Uses existing Telegram integration
 * Sends notifications through SmartyAI Telegram bot
 */

import capabilityManager from '@/lib/capabilityManager';

export const telegramAdapter = {
  /**
   * Send Notification
   * Sends career update via Telegram
   */
  async sendNotification(params: {
    userId: string;
    message: string;
  }): Promise<any> {
    const { userId, message } = params;
    
    // Telegram notifications don't require user permission
    // They're controlled by bot configuration
    
    // Use existing Telegram integration
    try {
      // Send through existing API
      const response = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          message,
          source: 'career_agent'
        })
      });
      
      if (!response.ok) {
        throw new Error('Telegram notification failed');
      }
      
      return {
        sent: true,
        userId,
        message
      };
      
    } catch (error) {
      // Fallback: Log notification
      console.log('📱 [Telegram]', message);
      
      return {
        sent: false,
        fallback: true,
        message: 'Notification logged (Telegram not available)'
      };
    }
  }
};

/**
 * Format Career Update Message
 */
export function formatCareerUpdate(data: {
  company: string;
  role: string;
  daysUntilInterview: number;
  todaysPlan?: string[];
  progress: number;
}): string {
  const { company, role, daysUntilInterview, todaysPlan, progress } = data;
  
  let message = `🚀 *Career Update*\n\n`;
  message += `Your ${company} ${role} interview is in *${daysUntilInterview} days*.\n\n`;
  
  if (todaysPlan && todaysPlan.length > 0) {
    message += `📚 *Today's Plan:*\n`;
    todaysPlan.forEach(task => {
      message += `✓ ${task}\n`;
    });
    message += `\n`;
  }
  
  message += `📊 *Progress:* ${progress}% complete\n`;
  
  return message;
}

/**
 * Format Reminder Message
 */
export function formatReminder(data: {
  event: string;
  time: string;
}): string {
  return `⏰ *Reminder*\n\nYou have a ${data.event} in ${data.time}.`;
}

/**
 * Format Daily Summary
 */
export function formatDailySummary(data: {
  completed: string[];
  remaining: string[];
}): string {
  let message = `🎯 *Daily Summary*\n\n`;
  
  if (data.completed.length > 0) {
    message += `✅ *Completed:*\n`;
    data.completed.forEach(task => {
      message += `✓ ${task}\n`;
    });
    message += `\n`;
  }
  
  if (data.remaining.length > 0) {
    message += `•️ *Remaining:*\n`;
    data.remaining.forEach(task => {
      message += `• ${task}\n`;
    });
  }
  
  return message;
}
