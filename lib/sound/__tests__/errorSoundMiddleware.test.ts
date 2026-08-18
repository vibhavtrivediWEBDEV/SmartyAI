/**
 * Error Sound Middleware Tests
 * 
 * Test the error sound integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { playErrorSound, wrapWithErrorSound, catchWithErrorSound } from '../errorSoundMiddleware';

// Mock the reactionEngine
vi.mock('../reactionEngine', () => ({
  playById: vi.fn().mockResolvedValue(undefined)
}));

import { playById } from '../reactionEngine';

describe('Error Sound Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('playErrorSound', () => {
    it('should play faaah sound', async () => {
      await playErrorSound();
      
      expect(playById).toHaveBeenCalledWith('faaah', { volume: 0.5 });
    });

    it('should not throw even if playById fails', async () => {
      const mockPlayById = playById as any;
      mockPlayById.mockRejectedValueOnce(new Error('Audio failed'));
      
      // Should not throw
      await expect(playErrorSound()).resolves.toBeUndefined();
    });
  });

  describe('wrapWithErrorSound', () => {
    it('should not play sound if function succeeds', async () => {
      const successFn = vi.fn().mockResolvedValue('success');
      const wrappedFn = wrapWithErrorSound(successFn);
      
      const result = await wrappedFn('arg1', 'arg2');
      
      expect(result).toBe('success');
      expect(successFn).toHaveBeenCalledWith('arg1', 'arg2');
      expect(playById).not.toHaveBeenCalled();
    });

    it('should play sound and re-throw if function fails', async () => {
      const errorFn = vi.fn().mockRejectedValue(new Error('Function failed'));
      const wrappedFn = wrapWithErrorSound(errorFn);
      
      await expect(wrappedFn()).rejects.toThrow('Function failed');
      expect(playById).toHaveBeenCalledWith('faaah', { volume: 0.5 });
    });
  });

  describe('catchWithErrorSound', () => {
    it('should return result if promise succeeds', async () => {
      const promise = Promise.resolve('data');
      
      const result = await catchWithErrorSound(promise);
      
      expect(result).toBe('data');
      expect(playById).not.toHaveBeenCalled();
    });

    it('should play sound and re-throw if promise fails', async () => {
      const promise = Promise.reject(new Error('Failed'));
      
      await expect(catchWithErrorSound(promise)).rejects.toThrow('Failed');
      expect(playById).toHaveBeenCalledWith('faaah', { volume: 0.5 });
    });
  });
});
