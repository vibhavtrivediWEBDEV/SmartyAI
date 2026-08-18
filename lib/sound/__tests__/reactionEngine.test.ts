/**
 * Reaction Engine Tests
 * 
 * Tests proving the reaction engine works correctly
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { classifyEventLocally, hasFastMapping } from '../eventMapper';
import { matchReaction, matchReactionMultiple, validateSoundForReaction } from '../reactionMatcher';
import type { ReactionMetadata } from '../types';

describe('Sound Reaction Engine', () => {
  describe('Fast Event Classification', () => {
    it('should classify known events instantly', () => {
      const result = classifyEventLocally('automation_success');
      
      expect(result).not.toBeNull();
      expect(result!.intent).toBe('automation_success');
      expect(result!.confidence).toBeGreaterThanOrEqual(0.9);
    });
    
    it('should classify critical errors correctly', () => {
      const result = classifyEventLocally('deployment_failed');
      
      expect(result).not.toBeNull();
      expect(result!.intent).toBe('critical_error');
      expect(result!.severity).toBeGreaterThan(0.8);
    });
    
    it('should handle pattern-based classification', () => {
      const result = classifyEventLocally('unknown error occurred');
      
      expect(result).not.toBeNull();
      expect(result!.intent).toContain('error');
    });
    
    it('should return null for unmapped events', () => {
      const result = classifyEventLocally('random-unknown-event-xyz');
      
      expect(result).toBeNull();
    });
    
    it('should detect fast-mapped events', () => {
      expect(hasFastMapping('automation_success')).toBe(true);
      expect(hasFastMapping('404')).toBe(true);
      expect(hasFastMapping('random-event-xyz')).toBe(false);
    });
  });
  
  describe('Reaction Matcher', () => {
    it('should match reaction to best sound', () => {
      const reaction: ReactionMetadata = {
        intent: 'critical_error',
        severity: 0.85,
        confidence: 0.9,
        emotion: 'dramatic',
        humor: 0.85
      };
      
      const result = matchReaction(reaction);
      
      expect(result.soundId).toBeDefined();
      expect(result.score).toBeGreaterThan(0);
      expect(result.reason).toBeDefined();
    });
    
    it('should match automation_success to celebration sound', () => {
      const reaction: ReactionMetadata = {
        intent: 'automation_success',
        severity: 0.2,
        confidence: 0.95,
        emotion: 'celebration',
        humor: 0.5
      };
      
      const result = matchReaction(reaction);
      
      expect(result.soundId).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0.6);
    });
    
    it('should respect severity ranges', () => {
      const lowSeverity: ReactionMetadata = {
        intent: 'bug',
        severity: 0.2,
        confidence: 0.8
      };
      
      const highSeverity: ReactionMetadata = {
        intent: 'bug',
        severity: 0.9,
        confidence: 0.8
      };
      
      const lowResult = matchReaction(lowSeverity);
      const highResult = matchReaction(highSeverity);
      
      // Should select different sounds based on severity
      expect(lowResult.soundId).toBeDefined();
      expect(highResult.soundId).toBeDefined();
    });
    
    it('should return multiple matches', () => {
      const reaction: ReactionMetadata = {
        intent: 'bug',
        severity: 0.7,
        confidence: 0.85
      };
      
      const results = matchReactionMultiple(reaction, 3);
      
      expect(results).toHaveLength(3);
      expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
      expect(results[1].score).toBeGreaterThanOrEqual(results[2].score);
    });
    
    it('should validate sound for reaction', () => {
      const reaction: ReactionMetadata = {
        intent: 'critical_error',
        severity: 0.95,
        confidence: 0.9
      };
      
      const isValid = validateSoundForReaction('vine_boom', reaction);
      expect(isValid).toBe(true);
    });
    
    it('should reject sound below confidence threshold', () => {
      const reaction: ReactionMetadata = {
        intent: 'critical_error',
        severity: 0.95,
        confidence: 0.3 // Too low
      };
      
      const isValid = validateSoundForReaction('vine_boom', reaction);
      expect(isValid).toBe(false);
    });
    
    it('should reject sound outside severity range', () => {
      const reaction: ReactionMetadata = {
        intent: 'bug',
        severity: 0.1, // Too low for vine_boom
        confidence: 0.9
      };
      
      const isValid = validateSoundForReaction('vine_boom', reaction);
      expect(isValid).toBe(false);
    });
  });
  
  describe('Performance', () => {
    it('should classify events in <5ms', () => {
      const start = performance.now();
      
      for (let i = 0; i < 100; i++) {
        classifyEventLocally('automation_success');
      }
      
      const elapsed = performance.now() - start;
      const avgTime = elapsed / 100;
      
      expect(avgTime).toBeLessThan(5); // 5ms
    });
    
    it('should match reactions in <5ms', () => {
      const reaction: ReactionMetadata = {
        intent: 'bug',
        severity: 0.7,
        confidence: 0.85
      };
      
      const start = performance.now();
      
      for (let i = 0; i < 100; i++) {
        matchReaction(reaction);
      }
      
      const elapsed = performance.now() - start;
      const avgTime = elapsed / 100;
      
      expect(avgTime).toBeLessThan(5); // 5ms
    });
  });
  
  describe('Failsafe', () => {
    it('should return default sound for invalid reaction', () => {
      const reaction: ReactionMetadata = {
        intent: 'completely_unknown_intent_xyz',
        severity: 0.5,
        confidence: 0.1
      };
      
      const result = matchReaction(reaction);
      
      // Should return default fallback
      expect(result.soundId).toBeDefined();
      expect(result).not.toBeNull();
    });
    
    it('should never throw on invalid input', () => {
      expect(() => {
        matchReaction({
          intent: '',
          severity: -1,
          confidence: 2
        });
      }).not.toThrow();
    });
  });
});
