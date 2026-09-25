#!/bin/bash
set -e

# Build script for Android APK
# Builds web app using the original vite.config.ts

BUILD_OUTPUT_DIR="/app/build-output"
APK_PATH="${BUILD_OUTPUT_DIR}/party-games.apk"

echo "Starting Android build..."

# Only run npm install if package.json changed
if [ ! -f "package.json" ] || [ ! -f "node_modules/.package-lock.json" ] || [ "package.json" -nt "node_modules/.package-lock.json" ]; then
    echo "Installing dependencies..."
    npm ci --omit=optional 2>/dev/null || npm install --omit=optional
    npm ci --include=optional 2>/dev/null || npm install --include=optional
else
    echo "Skipping npm install (dependencies unchanged)"
fi

# Always regenerate assets (icon change may not be detected properly)
echo "Generating Android launcher icons..."
npm run assets:android

# Build web app
echo "Building web application..."
npm run build

# android/ is generated (gitignored); create it on fresh checkouts such as CI
if [ ! -d android ]; then
    echo "Adding Capacitor Android platform..."
    npx cap add android
fi

# Sync Capacitor
echo "Syncing Capacitor..."
npx cap sync android

# Build Android APK (clean first to avoid stale caches)
cd android
echo "Cleaning Gradle build..."
./gradlew clean --no-daemon
# With a keystore, build a signed release APK; the stable key lets new builds install over old ones.
# Otherwise fall back to a debug build (signed with a throwaway per-container debug key).
if [ -n "${ANDROID_KEYSTORE_FILE}" ] && [ -f "${ANDROID_KEYSTORE_FILE}" ]; then
    echo "Building signed release APK..."
    ./gradlew assembleRelease --no-daemon \
        -Pandroid.injected.signing.store.file="${ANDROID_KEYSTORE_FILE}" \
        -Pandroid.injected.signing.store.password="${ANDROID_KEYSTORE_PASSWORD}" \
        -Pandroid.injected.signing.key.alias="${ANDROID_KEY_ALIAS}" \
        -Pandroid.injected.signing.key.password="${ANDROID_KEY_PASSWORD:-${ANDROID_KEYSTORE_PASSWORD}}"
    APK_SRC=$(ls app/build/outputs/apk/release/*.apk | grep -v unsigned | head -n 1)
else
    echo "No keystore configured (ANDROID_KEYSTORE_FILE); building debug APK..."
    ./gradlew assembleDebug --no-daemon
    APK_SRC=$(ls app/build/outputs/apk/debug/*.apk | head -n 1)
fi
cd ..

# Copy APK to output directory
echo "Copying APK to build-output..."
mkdir -p "${BUILD_OUTPUT_DIR}"
cp "android/${APK_SRC}" "${APK_PATH}"

echo ""
echo "=========================================="
echo "Build complete!"
echo "APK location: ${BUILD_OUTPUT_DIR}/party-games.apk"
ls -lh "${APK_PATH}"
echo "=========================================="
