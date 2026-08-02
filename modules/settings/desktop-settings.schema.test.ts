import { describe, expect, it } from "vitest";

import { desktopSettingsUpdateSchema } from "./desktop-settings.schema";

describe("desktopSettingsUpdateSchema", () => {
  it("accepts every user-controlled desktop setting", () => {
    const result = desktopSettingsUpdateSchema.safeParse({
      fontSize: 16,
      dockPosition: "right",
      pinnedDockApps: ["Finder", "Settings"],
      dockSize: 60,
      dockMagnification: false,
      autoHideDock: false,
      folderColor: "#9de9ff",
      backgroundColor: "240 5.9% 10%",
      darkMode: true,
      themeColor: "211 100% 50%",
      backgroundImage: "https://example.com/wallpaper.jpg",
      wallpaperQuery: "macOS mountains",
      githubProfile: "vibhavtrivediWEBDEV",
      gestureControl: true,
      tapToClick: true,
      naturalScrolling: true,
      threeFingerDrag: true,
      reduceMotion: false,
      reduceTransparency: false,
      increaseContrast: true,
      screenBrightness: 80,
      soundVolume: 65,
      muted: false,
      interfaceSounds: true,
      notificationsEnabled: true,
      notificationPreview: "When Unlocked",
      focusMode: false,
      wifiEnabled: true,
      bluetoothEnabled: true,
      locationServices: true,
      analyticsSharing: false,
      showBatteryPercentage: true,
      lowPowerMode: false,
      keyboardBrightness: 60,
      keyRepeat: 55,
      language: "English",
      region: "India",
      use24HourTime: false,
      automaticBrightness: true,
      preferredSearchEngine: "DuckDuckGo",
      appLockEnabled: true,
      lockedApps: ["Mail", "Notes"],
    });

    expect(result.success).toBe(true);
  });

  it("rejects unknown or invalid settings", () => {
    expect(desktopSettingsUpdateSchema.safeParse({ gestureControl: true, unknown: true }).success).toBe(false);
    expect(desktopSettingsUpdateSchema.safeParse({ screenBrightness: 101 }).success).toBe(false);
  });
});