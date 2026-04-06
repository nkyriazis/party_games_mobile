#!/bin/bash
set -e

echo "Installing dependencies..."
npm install --include=optional && npm install @rollup/rollup-linux-x64-gnu

echo "Building web application..."
npm run build

echo "Syncing Capacitor..."
if [ ! -d "android" ]; then
    npx cap add android
fi
npx cap sync android

echo "Building Android APK..."
cd android
./gradlew assembleDebug

echo "Copying APK to build-output..."
mkdir -p /app/build-output
cp app/build/outputs/apk/debug/app-debug.apk /app/build-output/tick-tack-boom.apk

echo "Done! APK is in build-output/tick-tack-boom.apk"
