SmartyFinderHelper

Minimal Swift helper (HTTP listener) to present a native file chooser and return the selected POSIX path as JSON.

Why this helper
- Runs as a signed macOS process so TCC Automation permissions are attributed to this helper.
- Exposes a local HTTP endpoint `POST http://127.0.0.1:45678/choose-file` which returns `{ success, filePath, operationIds }`.

Build & run (Xcode / SwiftPM)
1. Open in Xcode: `File → Open` and select the `Package.swift` in this folder. Xcode will import as a Swift package.
2. IMPORTANT: In the Xcode project settings, set the target's "Signing & Capabilities" to use your Apple ID team (for local dev). This signs the helper so macOS attributes Automation grants to it.
3. Add `NSAppleEventsUsageDescription` (and optionally `NSMicrophoneUsageDescription` etc.) to the app's Info.plist with a user-visible reason string.
4. To make the helper persistent across logins, build an `.app` bundle (Product → Archive or build for release), copy the resulting `SmartyFinderHelper.app` into `/Applications`, and install the included `LaunchAgents/com.smarty.finderhelper.plist` into `~/Library/LaunchAgents`.
	A convenience script `install-helper.sh` is included to copy the app and register the launch agent (requires sudo to copy into /Applications).
4. Build and run from Xcode. The helper will start an HTTP server on `127.0.0.1:45678` and print a startup message.

Testing
- From any terminal or the browser, you can call:

```
curl -X POST http://127.0.0.1:45678/choose-file -d '{}' -H 'Content-Type: application/json'
```

- The helper will open a native file chooser. After selection it returns JSON.

Notes
- For distribution outside your machine, sign with an Apple Developer ID and notarize the app to avoid persistent TCC issues on other machines.
- This scaffold uses the Swifter HTTP server (https://github.com/httpswift/swifter). Xcode/SwiftPM will fetch the dependency.

Auto-start (login) support
- A sample `LaunchAgents/com.smarty.finderhelper.plist` is provided. After building and placing `SmartyFinderHelper.app` in `/Applications`, run:

```
./install-helper.sh
```

This copies the app to `/Applications`, installs the plist into `~/Library/LaunchAgents`, and loads it via `launchctl` so the helper runs on login.
