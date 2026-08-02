import { z } from "zod";

const hslColorSchema = z.string().regex(/^\d{1,3}(?:\.\d+)? \d{1,3}(?:\.\d+)?% \d{1,3}(?:\.\d+)?%$/);
const percentageSchema = z.number().int().min(0).max(100);

export const desktopSettingsUpdateSchema = z.object({
  fontSize: z.number().int().min(11).max(20).optional(),
  dockPosition: z.enum(["bottom", "right"]).optional(),
  pinnedDockApps: z.array(z.string().min(1).max(80)).max(40).optional(),
  dockSize: z.number().int().min(36).max(72).optional(),
  dockMagnification: z.boolean().optional(),
  autoHideDock: z.boolean().optional(),
  folderColor: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
  backgroundColor: hslColorSchema.optional(),
  darkMode: z.boolean().optional(),
  themeColor: hslColorSchema.optional(),
  backgroundImage: z.union([z.literal(""), z.string().url().max(2048)]).optional(),
  wallpaperQuery: z.string().max(200).optional(),
  githubProfile: z.string().regex(/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i).optional(),
  gestureControl: z.boolean().optional(),
  tapToClick: z.boolean().optional(),
  naturalScrolling: z.boolean().optional(),
  threeFingerDrag: z.boolean().optional(),
  reduceMotion: z.boolean().optional(),
  reduceTransparency: z.boolean().optional(),
  increaseContrast: z.boolean().optional(),
  screenBrightness: percentageSchema.optional(),
  soundVolume: percentageSchema.optional(),
  muted: z.boolean().optional(),
  interfaceSounds: z.boolean().optional(),
  notificationsEnabled: z.boolean().optional(),
  notificationPreview: z.enum(["Always", "When Unlocked", "Never"]).optional(),
  focusMode: z.boolean().optional(),
  wifiEnabled: z.boolean().optional(),
  bluetoothEnabled: z.boolean().optional(),
  locationServices: z.boolean().optional(),
  analyticsSharing: z.boolean().optional(),
  showBatteryPercentage: z.boolean().optional(),
  lowPowerMode: z.boolean().optional(),
  keyboardBrightness: percentageSchema.optional(),
  keyRepeat: percentageSchema.optional(),
  language: z.string().min(1).max(80).optional(),
  region: z.string().min(1).max(80).optional(),
  use24HourTime: z.boolean().optional(),
  automaticBrightness: z.boolean().optional(),
  preferredSearchEngine: z.enum(["Google", "Bing", "DuckDuckGo"]).optional(),
  appLockEnabled: z.boolean().optional(),
  lockedApps: z.array(z.string().min(1).max(80)).max(40).optional(),
}).strict();

export type DesktopSettingsUpdate = z.infer<typeof desktopSettingsUpdateSchema>;

export const appLockPasswordSchema = z.object({
  password: z.string().min(4).max(72),
}).strict();