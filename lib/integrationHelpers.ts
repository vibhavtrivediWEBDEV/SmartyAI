/**
 * Integration helpers for new architecture
 * 
 * These functions bridge the gap between OLD and NEW architecture
 * during the migration period.
 */

import { getAppConfig, APP_REGISTRY, getAppNameMap } from './appRegistry'
import type { AppConfig } from './appRegistry'

/**
 * Get app name mapping for automation (NEW)
 * Replaces hardcoded APP_NAME_MAP in helper.ts
 */
export function getAppNameMapForAutomation(): Record<string, string> {
  return getAppNameMap()
}

/**
 * Check if app exists before automation
 */
export function validateAppForAutomation(appName: string): {
  exists: boolean
  automatable: boolean
  config?: AppConfig
} {
  const config = getAppConfig(appName)
  
  return {
    exists: !!config,
    automatable: config?.automatable !== false,
    config
  }
}

/**
 * Get app display name for window title
 */
export function getAppDisplayName(appName: string): string {
  const config = getAppConfig(appName)
  return config?.displayName || appName
}

/**
 * Get app icon path
 */
export function getAppIcon(appName: string): string {
  const config = getAppConfig(appName)
  return config?.icon || '/icons/default.png'
}

/**
 * Get all apps by category (for Launchpad)
 */
export function getAppsForLaunchpad(): Record<string, string[]> {
  const categories: Record<string, string[]> = {
    system: [],
    productivity: [],
    development: [],
    media: [],
    utility: []
  }
  
  Object.values(APP_REGISTRY).forEach(app => {
    if (app.category) {
      categories[app.category].push(app.name)
    }
  })
  
  return categories
}

/**
 * Get app default size
 */
export function getAppDefaultSize(appName: string): {
  width: number
  height: number
} {
  const config = getAppConfig(appName)
  
  return {
    width: config?.defaultWidth || 800,
    height: config?.defaultHeight || 600
  }
}

/**
 * Check if app supports multiple instances
 */
export function appAllowsMultiple(appName: string): boolean {
  const config = getAppConfig(appName)
  return !config?.singleton
}

/**
 * Migration helper: Convert OLD app name to NEW
 */
export function migrateAppName(oldAppName: string): string {
  const migrationMap: Record<string, string> = {
    'terminal': 'Terminal',
    'settings': 'Settings',
    'safari': 'Safari',
    'finder': 'Finder',
    'app store': 'App Store',
    'vscode': 'vscode',
    'chrome': 'chrome',
    'spotify': 'Spotify',
    'calendar': 'Calendar',
    'maps': 'Maps',
    'youtube': 'Youtube',
    'excel': 'Excel Editor',
    'mail': 'Mail',
    'pdf': 'PDF Viewer',
    'photos': 'Photos',
    'tv': 'TV',
    'game': 'game',
    'notes': 'Notes',
    'figma': 'figma'
  }
  
  return migrationMap[oldAppName.toLowerCase()] || oldAppName
}

/**
 * Get all automatable app names (for voice commands)
 */
export function getAutomatableAppNames(): string[] {
  return Object.values(APP_REGISTRY)
    .filter(app => app.automatable !== false)
    .map(app => app.name)
}

/**
 * Validate automation sequence app exists
 */
export function validateAutomationSequence(sequence: any[]): {
  valid: boolean
  invalidApps: string[]
} {
  const invalidApps: string[] = []
  
  sequence.forEach(action => {
    if (action.action === 'open' && action.target) {
      const validation = validateAppForAutomation(action.target)
      if (!validation.exists) {
        invalidApps.push(action.target)
      }
    }
  })
  
  return {
    valid: invalidApps.length === 0,
    invalidApps
  }
}

/**
 * Quick app lookup by partial name (for search)
 */
export function searchApps(query: string): AppConfig[] {
  const lowerQuery = query.toLowerCase()
  
  return Object.values(APP_REGISTRY).filter(app => 
    app.name.toLowerCase().includes(lowerQuery) ||
    app.displayName.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Get recommended app size for container
 */
export function getRecommendedAppSize(
  appName: string,
  containerWidth: number,
  containerHeight: number
): { width: number; height: number } {
  const config = getAppConfig(appName)
  
  if (!config) {
    return { width: 800, height: 600 }
  }
  
  // Don't exceed container size
  const maxWidth = Math.min(config.defaultWidth, containerWidth - 40)
  const maxHeight = Math.min(config.defaultHeight, containerHeight - 40)
  
  // Don't go below minimum
  const width = Math.max(maxWidth, config.minWidth || 200)
  const height = Math.max(maxHeight, config.minHeight || 150)
  
  return { width, height }
}

/**
 * Get app category color
 */
export function getAppCategoryColor(appName: string): string {
  const config = getAppConfig(appName)
  const colors: Record<string, string> = {
    system: '#6366f1',
    productivity: '#10b981',
    development: '#8b5cf6',
    media: '#f59e0b',
    utility: '#6b7280'
  }
  
  return colors[config?.category || 'utility'] || colors.utility
}
