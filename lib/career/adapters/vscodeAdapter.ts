/**
 * VS Code Adapter
 * 
 * Uses existing Workspace/VS Code system (modules/workspace)
 * Creates coding practice tasks
 */

import capabilityManager from '@/lib/capabilityManager';
import type { JobProfile } from '@/modules/career/career.types';

export const vscodeAdapter = {
  /**
   * Create Practice Tasks
   * Generates coding practice tasks in workspace
   */
  async createPracticeTasks(params: {
    missionId: string;
    userId: string;
    codingTopics: string[];
    role: string;
  }): Promise<any> {
    const { missionId, userId, codingTopics, role } = params;
    
    // Check capability for filesystem
    const hasPermission = await capabilityManager.checkCapabilities(['filesystem.write']);
    
    if (!hasPermission.granted) {
      await capabilityManager.requestCapability('filesystem.write', {
        source: 'career_agent',
        missionId,
        reason: 'Create coding practice tasks'
      });
      
      throw new Error('VSCODE_PERMISSION_REQUIRED');
    }
    
    // Generate practice tasks
    const tasks = codingTopics.map((topic, idx) => ({
      id: `task-${idx}`,
      missionId,
      userId,
      title: `${topic} Practice`,
      type: 'coding',
      topic,
      description: `Practice implementing ${topic} concepts`,
      difficulty: 'intermediate',
      files: generatePracticeFiles(topic),
      instructions: generateInstructions(topic, role)
    }));
    
    return {
      type: 'coding_practice',
      status: 'created',
      totalTasks: tasks.length,
      tasks,
      message: 'Coding tasks ready. Open VS Code to practice.',
      workspacePath: `~/smarty-ai/career/${missionId}/coding`
    };
  }
};

/**
 * Generate Practice Files
 * Creates starter code files for practice
 */
function generatePracticeFiles(topic: string): any[] {
  const topicLower = topic.toLowerCase();
  
  // Common patterns
  const patterns: Record<string, any[]> = {
    'react': [
      {
        name: `${topicLower.replace(/\s+/g, '-')}.tsx`,
        language: 'typescript',
        content: `import React from 'react';

/**
 * Task: Implement a ${topic} component
 * 
 * Requirements:
 * - Use TypeScript
 * - Implement proper state management
 * - Add error handling
 * - Include unit tests
 */

export const ${capitalize(topic)}Component: React.FC = () => {
  // TODO: Implement your solution
  
  return (
    <div>
      {/* Your component code */}
    </div>
  );
};
`
      }
    ],
    'api': [
      {
        name: `${topicLower.replace(/\s+/g, '-')}.ts`,
        language: 'typescript',
        content: `/**
 * Task: Implement ${topic} functionality
 * 
 * Requirements:
 * - Handle errors properly
 * - Add proper TypeScript types
 * - Include validation
 */

export async function ${camelCase(topic)}() {
  // TODO: Implement your solution
  
}
`
      }
    ]
  };
  
  // Return pattern-specific files or default
  return patterns[topicLower] || [
    {
      name: `${topicLower.replace(/\s+/g, '-')}.js`,
      language: 'javascript',
      content: `/**
 * Task: ${topic}
 * 
 * Requirements:
 * - Implement the solution
 * - Handle edge cases
 * - Write clean code
 */

function ${camelCase(topic)}() {
  // TODO: Implement your solution
  
}

module.exports = { ${camelCase(topic)} };
`
    }
  ];
}

/**
 * Generate Instructions
 */
function generateInstructions(topic: string, role: string): string {
  return `
# ${topic} Practice Task

## Objective
Implement a solution demonstrating your knowledge of ${topic}.

## Requirements
- Write clean, readable code
- Include error handling
- Add comments for complex logic
- Consider edge cases

## Context
Role: ${role}

## Success Criteria
- ✅ Solution works correctly
- ✅ Code is well-structured
- ✅ Handles errors gracefully
- ✅ Includes necessary comments

## Time Estimate
30-45 minutes
`;
}

// Helper functions
function capitalize(str: string): string {
  return str.split(/\s+/).map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join('');
}

function camelCase(str: string): string {
  const words = str.split(/\s+/);
  return words[0].toLowerCase() + words.slice(1).map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join('');
}
