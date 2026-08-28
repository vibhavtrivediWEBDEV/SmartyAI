/**
 * Career Session Manager
 * 
 * STATE MACHINE for Career Agent conversation
 * 
 * IMPORTANT:
 * - Server owns the state
 * - AI only helps understand user's answer
 * - State transitions are EXPLICIT
 */

import type { 
  CareerSession,
  CareerSessionState,
  CareerSessionStatus,
  StructuredCareerResponse
} from '@/modules/career/careerSession.types';
import * as sessionRepo from '@/modules/career/careerSession.repository';
import * as missionRepo from '@/modules/career/career.repository';
import { getAIService } from '@/lib/ai';

// State transition table (explicit, not implicit)
const STATE_TRANSITIONS: Record<CareerSessionState, CareerSessionState | 'COMPLETE'> = {
  'COLLECTING_COMPANY': 'COLLECTING_ROLE',
  'COLLECTING_ROLE': 'COLLECTING_INTERVIEW_DATE',
  'COLLECTING_INTERVIEW_DATE': 'OPTIONAL_JOB_DESCRIPTION',
  'OPTIONAL_JOB_DESCRIPTION': 'CONFIRMING',
  'CONFIRMING': 'CREATE_MISSION',
  'CREATE_MISSION': 'COMPLETE',
  'RUNNING': 'COMPLETE'
};

// Required fields for mission creation
const REQUIRED_FIELDS = ['company', 'role', 'interviewDate'] as const;

export class CareerSessionManager {
  private session: CareerSession;
  
  constructor(session: CareerSession) {
    this.session = session;
  }
  
  /**
   * Process user response and advance state machine
   */
  async processUserResponse(userInput: string): Promise<StructuredCareerResponse> {
    console.log(`\n🎯 [CAREER MANAGER] Processing user response`);
    console.log(`[CAREER MANAGER] Input: "${userInput}"`);
    console.log(`[CAREER MANAGER] Current state: ${this.session.state}`);
    console.log(`[CAREER MANAGER] Draft before: ${JSON.stringify(this.session.draft)}`);
    
    // Add user turn to conversation
    await sessionRepo.addConversationTurn(
      this.session.id, 
      'user', 
      userInput
    );
    
    // Check if user is confirming
    if (this.session.state === 'CONFIRMING') {
      console.log(`[CAREER MANAGER] ✓ In CONFIRMING state - routing to handleConfirmation`);
      return await this.handleConfirmation(userInput);
    }
    
    console.log(`[CAREER MANAGER] Not in CONFIRMING state - extracting data`);
    
    // Extract data from user input
    const extracted = await this.extractUserData(userInput, this.session.state);
    
    console.log(`[CAREER EXTRACT] Extracted: ${JSON.stringify(extracted)}`);
    
    // Update draft with extracted data
    const updatedDraft = {
      ...this.session.draft,
      ...extracted
    };
    
    // Determine next state
    const nextState = this.determineNextState(updatedDraft);
    
    console.log(`[CAREER STATE] Previous: ${this.session.state} → Next: ${nextState}`);
    
    // Calculate missing fields
    const missingFields = this.calculateMissingFields(updatedDraft);
    
    // Generate next question
    const message = await this.generateNextQuestion(nextState, updatedDraft, missingFields);
    
    // CRITICAL: shouldCreateMission is ONLY true after handleConfirmation returns it
    // We are NOT creating mission yet - we're still collecting data
    const shouldCreateMission = false;
    
    // Update session in MongoDB
    const updatedSession = await sessionRepo.updateSession(this.session.id, {
      state: nextState,
      draft: updatedDraft,
      missingFields,
      currentQuestion: message
    });
    
    if (updatedSession) {
      this.session = updatedSession;
    }
    
    // Add assistant response to conversation
    await sessionRepo.addConversationTurn(this.session.id, 'assistant', message);
    
    console.log(`[CAREER RESPONSE] Message: "${message}"`);
    
    return {
      message,
      extracted,
      nextField: missingFields[0] || null,
      shouldCreateMission,
      state: nextState
    };
  }
  
