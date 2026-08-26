/**
 * Mail Adapter
 * 
 * Uses existing Mail system
 * Monitors for relevant emails and prepares replies
 */

import capabilityManager from '@/lib/capabilityManager';

export const mailAdapter = {
  /**
   * Detect Relevant Emails
   * Scans for interview/application related emails
   */
  async detectRelevantEmails(params: {
    userId: string;
    company: string;
    timeRange?: string;
  }): Promise<any[]> {
    const { userId, company, timeRange } = params;
    
    // Check capability
    const hasPermission = await capabilityManager.checkCapabilities(['mail.read']);
    
    if (!hasPermission.granted) {
      return [];
    }
    
    // Would use existing Mail integration to search
    // For now, return structure
    return [
      {
        type: 'interview_invitation',
        company,
        subject: `Interview Invitation - ${company}`,
        detected: false,
        action: 'notify_user'
      }
    ];
  },
  
  /**
   * Prepare Reply
   * Creates draft reply for interview emails
   */
  async prepareReply(params: {
    userId: string;
    emailType: 'interview_confirmation' | 'thank_you' | 'follow_up';
    company: string;
    role: string;
    interviewDate?: Date;
  }): Promise<string> {
    const { userId, emailType, company, role, interviewDate } = params;
    
    // Check capability
    const hasPermission = await capabilityManager.checkCapabilities(['mail.compose']);
    
    if (!hasPermission.granted) {
      await capabilityManager.requestCapability('mail.compose', {
        source: 'career_agent',
        userId,
        reason: 'Prepare email reply'
      });
      
      throw new Error('MAIL_PERMISSION_REQUIRED');
    }
    
    // Generate email template
    const templates: Record<string, string> = {
      interview_confirmation: generateInterviewConfirmation(company, role, interviewDate),
      thank_you: generateThankYouEmail(company, role),
      follow_up: generateFollowUpEmail(company, role)
    };
    
    return templates[emailType];
  }
};

/**
 * Generate Interview Confirmation Email
 */
function generateInterviewConfirmation(
  company: string, 
  role: string, 
  date?: Date
): string {
  return `Subject: Re: Interview Confirmation - ${role} Position

Dear Hiring Team,

Thank you for the opportunity to interview for the ${role} position at ${company}.

I am confirming my availability for the interview${date ? ` scheduled for ${new Date(date).toLocaleDateString()}` : ''}.

I look forward to discussing how my skills and experience align with ${company}'s goals and the ${role} position.

Please let me know if there's any additional information you need from me before the interview.

Best regards,
[Your Name]
`;
}

/**
 * Generate Thank You Email
 */
function generateThankYouEmail(company: string, role: string): string {
  return `Subject: Thank You - ${role} Interview at ${company}

Dear Hiring Team,

Thank you for taking the time to interview me for the ${role} position at ${company} today.

I thoroughly enjoyed learning more about the team and the exciting projects at ${company}. Our discussion further reinforced my enthusiasm for the opportunity to contribute to your team.

Key highlights from our conversation:
- [Mention specific topic discussed]
- [Reference something you learned about the company]
- [Reiterate your relevant skills/experience]

I remain confident that my background in [relevant skills] would enable me to make valuable contributions to the ${role} position and ${company}'s objectives.

Please don't hesitate to reach out if you need any additional information or have further questions.

I look forward to hearing from you regarding the next steps in the hiring process.

Best regards,
[Your Name]
`;
}

/**
 * Generate Follow-Up Email
 */
function generateFollowUpEmail(company: string, role: string): string {
  return `Subject: Follow-Up: ${role} Position Application at ${company}

Dear Hiring Team,

I hope this message finds you well. I wanted to follow up on my application for the ${role} position at ${company}, submitted on [date].

I remain very interested in this opportunity and would welcome the chance to discuss how my skills and experience could benefit ${company}'s team.

I understand that you're likely reviewing many applications. If you need any additional information or have questions about my candidacy, please don't hesitate to reach out.

Thank you for your time and consideration.

Best regards,
[Your Name]
`;
}
