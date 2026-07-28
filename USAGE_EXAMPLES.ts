/**
 * USAGE EXAMPLE - How to use the NEW architecture
 * 
 * This file demonstrates the new architecture patterns.
 * Copy these patterns when refactoring existing code.
 */

// ============================================================
// EXAMPLE 1: Opening Windows (NEW vs OLD)
// ============================================================

// ❌ OLD WAY (deprecated)
/**
 * const openApplication = (appName: string) => {
 *   switch(appName) {
 *     case "Terminal":
 *       component = <TerminalUI />
 *       title = "Terminal"
 *       icon = "/icons/terminal.png"
 *       width = 500
 *       height = 300
 *       break;
 *     // ... 40 more cases
 *   }
 *   const newWindow = { id: ..., x: ..., y: ... }
 *   setOpenWindows(prev => [...prev, newWindow])
 * }
 */

// ✅ NEW WAY (recommended)
import { useWindowManager } from '@/hooks/useWindowManager'

function Desktop() {
  const windowManager = useWindowManager({ desktopRef })
  
  // One line to open any app
  const handleOpenTerminal = () => {
    windowManager.openWindow('Terminal')
  }
  
  // With custom position
  const handleOpenAtPosition = () => {
    windowManager.openWindow('Settings', 100, 200)
  }
  
  // All apps work the same way!
  const openApp = (appName: string) => {
    windowManager.openWindow(appName)
  }
}

// ============================================================
// EXAMPLE 2: Getting App Configuration
// ============================================================

import { getAppConfig } from '@/lib/appRegistry'

// Get app details
const config = getAppConfig('Terminal')

if (config) {
  console.log(config.displayName)     // "Terminal"
  console.log(config.defaultWidth)     // 600
  console.log(config.category)        // "system"
  console.log(config.automatable)     // true
}

// ============================================================
// EXAMPLE 3: Window Operations
// ============================================================

const windowManager = useWindowManager({ desktopRef })

// Open
windowManager.openWindow('Terminal')

// Close
windowManager.closeWindow(windowId)

// Minimize
windowManager.minimizeWindow(windowId)

// Maximize
windowManager.maximizeWindow(windowId)

// Focus (bring to front)
windowManager.focusWindow(windowId)

// Get all windows
const allWindows = windowManager.getAllWindows()

// Find window by app name
const settingsWindow = windowManager.getWindowByAppName('Settings')

// Get active (top) window
const activeWindow = windowManager.getActiveWindow()

// Clear all
windowManager.clearAllWindows()

// ============================================================
// EXAMPLE 4: Desktop Utilities
// ============================================================

import {
  calculateWindowPosition,
  constrainToBounds,
  centerWindow,
  isMobileViewport
} from '@/lib/desktopUtils'

// Calculate smart position
const pos = calculateWindowPosition(
  existingWindows,
  'Terminal',
  containerWidth,
  containerHeight,
  600,
  400
)

// Constrain to bounds
const constrained = constrainToBounds(
  pos.x,
  pos.y,
  width,
  height,
  containerWidth,
  containerHeight
)

// Center window
const centered = centerWindow(600, 400, 1920, 1080)

// Check mobile
const isMobile = isMobileViewport()

// ============================================================
// EXAMPLE 5: Automation Integration
// ============================================================

import { validateAppForAutomation } from '@/lib/integrationHelpers'

// Validate before automation
const validation = validateAppForAutomation('Terminal')

if (validation.exists && validation.automatable) {
  // Safe to execute automation
}

// Get all automatable apps
import { getAutomatableAppNames } from '@/lib/integrationHelpers'
const apps = getAutomatableAppNames() // ['Terminal', 'Settings', ...]

// ============================================================
// EXAMPLE 6: Adding New App (Super Simple!)
// ============================================================

/**
 * STEP 1: Create component
 * 
 * // components/Dekstop/NewApp.tsx
 * export default function NewApp({ automationAPI, ...props }) {
 *   return <div>My New App</div>
 * }
 */

/**
 * STEP 2: Add to registry (lib/appRegistry.ts)
 * 
 * import NewApp from '@/components/Dekstop/NewApp'
 * 
 * export const APP_REGISTRY = {
 *   // ...existing apps
 *   
 *   NewApp: {
 *     name: 'NewApp',
 *     displayName: 'New App',
 *     icon: '/icons/app.png',
 *     component: NewApp,
 *     defaultWidth: 800,
 *     defaultHeight: 600,
 *     automatable: true,
 *     category: 'productivity'
 *   }
 * }
 */

/**
 * STEP 3: Add to dock (components/Dekstop/deskstop.tsx)
 * 
 * const dockAppIcons = [
 *   { name: "NewApp", icon: <AppIcon /> },
 *   // ...other apps
 * ]
 */

/**
 * DONE! No switch-case, no duplication!
 */

// ============================================================
// EXAMPLE 7: Voice Commands with New Architecture
// ============================================================

import { getAutomatableAppNames } from '@/lib/integrationHelpers'

// System prompt for AI
const systemPrompt = `
Available apps that can be opened:
${getAutomatableAppNames().join(', ')}

Commands:
- "AUTOMATE: terminal.open"
- "AUTOMATE: settings.wallpaper.change | prompt: mountains"
`

// ============================================================
// EXAMPLE 8: Integration with Existing Code
// ============================================================

// During migration, use integration helpers
import { migrateAppName, getAppDisplayName } from '@/lib/integrationHelpers'

// Convert old app name to new
const newAppName = migrateAppName('terminal') // 'Terminal'

// Get display name for UI
const displayName = getAppDisplayName('Terminal') // 'Terminal'

// ============================================================
// EXAMPLE 9: Category Management
// ============================================================

import { getAppsByCategory, getAppsForLaunchpad } from '@/lib/appRegistry'

// Get all system apps
const systemApps = getAppsByCategory('system')

// Get apps grouped by category
const categoryGroups = getAppsForLaunchpad()
/**
 * {
 *   system: ['Terminal', 'Settings', 'Finder', 'App Store'],
 *   productivity: ['Safari', 'Notes', 'Calendar', ...],
 *   media: ['Spotify', 'Youtube', 'Photos', ...],
 *   development: ['vscode', 'figma', 'Excel Editor'],
 *   utility: ['game', 'Projects', ...]
 * }
 */

// ============================================================
// EXAMPLE 10: App Search
// ============================================================

import { searchApps } from '@/lib/integrationHelpers'

// Search for apps
const results = searchApps('term')
// Returns: [{ name: 'Terminal', ... }]

// ============================================================
// MIGRATION CHECKLIST
// ============================================================

/**
 * ✅ Replace switch-case with app registry
 * ✅ Use useWindowManager instead of direct state
 * ✅ Import utilities from desktopUtils.ts
 * ✅ Use integration helpers for migration
 * ✅ Update voice commands to use registry
 * ✅ Add new apps to registry (not switch-case)
 * ✅ Test automation with new app names
 */

// ============================================================
// BENEFITS SUMMARY
// ============================================================

/**
 * 📦 Single Source of Truth
 * All app configs in one place (appRegistry.ts)
 * 
 * 🧹 No Duplication
 * No more 500-line switch-cases
 * 
 * 🎯 Type Safety
 * TypeScript knows all app configs
 * 
 * 🧪 Testability
 * Pure functions, isolated hooks
 * 
 * 🚀 Scalability
 * Add 100 apps with same pattern
 * 
 * 🔄 Ref Pattern
 * No stale closures
 * 
 * 🍎 Apple-Inspired
 * Clean, maintainable architecture
 */

export default 'Usage Examples'