  /**
   * Handle user confirmation
   * 
   * CRITICAL: This is ONLY called when session.state === 'CONFIRMING'
   * User has explicitly confirmed - we must create mission NOW
   * NO additional questions, NO interview questions, NO preparation questions
   */
  private async handleConfirmation(userInput: string): Promise<StructuredCareerResponse> {
    console.log(`\n🎯 [CAREER MANAGER] ========== CONFIRMATION DETECTED ==========`);
    console.log(`[CAREER MANAGER] User input: "${userInput}"`);
    console.log(`[CAREER MANAGER] Session: ${this.session.id}`);
    console.log(`[CAREER MANAGER] Session state: ${this.session.state}`);
    console.log(`[CAREER MANAGER] Draft: ${JSON.stringify(this.session.draft)}`);
    
    // Check if this is a confirmation or rejection
    const confirmed = this.isAffirmative(userInput);
    console.log(`[CAREER MANAGER] Is affirmative: ${confirmed}`);
    
    if (!confirmed) {
      // User rejected, ask for corrections
      console.log(`[CAREER MANAGER] ✗ User rejected - asking for corrections`);
      const message = "No problem. What would you like to change?";
      await sessionRepo.addConversationTurn(this.session.id, 'assistant', message);
      
      await sessionRepo.updateSession(this.session.id, {
        state: 'COLLECTING_COMPANY',
        missingFields: ['company', 'role', 'interviewDate']
      });
      
      return {
        message,
        extracted: {},
        nextField: 'company',
        shouldCreateMission: false,
        state: 'COLLECTING_COMPANY'
      };
    }
    
    console.log(`[CAREER MANAGER] ✓ User confirmed - validating draft`);
    
    // User confirmed - validate all required fields
    const validation = this.validateMissionData(this.session.draft);
    console.log(`[CAREER MANAGER] Validation: isValid=${validation.isValid}, missing=${validation.missing.join(',')}`);
    
    if (!validation.isValid) {
      console.log(`[CAREER ERROR] Cannot create mission - missing: ${validation.missing.join(', ')}`);
      
      const message = `I still need some information: ${validation.missing.join(', ')}. Please provide these details.`;
      await sessionRepo.addConversationTurn(this.session.id, 'assistant', message);
      
      await sessionRepo.updateSession(this.session.id, {
        state: 'COLLECTING_COMPANY',
        missingFields: validation.missing
      });
      
      return {
        message,
        extracted: {},
        nextField: validation.missing[0],
        shouldCreateMission: false,
        state: 'COLLECTING_COMPANY'
      };
    }
    
    // All validations passed - CREATE MISSION NOW
    console.log(`[CAREER MANAGER] ========== CREATING MISSION ==========`);
    console.log(`[CAREER MANAGER] Company: ${this.session.draft.company}`);
    console.log(`[CAREER MANAGER] Role: ${this.session.draft.role}`);
    console.log(`[CAREER MANAGER] Interview Date: ${this.session.draft.interviewDate}`);
    
    const mission = await this.createMission();
    
    if (!mission) {
      console.log(`[CAREER MANAGER] ✗ Mission creation failed`);
      const message = "I encountered an error creating your mission. Please try again.";
      await sessionRepo.addConversationTurn(this.session.id, 'assistant', message);
      return {
        message,
        extracted: {},
        nextField: null,
        shouldCreateMission: false,
        state: this.session.state
      };
    }
    
    console.log(`[CAREER MANAGER] ✓ Mission created: ${mission}`);
    console.log(`[CAREER MANAGER] ✓ Setting shouldCreateMission: TRUE`);
    console.log(`[CAREER MANAGER] ✓ Onboarding COMPLETE`);
    
    const message = `Done! Your career mission is created:\n\n${this.session.draft.company}\n${this.session.draft.role}\n${new Date(this.session.draft.interviewDate).toLocaleDateString()}\n\nI'll prepare your workspace around this interview.`;
    await sessionRepo.addConversationTurn(this.session.id, 'assistant', message);
    
    // CRITICAL: Return shouldCreateMission: true
    // Frontend must handle this by calling /api/career/mission
    return {
      message,
      extracted: this.session.draft,
      nextField: null,
      shouldCreateMission: true, // THIS IS THE KEY
      state: 'CREATE_MISSION'
    };
  }
  
  /**
   * Extract data from user input based on current state
   */
  private async extractUserData(
    userInput: string, 
    state: CareerSessionState
  ): Promise<Record<string, any>> {
    const extracted: Record<string, any> = {};
    
    switch (state) {
      case 'COLLECTING_COMPANY':
        extracted.company = await this.extractCompany(userInput);
        break;
        
      case 'COLLECTING_ROLE':
        extracted.role = await this.extractRole(userInput);
        break;
        
      case 'COLLECTING_INTERVIEW_DATE':
        extracted.interviewDate = await this.extractInterviewDate(userInput);
        break;
        
      case 'OPTIONAL_JOB_DESCRIPTION':
        if (userInput.length > 20) {
          extracted.jobDescription = userInput;
        }
        break;
    }
    
    return extracted;
  }
  
