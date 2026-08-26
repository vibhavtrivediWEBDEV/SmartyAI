/**
 * ATS Adapter
 * 
 * Uses existing ATS system (lib/ats)
 * Analyzes resume against job requirements
 */

import capabilityManager from '@/lib/capabilityManager';
import type { JobProfile, SkillGap } from '@/modules/career/career.types';

export const atsAdapter = {
  /**
   * Analyze Gaps
   * Compares resume against job requirements
   */
  async analyzeGaps(
    resume: any, 
    jobProfile: JobProfile
  ): Promise<SkillGap[]> {
    const skillGaps: SkillGap[] = [];
    
    // Extract skills from resume
    const resumeSkills = new Set(
      (resume.skills || []).map((s: string) => s.toLowerCase())
    );
    
    // Analyze required skills
    jobProfile.requiredSkills.forEach(skill => {
      const skillLower = skill.toLowerCase();
      const hasSkill = resumeSkills.has(skillLower);
      
      skillGaps.push({
        skill,
        status: hasSkill ? 'strong' : 'missing',
        priority: 'high',
        evidence: hasSkill ? 'Found in resume' : 'Not found in resume'
      });
    });
    
    // Analyze preferred skills
    jobProfile.preferredSkills.forEach(skill => {
      const skillLower = skill.toLowerCase();
      const hasSkill = resumeSkills.has(skillLower);
      
      // Only add if not already added
      if (!skillGaps.find(g => g.skill.toLowerCase() === skillLower)) {
        skillGaps.push({
          skill,
          status: hasSkill ? 'strong' : 'needs_improvement',
          priority: 'medium',
          evidence: hasSkill ? 'Found in resume' : 'Optional skill, not found'
        });
      }
    });
    
    // Analyze technologies
    jobProfile.technologies.forEach(tech => {
      const techLower = tech.toLowerCase();
      const hasTech = resumeSkills.has(techLower);
      
      if (!skillGaps.find(g => g.skill.toLowerCase() === techLower)) {
        skillGaps.push({
          skill: tech,
          status: hasTech ? 'strong' : 'needs_improvement',
          priority: 'medium',
          evidence: hasTech ? 'Found in resume' : 'Technology mentioned in JD'
        });
      }
    });
    
    return skillGaps;
  },
  
  /**
   * Score Resume
   * ATS scoring against job description
   */
  async scoreResume(
    resume: any,
    jobProfile: JobProfile
  ): Promise<{
    score: number;
    breakdown: Record<string, number>;
    suggestions: string[];
  }> {
    let score = 0;
    const breakdown: Record<string, number> = {};
    const suggestions: string[] = [];
    
    // Check required skills match
    const resumeSkills = new Set(
      (resume.skills || []).map((s: string) => s.toLowerCase())
    );
    
    // Required skills (40% weight)
    const requiredMatch = jobProfile.requiredSkills.filter(skill => 
      resumeSkills.has(skill.toLowerCase())
    ).length;
    breakdown.requiredSkills = (requiredMatch / jobProfile.requiredSkills.length) * 40;
    score += breakdown.requiredSkills;
    
    if (requiredMatch < jobProfile.requiredSkills.length) {
      suggestions.push(`Missing ${jobProfile.requiredSkills.length - requiredMatch} required skills`);
    }
    
    // Technologies (30% weight)
    const techMatch = jobProfile.technologies.filter(tech => 
      resumeSkills.has(tech.toLowerCase())
    ).length;
    breakdown.technologies = (techMatch / jobProfile.technologies.length) * 30;
    score += breakdown.technologies;
    
    // Experience match (20% weight) - simplified
    breakdown.experience = 15; // Placeholder
    score += breakdown.experience;
    
    // Additional factors (10% weight)
    breakdown.additional = 8; // Placeholder
    score += breakdown.additional;
    
    // Generate suggestions
    if (score < 60) {
      suggestions.push('Consider adding more relevant skills to your resume');
    }
    
    if (breakdown.requiredSkills < 30) {
      suggestions.push('Focus on highlighting required skills from job description');
    }
    
    return {
      score: Math.round(score),
      breakdown,
      suggestions
    };
  }
};
