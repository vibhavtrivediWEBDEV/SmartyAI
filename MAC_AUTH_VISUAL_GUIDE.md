# Mac Auth Flow - Visual User Journey

## 🎬 Complete Flow Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                        START: User navigates to                 │
│                     /sign-in or /sign-up                       │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         ↓
┌────────────────────────────────────────────────────────────────┐
│                    🔌 MAC POWER SCREEN                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                            │ │
│  │                      ⚡ Apple Logo                         │ │
│  │                                                            │ │
│  │                  [Power Button Icon]                       │ │
│  │                                                            │ │
│  │                   "Press power to start"                   │ │
│  │                                                            │ │
│  └──────────────────────────────────────────────────────────┘  │
│  Background: Black with Golden Gate wallpaper                  │
│  Action: Click power button to boot                            │
└────────────────────────┬───────────────────────────────────────┘
                         │ [Click Power Button]
                         ↓
┌────────────────────────────────────────────────────────────────┐
│                    🍎 BOOT ANIMATION                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                            │ │
│  │                      🍎 Logo                               │ │
│  │                      (Large)                               │ │
│  │                                                            │ │
│  │              ████████████░░░░░░░░░░░                       │ │
│  │                  Progress Bar                              │ │
│  │                                                            │ │
│  └──────────────────────────────────────────────────────────┘  │
│  Duration: 3 seconds                                            │
│  Progress: 0% → 100% with slight randomization                  │
└────────────────────────┬───────────────────────────────────────┘
                         │ [Auto-transition]
                         ↓
         ┌───────────────┴────────────────┐
         │                                │
    [First Time]                     [Returning User]
         │                                │
         ↓                                ↓
┌─────────────────────┐         ┌──────────────────────┐
│   SIGN IN SCREEN    │         │   LOCK SCREEN       │
│                     │         │                      │
│  • Email Field      │         │  🕐 14:32          │
│  • Password Field   │         │  Monday, Aug 12     │
│                     │         │                      │
│  [Create Account]   │         │  👤 [User Photo]    │
│       ↓             │         │     John Doe        │
│                     │         │                      │
│  [Sign In Button]   │         │  🔒 Enter Password  │
└─────────┬───────────┘         └──────────┬───────────┘
          │                                │
          ↓                                │
   [Click "Create one"]                     │
          │                                 │
          ↓                                 │
┌────────────────────────┐                  │
│  CREATE ACCOUNT        │                  │
│                        │                  │
│  🐼 🐄 🐔 🦊 🦉       │                  │
│  [Avatars]             │                  │
│                        │                  │
│  • Full Name           │                  │
│  • Account Name        │                  │
│  • Email               │                  │
│  • Password            │                  │
│  • Verify Password     │                  │
│                        │                  │
│  📄 Upload Resume      │                  │
│  (Required - PDF)      │                  │
│                        │                  │
│  [Continue Button]     │                  │
└──────────┬─────────────┘                  │
           │                                 │
           ↓                                 │
    [Form Validation]                        │
           │                                 │
           ↓                                 │
┌────────────────────────┐                  │
│  ACCOUNT CREATION      │                  │
│                        │                  │
│  ⏳ Creating Account   │                  │
│  ⏳ Uploading Resume   │                  │
│  ⏳ Processing Profile │                  │
│                        │                  │
│  ✓ Success!            │                  │
└──────────┬─────────────┘                  │
           │                                 │
           ↓                                 │
┌──────────────────────────────┐            │
│      LOCK SCREEN             │            │
│                              │            │
│   🕐 14:32                   │            │
│   Monday, Aug 12            │◄───────────┘
│                              │
│   👤 [Avatar or Photo]       │
│       John Doe               │
│                              │
│   🔒 Enter Password          │
│   [Password Input Field]     │
│                              │
│   "Type your password to     │
│    unlock"                   │
└──────────┬───────────────────┘
           │ [Enter Password]
           ↓
    [Password Verification]
           │
           ├─ [Wrong] → Shake + Error Message
           │
           └─ [Correct] →
                    ↓