  /**
   * Extract company name - SMARTER EXTRACTION
   */
  private async extractCompany(userInput: string): Promise<string | undefined> {
    // Remove common filler words that might get captured
    const cleanedInput = userInput
      .replace(/\b(tomorrow|today|next|this)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Better patterns for company extraction
    const patterns = [
      // "at [Company]" or "with [Company]"
      /(?:at|with)\s+([A-Z][A-Za-z]+)(?:\s|$)/i,
      // "interviewing at [Company]"
      /interview(?:ing)?\s+(?:at|with)\s+([A-Z][A-Za-z]+)/i,
      // Single word company (must be 3+ chars, capitalized)
      /\b([A-Z][A-Za-z]{2,})\b/
    ];
    
    for (const pattern of patterns) {
      const match = cleanedInput.match(pattern);
      if (match && match[1]) {
        const company = match[1].trim();
        // Filter out false positives
        if (!['Yes', 'Okay', 'Sure', 'Tomorrow', 'Today'].includes(company)) {
          return company;
        }
      }
    }
    
    // AI fallback with strict validation
    const aiService = await getAIService();
    const prompt = `Extract ONLY the company name from this user input.

User: "${userInput}"

Rules:
- Return ONLY the company name, nothing else
- If multiple words, prefer the company name only
- If no company found, return "UNKNOWN"
- Do not include temporal words like "tomorrow"

Company:`;

    const response = await aiService.complete(prompt);
    const company = response.content.trim();
    
    if (company && company !== 'UNKNOWN' && company.length >= 2) {
      // Remove any temporal words that might slip through
      return company.replace(/\b(tomorrow|today|next)\b/gi, '').trim();
    }
    
    return undefined;
  }
  
  /**
   * Extract role - SMARTER EXTRACTION
   */
  private async extractRole(userInput: string): Promise<string | undefined> {
    // Filter out questions and common phrases that shouldn't be roles
    const filteredPhrases = [
      'company', 'interview', 'with', 'are', 'you', 'what', 'when', 'where',
      'how', 'which', 'your', 'name', 'the', 'for', 'job', 'position'
    ];
    
    // Check if input is a question (don't extract questions as roles)
    if (userInput.includes('?') || userInput.toLowerCase().includes('are you')) {
      return undefined;
    }
    
    // Better patterns for role extraction
    const patterns = [
      // "as a [Role]" or "for [Role] position"
      /(?:as\s+(?:a\s+)?|for\s+)([A-Za-z\s]+?)(?:\s+(?:position|role|job)|$)/i,
      // "Role Developer/Engineer/Manager"
      /([A-Za-z\s]+(?:developer|engineer|manager|designer|analyst|specialist))/i,
      // "the [Role] role"
      /(?:the|a)\s+([A-Za-z\s]+?)\s+(?:role|position|job)/i
    ];
    
    for (const pattern of patterns) {
      const match = userInput.match(pattern);
      if (match && match[1]) {
        const role = match[1].trim();
        // Make sure it's not just filler words
        if (role.length > 2 && !filteredPhrases.includes(role.toLowerCase())) {
          return role;
        }
      }
    }
    
    // AI extraction with validation
    const aiService = await getAIService();
    const prompt = `Extract ONLY the job role or title from this user input.

User: "${userInput}"

Rules:
- Return ONLY the role/job title (e.g., "Software Engineer", "Product Manager")
- If no clear role mentioned, return "UNKNOWN"
- Do NOT return questions or incomplete phrases
- Do NOT return company names
- Maximum 4 words

Role:`;

    const response = await aiService.complete(prompt);
    const role = response.content.trim();
    
    if (role && role !== 'UNKNOWN' && role.length >= 2) {
      return role;
    }
    
    return undefined; // DON'T default to whole input
  }
  
  /**
   * Extract interview date
   */
  private async extractInterviewDate(userInput: string): Promise<Date | undefined> {
    // Pattern: "in X days"
    const daysMatch = userInput.match(/(?:in|within)\s+(\d+)\s+days?/i);
    if (daysMatch) {
      const days = parseInt(daysMatch[1]);
      const date = new Date();
      date.setDate(date.getDate() + days);
      return date;
    }
    
    // Pattern: "tomorrow"
    if (userInput.toLowerCase().includes('tomorrow')) {
      const date = new Date();
      date.setDate(date.getDate() + 1);
      return date;
    }
    
    // Pattern: Specific date
    const datePatterns = [
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,
      /(\w+)\s+(\d{1,2}),?\s+(\d{4})/i
    ];
    
    for (const pattern of datePatterns) {
      const match = userInput.match(pattern);
      if (match) {
        const parsed = new Date(userInput);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      }
    }
    
    // Use AI if needed
    const aiService = await getAIService();
    const prompt = `Extract the interview date from this user input.
    
User: "${userInput}"

Today's date: ${new Date().toISOString().split('T')[0]}

Return ONLY the date in ISO format (YYYY-MM-DD), nothing else. If no date mentioned, return "UNKNOWN".`;

    const response = await aiService.complete(prompt);
    const dateStr = response.content.trim();
    
    if (dateStr && dateStr !== 'UNKNOWN') {
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    
    return undefined;
  }
  
  /**
   * Determine next state based on draft data
   */
  private determineNextState(draft: any): CareerSessionState {
    const currentState = this.session.state;
    
    // Check if all required fields are present
    const hasCompany = !!draft.company;
    const hasRole = !!draft.role;
    const hasInterviewDate = !!draft.interviewDate;
    
    console.log(`[CAREER STATE CHECK] Company: ${hasCompany}, Role: ${hasRole}, Date: ${hasInterviewDate}`);
    
    if (!hasCompany) return 'COLLECTING_COMPANY';
    if (!hasRole) return 'COLLECTING_ROLE';
    if (!hasInterviewDate) return 'COLLECTING_INTERVIEW_DATE';
    
    // All required fields present - move to confirming
    return 'CONFIRMING';
  }
  
  /**
   * Calculate missing fields
   */
  private calculateMissingFields(draft: any): string[] {
    const missing: string[] = [];
    
    if (!draft.company) missing.push('company');
    if (!draft.role) missing.push('role');
    if (!draft.interviewDate) missing.push('interviewDate');
    
    return missing;
  }
  
  /**
   * Generate next question based on state
   */
  private async generateNextQuestion(
    state: CareerSessionState,
    draft: any,
    missingFields: string[]
  ): Promise<string> {
    switch (state) {
      case 'COLLECTING_COMPANY':
        return "Great! Which company are you interviewing with?";
        
      case 'COLLECTING_ROLE':
        return `What role or position at ${draft.company || 'the company'}?`;
        
      case 'COLLECTING_INTERVIEW_DATE':
        return "When is your interview? You can say something like 'in 5 days' or give a specific date.";
        
      case 'OPTIONAL_JOB_DESCRIPTION':
        return "Do you have a job description you'd like to share? (You can say 'skip' if not)";
        
      case 'CONFIRMING':
        const interviewDate = draft.interviewDate 
          ? new Date(draft.interviewDate).toLocaleDateString()
          : 'TBD';
        
        return `Perfect! Let me confirm:\n\nCompany: ${draft.company}\nRole: ${draft.role}\nInterview: ${interviewDate}\n\nShould I create your career preparation mission now?`;
        
      default:
        return "I'm here to help you prepare for your interview.";
    }
  }
  
  /**
   * Check if user input is affirmative
   */
  private isAffirmative(userInput: string): boolean {
    const affirmative = [
      'yes', 'yeah', 'yep', 'sure', 'create', 'confirm', 
      'go ahead', 'please', 'do it', 'y', 'yep', 'ok', 
      'okay', 'proceed', 'continue', 'absolutely', 'definitely',
      'that sounds good', 'sounds good', 'looks good', 'perfect'
    ];
    const lower = userInput.toLowerCase().trim();
    console.log(`[CAREER MANAGER] Checking if "${lower}" is affirmative`);
    const result = affirmative.some(word => lower.includes(word));
    console.log(`[CAREER MANAGER] Affirmative check result: ${result}`);
    return result;
  }
  
  /**
   * Validate mission data before creation
   */
  private validateMissionData(draft: any): { isValid: boolean; missing: string[] } {
    const missing: string[] = [];
    
    if (!draft.company) missing.push('company');
    if (!draft.role) missing.push('role');
    if (!draft.interviewDate) missing.push('interviewDate');
    
    return {
      isValid: missing.length === 0,
      missing
    };
  }
  
  /**
   * CREATE MISSION - Server transaction
   */
  private async createMission(): Promise<string | null> {
    console.log(`\n🎯 [CAREER MISSION] Starting mission creation transaction`);
    
    try {
      // Validate required fields
      const validation = this.validateMissionData(this.session.draft);
      if (!validation.isValid) {
        console.log(`[CAREER ERROR] Cannot create mission - missing: ${validation.missing.join(', ')}`);
        return null;
      }
      
      // Calculate objectives
      const objectives = [
        "Analyze job requirements",
        "Prepare resume",
        "Identify skill gaps",
        "Create learning plan",
        "Practice interview questions",
        "Prepare technical answers"
      ];
      
      // Create mission
      const missionId = await missionRepo.createCareerMission({
        userId: this.session.userId,
        company: this.session.draft.company!,
        role: this.session.draft.role!,
        interviewDate: this.session.draft.interviewDate,
        jobDescription: this.session.draft.jobDescription,
        status: 'CREATED',
        priority: 'high',
        progress: 0
      });
      
      console.log(`[CAREER MISSION] ✓ Created mission: ${missionId}`);
      
      // Update session with mission ID
      await sessionRepo.updateSession(this.session.id, {
        status: 'created',
        state: 'CREATE_MISSION',
        missionId
      });
      
      console.log(`[CAREER MISSION] ✓ Session updated with mission ID`);
      
      return missionId;
      
    } catch (error: any) {
      console.error('[CAREER ERROR] Mission creation failed:', error);
      return null;
    }
  }
}
