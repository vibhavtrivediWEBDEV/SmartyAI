#!/usr/bin/env bash
# Generate an Xcode project wrapper for the SwiftPM helper using swift package tools.
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)/.."
OUT_DIR="${ROOT_DIR}/XcodeProject"
echo "Generating Xcode project into ${OUT_DIR}"
rm -rf "${OUT_DIR}"
mkdir -p "${OUT_DIR}"
cd "${ROOT_DIR}"
if command -v swift >/dev/null 2>&1; then
  swift package generate-xcodeproj --output "${OUT_DIR}" || true
  echo "Xcode project scaffold generated at ${OUT_DIR}. Open in Xcode and add signing as needed."
else
  echo "swift not found on PATH; open Package.swift in Xcode instead and create a project via File → Swift Packages → Add Package Dependency."
fi