┌────────────────────────────────────────────────────────────────┐
│                        🖥️ DESKTOP                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  🍎 Menu Bar | File Edit View Go Window Help    🔋 WiFi  │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                            │ │
│  │                    🌊 VibhavMacOS Desktop                  │ │
│  │                                                            │ │
│  │   📁 Projects    📄 Resume    📁 About Me                  │ │
│  │                                                            │ │
│  │                     🚀 Dock                                │ │
│  │    [Finder] [Safari] [Maps] [Terminal] [AI] [Settings]   │ │
│  │                                                            │ │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                         │
                         ↓
                   ✅ FULL ACCESS
              • All Apps Available
              • User's Resume Profile
              • AI-Powered Features
              • Personalized Desktop
```

## 🎨 Visual Design Elements

### Power Screen
```
┌─────────────────────────────────────┐
│                                     │
│         (Black Background)          │
│                                     │
│              ⚡ Apple Logo          │
│                                     │
│          ⚪ Power Button             │
│              (Circle)               │
│                                     │
│         "Press power to start"      │
│                                     │
└─────────────────────────────────────┘
```

### Lock Screen
```
┌─────────────────────────────────────┐
│    (Golden Gate Wallpaper + Blur)   │
│                                     │
│          🕐 14:32                   │
│       Monday, August 12              │
│                                     │
│                                     │
│          👤 [Profile Photo]         │
│            John Doe                 │
│                                     │
│      🔒 Enter password              │
│     [___________________]           │
│                                     │
│    "Type your password to unlock"  │
│                                     │
└─────────────────────────────────────┘
```

### Create Account Screen
```
┌─────────────────────────────────────┐
│  (Glassmorphism Card - White)       │
│                                     │
│  ← [Back]                           │
│                                     │
│  "Create a Mac Account"             │
│                                     │
│  🐼 🐄 🐔 🦊 🦉                    │
│  [Avatar Selection]                 │
│                                     │
│  Full Name: [_______________]       │
│  Account:   [_______________]       │
│  Email:     [_______________]       │
│  Password:  [_______________]       │
│  Verify:    [_______________]       │
│                                     │
│  📄 Upload Resume (Required)        │
│  [Choose File or Drag & Drop]       │
│                                     │
│     [Go Back]    [Continue →]       │
│                                     │
└─────────────────────────────────────┘
```

## 🔐 Security Flow

```
┌─────────────────┐
│ User Password   │
└────────┬────────┘
         │
         ↓
┌─────────────────────────┐
│ Encryption (Firebase)   │
└────────┬────────────────┘
         │
         ├─ Stored in Firebase Auth
         ├─ Hashed & Salted
         └─ Session Token Generated
         │
         ↓
┌─────────────────────────┐
│ Local Storage (Client)  │
└────────┬────────────────┘
         │
         ├─ lock_username
         ├─ lock_password (session)
         ├─ lock_profile_photo
         └─ setup_completed
         │
         ↓
┌─────────────────────────┐
│  Desktop Access Granted │
└─────────────────────────┘
```

## 📱 Responsive Design

### Mobile (< 768px)
- Full-screen auth flow
- Larger touch targets
- Simplified animations
- Vertical layout

### Desktop (≥ 768px)
- Centered card layout
- Full animations
- Side-by-side elements
- Keyboard shortcuts enabled

## ⚡ Performance Optimizations

1. **Lazy Load Components**
   - Auth screens loaded on demand
   - Desktop loaded only after unlock

2. **Optimized Assets**
   - Compressed wallpapers
   - SVG icons
   - No heavy libraries

3. **State Management**
   - Minimal re-renders
   - Local state for auth flow
   - Global state only for desktop

## 🎯 Key Differences from Standard Auth

| Feature | Standard Auth | Mac Auth Flow |
|---------|---------------|---------------|
| Loading | Spinner | Apple boot animation |
| Sign Up | Simple form | Multi-step wizard |
| Resume | Optional | **Required** |
| Lock Screen | None | Password protection |
| Desktop Access | Immediate | After unlock |
| User Experience | Web-like | Desktop OS-like |
| Multipage | Multiple routes | Single flow |

---

**Visual Guide Version**: 1.0
**Date**: August 12, 2026
