# Swift Helper Signing Requirement (OpenClaw Pattern)

## 🚨 CRITICAL: TCC Grants Require Code Signing

Based on OpenClaw's macOS permissions documentation, **TCC (Transparency, Consent, and Control) grants are tied to**:

1. **Code signature** (Developer ID certificate)
2. **Bundle identifier** (e.g., `com.smartyai.helper`)
3. **On-disk path** (fixed installation location)

### Problem: Ad-hoc Signatures Don't Persist

Currently, our Swift helper is likely **ad-hoc signed** (or unsigned), which means:

- ❌ macOS generates a **new identity on every build**
- ❌ TCC grants are **forgotten after each rebuild**
- ❌ Users must re-grant Full Disk Access repeatedly
- ❌ No real permission persistence

### OpenClaw Research Findings

From [OpenClaw Issue #22179](https://github.com/openclaw/openclaw/issues/22179):

> TCC breaks when node binary path changes. Permissions are tied to the exact binary path that was granted.

From [OpenClaw Signing Guide](https://docs.openclaw.ai/platforms/mac/signing):

> Ad-hoc signatures create a new identity each time, causing macOS to treat the app as "new" and drop all previous permissions.

---

## ✅ Solution: Real Developer ID Signature

### Step 1: Get Apple Developer Certificate

1. Join Apple Developer Program ($99/year)
2. Request "Developer ID Application" certificate
3. Download and install in Keychain Access

### Step 2: Sign Swift Helper

```bash
# Build and sign helper
cd SmartyAI/SwiftHelper
swift build -c release

# Sign with Developer ID
codesign --force --sign "Developer ID Application: Your Name (TEAM_ID)" \
  --identifier "com.smartyai.helper" \
  --options runtime \
  .build/release/SmartyHelper

# Verify signature
codesign -dv --verbose=4 .build/release/SmartyHelper
```

### Step 3: Fixed Installation Path

```bash
# Install helper to fixed location
mkdir -p ~/SmartyAI/bin
cp .build/release/SmartyHelper ~/SmartyAI/bin/smarty-helper

# Helper must run from this exact path every time
~/SmartyAI/bin/smarty-helper
```

### Step 4: Notarize (Optional but Recommended)

```bash
# Notarize with Apple
xcrun notarytool submit SmartyHelper.zip \
  --apple-id "your@email.com" \
  --team-id "TEAM_ID" \
  --password "@keychain:AC_PASSWORD" \
  --wait

# Staple notarization ticket
xcrun stapler staple .build/release/SmartyHelper
```

---

## 🔄 Current Implementation Gap

### What We Have Now:
```typescript
// lib/fileSearchOrchestrator.ts
private async checkTCCPermission(location: SearchLocation) {
  // Calls Swift helper at 127.0.0.1:45678/check-permission
  // ❌ Helper is likely ad-hoc signed
  // ❌ TCC grant won't persist across builds
  // ❌ No real permission check happens
}
```

### What We Need:
```swift
// SwiftHelper/main.swift
// 1. Check if app has Full Disk Access
import Security

func hasFullDiskAccess() -> Bool {
    // OpenClaw pattern: Try reading a protected file
    let testPath = FileManager.default.homeDirectoryForCurrentUser
        .appendingPathComponent("Desktop")
    
    do {
        let contents = try FileManager.default.contentsOfDirectory(atPath: testPath.path)
        return true // Success = has permission
    } catch {
        // OpenClaw pattern: If file read fails, request via NSOpenPanel
        requestPermissionWithNSOpenPanel(for: testPath)
        return false
    }
}

func requestPermissionWithNSOpenPanel(for url: URL) {
    // NSOpenPanel automatically triggers macOS TCC dialog
    let panel = NSOpenPanel()
    panel.directoryURL = url
    panel.canChooseFiles = false
    panel.canChooseDirectories = true
    panel.allowsMultipleSelection = false
    panel.message = "SmartyAI needs access to search files"
    
    // User must click "Allow" in macOS system dialog
    panel.runModal()
}
```

---

## 📋 Implementation Checklist

### Development Mode:
- [x] Auto-grant permissions (bypass real TCC) for testing
- [x] Gate behind `NODE_ENV === 'development'`
- [x] Log warnings about fake permissions

### Production Mode:
- [ ] Swift helper signed with Developer ID certificate
- [ ] Fixed bundle identifier: `com.smartyai.helper`
- [ ] Fixed installation path: `~/SmartyAI/bin/smarty-helper`
- [ ] Notarized with Apple
- [ ] Real `/check-permission` endpoint implemented
- [ ] Real `/request-access` with NSOpenPanel
- [ ] Remove auto-grant logic entirely

### Permission Flow:
1. [ ] Orchestrator calls `/check-permission` for target location
2. [ ] If no permission → Set status `requesting_permission`
3. [ ] User clicks "Grant Permission" button
4. [ ] Swift helper calls `NSOpenPanel` → macOS shows system dialog
5. [ ] User clicks "Allow" in macOS dialog (takes real seconds)
6. [ ] Swift helper confirms grant → Returns success
7. [ ] Orchestrator proceeds with real search

---

## 🐛 Known Issues Without Signing

### Current Behavior (AD-HOC SIGNED):
```
1. Search triggered
2. mdfind returns results in <1 second
3. No macOS permission dialog shown
4. User thinks "Wow so fast!" ❌ WRONG
5. Real problem: No actual TCC grant happened
6. Next search will fail or show inconsistent results
```

### Expected Behavior (SIGNED HELPER):
```
1. Search triggered
2. /check-permission returns false
3. Set status: requesting_permission
4. User clicks "Grant Permission"
5. NSOpenPanel triggers macOS system dialog (takes 2-5 real seconds)
6. User clicks "Allow" in macOS dialog
7. Permission persisted indefinitely
8. Search proceeds with real filesystem access
9. Future searches don't need permission again
```

---

## 🔗 References

- [OpenClaw macOS Permissions](https://docs.openclaw.ai/platforms/mac/permissions)
- [OpenClaw macOS Signing](https://docs.openclaw.ai/platforms/mac/signing)
- [OpenClaw Issue #22179](https://github.com/openclaw/openclaw/issues/22179) - TCC breaks on path change
- [Apple Code Signing Guide](https://developer.apple.com/library/archive/documentation/Security/Conceptual/CodeSigningGuide/)
- [Apple Notarization Guide](https://developer.apple.com/documentation/xcode/notarizing_macos_software_before_distribution)

---

## 💡 Workaround for Testing (Without Signing)

### Option 1: Grant Full Disk Access to Terminal
```bash
# System Preferences → Security & Privacy → Privacy → Full Disk Access
# Add: Terminal.app or iTerm.app
# This grants permission to all processes launched from Terminal
```

**Warning**: This is INSECURE - grants access to ALL terminal commands.

### Option 2: Grant to Node Binary
```bash
# Find node path
which node

# Add to Full Disk Access:
# /opt/homebrew/bin/node (or your node path)
```

**Warning**: This grants access to ALL Node.js processes - also insecure.

### Option 3: Use App's Workspace Folder (OpenClaw Pattern)
```typescript
// Instead of searching Desktop/Documents directly:
// 1. Ask user to move files to ~/SmartyAI/workspace/
// 2. App has full access to its own workspace folder
// 3. Avoids TCC prompts entirely for workspace files

const WORKSPACE_DIR = path.join(os.homedir(), 'SmartyAI', 'workspace');

// Move to workspace instead of accessing original location
async function moveToWorkspace(filePath: string) {
  const fileName = path.basename(filePath);
  const destPath = path.join(WORKSPACE_DIR, fileName);
  await fs.copyFile(filePath, destPath);
  return destPath; // Now accessible without TCC
}
```

---

**Bottom Line**: Without proper code signing, **TCC grants will NEVER persist reliably**. The "instant search results" you're seeing are cached Spotlight data, not real filesystem access. For production, signing is MANDATORY.
