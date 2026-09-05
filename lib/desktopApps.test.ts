import { describe, expect, it } from 'vitest'

import {
  canPinDesktopApp,
  DEFAULT_DOCK_APPS,
  migratePinnedDockApps,
} from './desktopApps'

describe('desktop dock policy', () => {
  it('uses only the daily Career apps in the default Dock', () => {
    expect(DEFAULT_DOCK_APPS).toEqual([
      'Finder',
      'Calendar',
      'Notes',
      'vscode',
      'Youtube',
      'Career',
      'App Store',
    ])
  })

  it.each(['Safari', 'Maps', 'FaceTime', 'Messages'])(
    'keeps %s in the App Store instead of the Dock',
    (appName) => {
      expect(canPinDesktopApp(appName)).toBe(false)
    },
  )

  it('migrates the legacy default without replacing a custom Dock', () => {
    expect(migratePinnedDockApps([
      'Finder', 'Safari', 'Maps', 'FaceTime', 'Messages', 'Mail', 'Calendar',
      'Career', 'Music', 'Terminal', 'vscode', 'App Store', 'Settings',
    ])).toEqual(DEFAULT_DOCK_APPS)

    expect(migratePinnedDockApps(['Finder', 'Maps', 'Notes', 'figma']))
      .toEqual(['Finder', 'Notes', 'figma'])
  })
})