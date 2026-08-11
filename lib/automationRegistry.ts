import automationTemplates from '@/data/dekstop.json';

export interface AutomationTemplate {
  intent: string;
  parameters?: Record<string, any>;
}

export interface ResolvedAutomation {
  sequence: any[];
  message: string;
}

/**
 * Automation Registry - Maps intents to executable workflows
 * 
 * The registry is the SOURCE OF TRUTH for automation capabilities.
 * AI should SELECT templates, not GENERATE sequences.
 */
export class AutomationRegistry {
  private templates: Record<string, any[]>;

  constructor() {
    this.templates = automationTemplates as Record<string, any[]>;
  }

  /**
   * Get all available automation intents
   */
  getAvailableIntents(): string[] {
    return Object.keys(this.templates);
  }

  /**
   * Check if an intent exists in the registry
   */
  hasIntent(intent: string): boolean {
    return intent in this.templates;
  }

  /**
   * Get template for an intent
   */
  getTemplate(intent: string): any[] | null {
    return this.templates[intent] || null;
  }

  /**
   * Resolve parameters in a template
   * Replaces {{variable}} with actual values
   */
  resolveParameters(template: any[], parameters: Record<string, any>): any[] {
    const resolved = JSON.stringify(template);

    // Replace all {{variable}} with actual values
    let resolvedStr = resolved;
    for (const [key, value] of Object.entries(parameters)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      resolvedStr = resolvedStr.replace(regex, String(value));
    }

    console.log('🔄 Resolved automation:', { original: template.length, resolved: JSON.parse(resolvedStr).length });
    console.log('📊 Parameters applied:', parameters);

    return JSON.parse(resolvedStr);
  }

  /**
   * Get required parameters for a template
   * Scans template for {{variable}} patterns
   */
  getRequiredParameters(template: any[]): string[] {
    const templateStr = JSON.stringify(template);
    const regex = /\{\{(\w+)\}\}/g;
    const params: string[] = [];
    let match;

    while ((match = regex.exec(templateStr)) !== null) {
      if (!params.includes(match[1])) {
        params.push(match[1]);
      }
    }

    return params;
  }

  /**
   * Check if template has dynamic targets (like {{wallpaperResultId}})
   * that need runtime resolution
   */
  hasDynamicTargets(template: any[]): boolean {
    const params = this.getRequiredParameters(template);
    // Filter out simple parameters like 'prompt', 'hexColor', 'fontSize', 'updateState'
    // Also exclude mail parameters: recipient, subject, senderName, tone
    const dynamicParams = params.filter(p => 
      !['prompt', 'hexColor', 'fontSize', 'updateState', 'recipient', 'subject', 'senderName', 'tone'].includes(p)
    );
    return dynamicParams.length > 0;
  }

  /**
   * Resolve dynamic targets at runtime
   * For wallpaper: Wait for results to load, then find matching element
   */
  async resolveDynamicTargets(
    template: any[], 
    parameters: Record<string, any>,
    context?: { searchQuery?: string; username?: string }
  ): Promise<{ sequence: any[], resolvedParams: Record<string, any> }> {
    const sequence = [...template];
    const resolvedParams = { ...parameters };

    // Add username to resolved params if available
    if (context?.username) {
      resolvedParams.username = context.username;
    }

    // Check for wallpaperResultId
    if (template.some((cmd: any) => cmd.target === '{{wallpaperResultId}}')) {
      console.log('🔍 Resolving wallpaperResultId...');
      
      // Find the index where we need to insert the wait
      const clickIndex = sequence.findIndex((cmd: any) => 
        cmd.target === '{{wallpaperResultId}}'
      );
      
      if (clickIndex > -1) {
        // Insert wait before clicking wallpaper results
        // Wait for images to load (up to 8 seconds for slow connections)
        sequence.splice(clickIndex, 0, {
          action: 'wait',
          target: 'wallpaper_results_container',
          params: { 
            timeout: 8000, // Increased timeout for slow networks
            checkInterval: 300, // Check every 300ms
            condition: 'imagesLoaded'
          }
        });

        // Replace {{wallpaperResultId}} with first wallpaper result button
        // The first wallpaper result has id="new_wallpaper_0"
        const wallpaperResultId = 'new_wallpaper_0';
        resolvedParams.wallpaperResultId = wallpaperResultId;
        
        // Update sequence with resolved target
        sequence.forEach((cmd: any) => {
          if (cmd.target === '{{wallpaperResultId}}') {
            cmd.target = wallpaperResultId;
          }
        });
      }
    }

    // Check for themeId
    if (template.some((cmd: any) => cmd.target === '{{themeId}}')) {
      // Replace with first available theme
      const themeId = parameters.themeId || 'theme_option_1';
      resolvedParams.themeId = themeId;
      
      sequence.forEach((cmd: any) => {
        if (cmd.target === '{{themeId}}') {
          cmd.target = themeId;
        }
      });
    }

    // Now resolve all {{variable}} patterns with actual values
    const resolvedStr = JSON.stringify(sequence).replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return resolvedParams[key] !== undefined ? String(resolvedParams[key]) : match;
    });

    return {
      sequence: JSON.parse(resolvedStr),
      resolvedParams
    };
  }

  /**
   * Get template info for AI context
   */
  getTemplateInfo(): Record<string, { params: string[], hasDynamicTargets: boolean }> {
    const info: Record<string, { params: string[], hasDynamicTargets: boolean }> = {};

    for (const [intent, template] of Object.entries(this.templates)) {
      const params = this.getRequiredParameters(template);
      const hasDynamic = this.hasDynamicTargets(template);
      
      info[intent] = {
        params,
        hasDynamicTargets: hasDynamic
      };
    }

    return info;
  }
}

// Singleton instance
export const automationRegistry = new AutomationRegistry();
