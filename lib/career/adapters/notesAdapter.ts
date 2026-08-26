/**
 * Notes Adapter
 * 
 * Uses existing Notes system through resolveUserIntent
 * Respects Capability Manager for permissions
 */

import capabilityManager from '@/lib/capabilityManager';
import type { JobProfile, SkillGap } from '@/modules/career/career.types';

export const notesAdapter = {
  /**
   * Create Interview Notes
   * Creates structured notes for interview preparation
   */
  async createInterviewNotes(params: {
    missionId: string;
    userId: string;
    company: string;
    role: string;
    jobProfile: JobProfile;
    skillGaps: SkillGap[];
  }): Promise<any> {
    const { missionId, userId, company, role, jobProfile, skillGaps } = params;
    
    // Check capability
    const hasPermission = await capabilityManager.checkCapabilities(['filesystem.write']);
    
    if (!hasPermission.granted) {
      await capabilityManager.requestCapability('filesystem.write', {
        source: 'career_agent',
        missionId,
        reason: 'Create interview preparation notes'
      });
      
      throw new Error('NOTES_PERMISSION_REQUIRED');
    }
    
    // Create structured notes
    const notesContent = generateInterviewNotesMarkdown(company, role, jobProfile, skillGaps);
    
    // Use existing notes system (via intent resolution)
    // This goes through the unified architecture
    const { resolveUserIntent } = await import('@/lib/resolveUserIntent');
    const { executeIntent } = await import('@/lib/executeIntent');
    
    try {
      // Resolve intent to create note
      const resolved = await resolveUserIntent(
        `create note ${company} ${role} interview preparation`,
        { source: 'career_agent' }
      );
      
      // Execute (this will use existing automation flow)
      const sequence = executeIntent(resolved);
      
      // The sequence will be executed by the WebSocket automation system
      // We return the notes content for now
      return {
        created: true,
        title: `${company} - ${role} Interview Preparation`,
        content: notesContent
      };
      
    } catch (error) {
      // Fallback: Return structured notes
      return {
        created: false,
        title: `${company} - ${role} Interview Preparation`,
        content: notesContent,
        note: 'Notes ready for manual creation'
      };
    }
  }
};

/**
 * Generate Interview Notes Markdown
 */
function generateInterviewNotesMarkdown(
  company: string,
  role: string,
  jobProfile: JobProfile,
  skillGaps: SkillGap[]
): string {
  return `# ${company} - ${role} Interview Preparation

## Company Information
- **Company**: ${company}
- **Role**: ${role}
- **Experience Level**: ${jobProfile.experienceLevel || 'Not specified'}

## Job Requirements

### Required Skills
${jobProfile.requiredSkills.map(skill => `- ${skill}`).join('\n')}

### Preferred Skills
${jobProfile.preferredSkills.map(skill => `- ${skill}`).join('\n')}

### Technologies
${jobProfile.technologies.map(tech => `- ${tech}`).join('\n')}

### Responsibilities
${jobProfile.responsibilities.map(resp => `- ${resp}`).join('\n')}

## Skill Gap Analysis

### Strong Areas ✅
${skillGaps.filter(g => g.status === 'strong').map(g => `- ${g.skill}`).join('\n') || 'Resume not analyzed'}

### Needs Improvement ⚠️
${skillGaps.filter(g => g.status === 'needs_improvement').map(g => 
  `- ${g.skill} ${g.evidence ? `(${g.evidence})` : ''}`
).join('\n') || 'None identified'}

### Missing Skills ❌
${skillGaps.filter(g => g.status === 'missing').map(g => 
  `- ${g.skill}`
).join('\n') || 'None identified'}

## Interview Topics

### Technical Topics
${jobProfile.interviewTopics.map(topic => `- ${topic}`).join('\n')}

### Coding Topics
${jobProfile.codingTopics.map(topic => `- ${topic}`).join('\n')}

### Soft Skills
${jobProfile.softSkills.map(skill => `- ${skill}`).join('\n')}

## Preparation Tasks

### Day 1: Company Research
- [ ] Research company history and values
- [ ] Understand company culture
- [ ] Review recent news

### Day 2: Technical Skills Review
- [ ] Review required technical skills
- [ ] Practice explaining concepts
- [ ] Review system design topics

### Day 3: Coding Practice
- [ ] Practice coding problems
- [ ] Review data structures
- [ ] Practice algorithms

### Day 4: Behavioral Questions
- [ ] Prepare STAR method examples
- [ ] Review common behavioral questions
- [ ] Practice mock interviews

### Day 5: Final Review
- [ ] Review weak areas
- [ ] Practice explaining projects
- [ ] Mock interview session

## Notes

### Key Points to Remember
- Add your key points here

### Questions to Ask
- Add questions for interviewer

---

Created by SmartyAI Career Agent
Date: ${new Date().toISOString()}
`;
}
