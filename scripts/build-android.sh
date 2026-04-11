#!/bin/bash
set -e

# Build script for Android APK
# Builds web app using the original vite.config.ts

BUILD_OUTPUT_DIR="/app/build-output"
APK_PATH="${BUILD_OUTPUT_DIR}/tick-tack-boom.apk"

echo "Starting Android build..."

# Only run npm install if package.json changed
if [ ! -f "package.json" ] || [ ! -f "node_modules/.package-lock.json" ] || [ "package.json" -nt "node_modules/.package-lock.json" ]; then
    echo "Installing dependencies..."
    npm ci --omit=optional 2>/dev/null || npm install --omit=optional
    npm ci --include=optional 2>/dev/null || npm install --include=optional
else
    echo "Skipping npm install (dependencies unchanged)"
fi

# Only regenerate assets if source images changed
ASSET_SOURCE_DIR="resources"
if [ -d "android/app/src/main/res" ] && [ ! "${ASSET_SOURCE_DIR}" -nt "android/app/src/main/res" ]; then
    echo "Skipping asset generation (assets unchanged)"
else
    echo "Generating Android launcher icons..."
    npm run assets:android
fi

# Build web app
echo "Building web application..."
npm run build

# Sync Capacitor
echo "Syncing Capacitor..."
npx cap sync android

# Build Android APK
cd android
echo "Building Android APK..."
./gradlew assembleDebug --no-daemon
cd ..

# Copy APK to output directory
echo "Copying APK to build-output..."
mkdir -p "${BUILD_OUTPUT_DIR}"
cp android/app/build/outputs/apk/debug/tick-tack-boom-debug.apk "${BUILD_OUTPUT_DIR}/tick-tack-boom.apk"

echo ""
echo "=========================================="
echo "Build complete!"
echo "APK location: ${BUILD_OUTPUT_DIR}/tick-tack-boom.apk"
ls -lh "${APK_PATH}"
echo "=========================================="
