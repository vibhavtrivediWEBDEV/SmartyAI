#!/usr/bin/env bash
#!/usr/bin/env bash
# Build the SwiftPM helper, assemble a minimal .app bundle, install to /Applications, and register launchd plist
set -e
set -euo pipefail

APP_NAME="SmartyFinderHelper.app"
SRC_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="${SRC_DIR}"
BUILD_DIR="${ROOT_DIR}/.build/release"
SPM_BINARY_NAME="SmartyFinderHelper"
TARGET_APP_PATH="/Applications/${APP_NAME}"
PLIST_SOURCE="${ROOT_DIR}/LaunchAgents/com.smarty.finderhelper.plist"
PLIST_TARGET="$HOME/Library/LaunchAgents/com.smarty.finderhelper.plist"

echo "Installing $APP_NAME to /Applications (you may be prompted for a password)"
if [ -d "$TARGET" ]; then
  echo "Existing app found at $TARGET — overwriting"
  sudo rm -rf "$TARGET"
fi
echo "Building helper (swift build -c release)..."
(cd "${ROOT_DIR}" && swift build -c release)

echo "Installing launch agent plist to $PLIST_TARGET"
cp "$PLIST_SOURCE" "$PLIST_TARGET"

echo "Loading launch agent"
launchctl unload "$PLIST_TARGET" >/dev/null 2>&1 || true
launchctl load "$PLIST_TARGET"

echo "Installed and loaded. The helper should start automatically on login."
TMP_APP_DIR="/tmp/${APP_NAME}"
echo "Assembling ${APP_NAME} into ${TMP_APP_DIR}"
rm -rf "${TMP_APP_DIR}"
mkdir -p "${TMP_APP_DIR}/Contents/MacOS"
mkdir -p "${TMP_APP_DIR}/Contents/Resources"

echo "Copying binary"
cp "${BUILD_DIR}/${SPM_BINARY_NAME}" "${TMP_APP_DIR}/Contents/MacOS/${SPM_BINARY_NAME}"
chmod +x "${TMP_APP_DIR}/Contents/MacOS/${SPM_BINARY_NAME}"

echo "Copying Info.plist"
if [ -f "${ROOT_DIR}/AppBundle/Info.plist" ]; then
  cp "${ROOT_DIR}/AppBundle/Info.plist" "${TMP_APP_DIR}/Contents/Info.plist"
else
  cat > "${TMP_APP_DIR}/Contents/Info.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key>
  <string>SmartyFinderHelper</string>
  <key>CFBundleIdentifier</key>
  <string>com.smarty.finderhelper</string>
  <key>CFBundleExecutable</key>
  <string>${SPM_BINARY_NAME}</string>
  <key>CFBundleVersion</key>
  <string>1.0</string>
  <key>NSAppleEventsUsageDescription</key>
  <string>Smarty needs to control Finder to complete requested file operations.</string>
</dict>
</plist>
EOF
fi

echo "Installing app to /Applications (may require sudo)"
if [ -d "$TARGET_APP_PATH" ]; then
  echo "Removing existing app at $TARGET_APP_PATH"
  sudo rm -rf "$TARGET_APP_PATH"
fi
sudo cp -R "${TMP_APP_DIR}" "$TARGET_APP_PATH"

echo "Installing launch agent plist to ${PLIST_TARGET}"
cp "$PLIST_SOURCE" "$PLIST_TARGET"

echo "Loading launch agent"
launchctl unload "$PLIST_TARGET" >/dev/null 2>&1 || true
launchctl load "$PLIST_TARGET"

echo "Installed and loaded. The helper should start automatically on login."
