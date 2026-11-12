#!/usr/bin/env bash
set -euo pipefail
repo_root="$(cd "$(dirname "$0")/.." && pwd)"
case "$repo_root" in
  "$HOME/Desktop/"*|"$HOME/Documents/"*) echo "Move this checkout outside iCloud Desktop/Documents before building." >&2; exit 1 ;;
esac
cd "$repo_root"
npm run build -w agent
xcodebuild -project macos/OpenClicky/OpenClicky.xcodeproj -scheme OpenClicky \
  -configuration Debug -destination 'platform=macOS,arch=arm64' \
  -derivedDataPath "$repo_root/.build/native" -clonedSourcePackagesDirPath "$repo_root/.build/packages" \
  -jobs 2 build CODE_SIGNING_ALLOWED=NO
app_path="$repo_root/.build/native/Build/Products/Debug/Drey Clicky.app"
test -d "$app_path"
echo "Built: $app_path"
echo 'Developer build; macOS permission grants and stable signing are separate steps.'
