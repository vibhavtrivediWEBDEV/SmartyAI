/**
 * Sound Library Tests
 * 
 * Tests for sound library utilities
 */

import { describe, it, expect } from 'vitest';
import {
  getSoundLibrary,
  getAllSounds,
  getSoundById,
  getSoundsByIntent,
  getSoundsByEmotion
} from '../soundLibrary';

describe('Sound Library', () => {
  it('should have valid sound library structure', () => {
    const library = getSoundLibrary();
    
    expect(library).toBeDefined();
    expect(library.sounds).toBeInstanceOf(Array);
    expect(library.sounds.length).toBeGreaterThan(0);
    expect(library.version).toBeDefined();
  });
  
  it('should return all sounds', () => {
    const sounds = getAllSounds();
    
    expect(sounds).toBeInstanceOf(Array);
    expect(sounds.length).toBeGreaterThan(10);
  });
  
  it('should find sound by ID', () => {
    const sound = getSoundById('vine_boom');
    
    expect(sound).not.toBeNull();
    expect(sound!.id).toBe('vine_boom');
    expect(sound!.name).toBe('Vine Boom');
  });
  
  it('should return null for invalid ID', () => {
    const sound = getSoundById('nonexistent_sound_xyz');
    
    expect(sound).toBeNull();
  });
  
  it('should find sounds by intent', () => {
    const sounds = getSoundsByIntent('critical_error');
    
    expect(sounds.length).toBeGreaterThan(0);
    expect(sounds.some(s => s.id === 'vine_boom')).toBe(true);
  });
  
  it('should find sounds by emotion', () => {
    const sounds = getSoundsByEmotion('celebration');
    
    expect(sounds.length).toBeGreaterThan(0);
    expect(sounds.every(s => s.emotion === 'celebration')).toBe(true);
  });
  
  it('should validate sound structure', () => {
    const sounds = getAllSounds();
    
    for (const sound of sounds) {
      expect(sound.id).toBeDefined();
      expect(sound.name).toBeDefined();
      expect(sound.intent).toBeInstanceOf(Array);
      expect(sound.intent.length).toBeGreaterThan(0);
      
      if (sound.severity) {
        expect(sound.severity.min).toBeGreaterThanOrEqual(0);
        expect(sound.severity.max).toBeLessThanOrEqual(1);
        expect(sound.severity.min).toBeLessThanOrEqual(sound.severity.max);
      }
      
      if (sound.confidence_threshold) {
        expect(sound.confidence_threshold).toBeGreaterThanOrEqual(0);
        expect(sound.confidence_threshold).toBeLessThanOrEqual(1);
      }
      
      if (sound.humor !== undefined) {
        expect(sound.humor).toBeGreaterThanOrEqual(0);
        expect(sound.humor).toBeLessThanOrEqual(1);
      }
      
      if (sound.energy !== undefined) {
        expect(sound.energy).toBeGreaterThanOrEqual(0);
        expect(sound.energy).toBeLessThanOrEqual(1);
      }
    }
  });
});
