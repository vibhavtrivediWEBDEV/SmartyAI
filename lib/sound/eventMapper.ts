/**
 * Event Mapper - Fast Local Classification
 * 
 * Maps known events to reaction metadata WITHOUT AI calls
 * Target: <5ms matching for common events
 */

import type { ReactionMetadata, FastReactionEvent } from './types';

/**
 * Pre-mapped events for fast local resolution
 * These bypass AI completely for performance
 */
const FAST_EVENT_MAP: Record<string, ReactionMetadata> = {
  // Success events
  'automation_success': { intent: 'automation_success', severity: 0.2, confidence: 0.95, emotion: 'celebration', humor: 0.5 },
  'deployment_success': { intent: 'deployment_success', severity: 0.1, confidence: 0.95, emotion: 'celebration', humor: 0.7 },
  'test_passed': { intent: 'test_passed', severity: 0.15, confidence: 0.90, emotion: 'celebration', humor: 0.5 },
  'task_complete': { intent: 'task_complete', severity: 0.2, confidence: 0.95, emotion: 'satisfaction', humor: 0.6 },
  'success': { intent: 'success', severity: 0.2, confidence: 0.90, emotion: 'celebration', humor: 0.5 },
  
  // Error events
  'automation_failure': { intent: 'bug', severity: 0.7, confidence: 0.85, emotion: 'shock', humor: 0.8 },
  'deployment_failed': { intent: 'critical_error', severity: 0.85, confidence: 0.95, emotion: 'dramatic', humor: 0.85 },
  'build_failed': { intent: 'bug', severity: 0.75, confidence: 0.90, emotion: 'frustration', humor: 0.85 },
  'critical_error': { intent: 'critical_error', severity: 0.85, confidence: 0.95, emotion: 'dramatic', humor: 0.85 },
  'test_failure': { intent: 'test_failure', severity: 0.6, confidence: 0.90, emotion: 'sad', humor: 0.90 },
  'api_error': { intent: 'api_failure', severity: 0.65, confidence: 0.85, emotion: 'investigation', humor: 0.85 },
  'runtime_error': { intent: 'unexpected_error', severity: 0.75, confidence: 0.90, emotion: 'shock', humor: 0.90 },
  
  // HTTP errors
  '404': { intent: 'not_found', severity: 0.5, confidence: 0.95, emotion: 'investigation', humor: 0.6 },
  '500': { intent: 'unexpected_error', severity: 0.8, confidence: 0.95, emotion: 'shock', humor: 0.85 },
  '502': { intent: 'api_failure', severity: 0.7, confidence: 0.90, emotion: 'shock', humor: 0.75 },
  '503': { intent: 'api_failure', severity: 0.75, confidence: 0.90, emotion: 'shock', humor: 0.75 },
  
  // Developer events
  'merge_conflict': { intent: 'conflict', severity: 0.55, confidence: 0.85, emotion: 'frustration', humor: 0.85 },
  'bug_found': { intent: 'bug', severity: 0.65, confidence: 0.85, emotion: 'investigation', humor: 0.90 },
  'timeout': { intent: 'api_failure', severity: 0.6, confidence: 0.85, emotion: 'frustration', humor: 0.75 },
  
  // UI events
  'button_click': { intent: 'success', severity: 0.1, confidence: 0.95, emotion: 'neutral', humor: 0.0 },
  'notification': { intent: 'alert', severity: 0.4, confidence: 0.90, emotion: 'alert', humor: 0.3 },
  
  // Warnings
  'warning': { intent: 'alert', severity: 0.5, confidence: 0.85, emotion: 'alert', humor: 0.4 },
  'deprecation_warning': { intent: 'alert', severity: 0.45, confidence: 0.85, emotion: 'investigation', humor: 0.5 },
  
  // Terminal events
  'terminal_command_sent': { intent: 'lets_go', severity: 0.1, confidence: 0.98, emotion: 'motivation', humor: 0.6 },
  'terminal_response_complete': { intent: 'task_complete', severity: 0.15, confidence: 0.98, emotion: 'satisfaction', humor: 0.65 }
};

/**
 * Pattern matches for flexible event matching
 */
const EVENT_PATTERNS: Array<{
  pattern: RegExp;
  metadata: ReactionMetadata;
}> = [
  {
    pattern: /error|failed|failure/i,
    metadata: { intent: 'unexpected_error', severity: 0.7, confidence: 0.75, emotion: 'shock', humor: 0.85 }
  },
  {
    pattern: /success|complete|done|finished/i,
    metadata: { intent: 'success', severity: 0.2, confidence: 0.80, emotion: 'celebration', humor: 0.5 }
  },
  {
    pattern: /warning|alert|caution/i,
    metadata: { intent: 'alert', severity: 0.5, confidence: 0.80, emotion: 'alert', humor: 0.4 }
  },
  {
    pattern: /critical|severe|major/i,
    metadata: { intent: 'critical_error', severity: 0.85, confidence: 0.85, emotion: 'dramatic', humor: 0.80 }
  },
  {
    pattern: /timeout|timed out/i,
    metadata: { intent: 'api_failure', severity: 0.6, confidence: 0.82, emotion: 'frustration', humor: 0.75 }
  }
];

/**
 * Fast local event classification
 * Returns reaction metadata WITHOUT AI call
 * 
 * @param event - Event name or FastReactionEvent object
 * @returns ReactionMetadata or null if not in fast map
 */
export function classifyEventLocally(event: string | FastReactionEvent): ReactionMetadata | null {
  // Normalize input
  const eventObj: FastReactionEvent = typeof event === 'string' 
    ? { event, severity: 0.5, source: 'unknown' }
    : event;
  
  const eventKey = eventObj.event.toLowerCase().trim();
  
  // 1. Direct map lookup (fastest)
  if (FAST_EVENT_MAP[eventKey]) {
    const base = FAST_EVENT_MAP[eventKey];
    return {
      ...base,
      severity: eventObj.severity !== undefined && eventObj.severity !== 0.5 
        ? eventObj.severity  // Use provided severity only if explicitly set
        : base.severity     // Otherwise use the default from the map
    };
  }
  
  // 2. Pattern matching (medium speed)
  for (const { pattern, metadata } of EVENT_PATTERNS) {
    if (pattern.test(eventKey)) {
      return {
        ...metadata,
        severity: eventObj.severity || metadata.severity,
        confidence: metadata.confidence * 0.9 // Lower confidence for pattern match
      };
    }
  }
  
  // 3. Not found - return null (caller should use AI fallback)
  return null;
}

/**
 * Check if event should use fast local classification
 */
export function hasFastMapping(event: string): boolean {
  const eventKey = event.toLowerCase().trim();
  
  if (FAST_EVENT_MAP[eventKey]) {
    return true;
  }
  
  for (const { pattern } of EVENT_PATTERNS) {
    if (pattern.test(eventKey)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get all fast-mapped events
 */
export function getFastMappedEvents(): string[] {
  return Object.keys(FAST_EVENT_MAP);
}

/**
 * Register custom fast event mapping
 * Useful for app-specific reactions
 */
export function registerFastEvent(eventName: string, metadata: ReactionMetadata): void {
  FAST_EVENT_MAP[eventName.toLowerCase()] = metadata;
}
