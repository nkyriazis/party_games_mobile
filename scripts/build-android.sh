#!/bin/bash
set -e

# Incremental build script - skips steps when source hasn't changed

BUILD_OUTPUT_DIR="/app/build-output"
APK_PATH="${BUILD_OUTPUT_DIR}/tick-tack-boom.apk"
WEB_BUILD_CACHE_DIR="/tmp/web-build-cache"

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

# Only rebuild web app if source changed
if [ -d "${WEB_BUILD_CACHE_DIR}" ] && [ ! "src" -nt "${WEB_BUILD_CACHE_DIR}" ]; then
    echo "Restoring web build from cache..."
    cp -r "${WEB_BUILD_CACHE_DIR}" dist
else
    echo "Building web application..."
    npm run build
    # Cache web build for future runs
    rm -rf "${WEB_BUILD_CACHE_DIR}"
    cp -r dist "${WEB_BUILD_CACHE_DIR}"
fi

# Only sync Capacitor if config or source changed
if [ ! -d "android" ] || [ "capacitor.config.json" -nt "android/settings.gradle" ]; then
    echo "Syncing Capacitor..."
    npx cap sync android
else
    echo "Skipping Capacitor sync (config unchanged)"
fi

# Build Android APK only if source changed
cd android
APK_OUTPUT="app/build/outputs/apk/debug/tick-tack-boom-debug.apk"
if [ -f "${APK_OUTPUT}" ] && [ ! "../dist" -nt "${APK_OUTPUT}" ]; then
    echo "Skipping Android build (APK up to date)"
else
    echo "Building Android APK..."
    ./gradlew assembleDebug --no-daemon
fi
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
