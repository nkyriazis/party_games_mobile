#!/bin/bash
set -e

# Docker entrypoint for Android build
# Source is mounted at /app at runtime

echo "Starting container..."

# Only install deps if package.json changed
if [ ! -f "node_modules/.package-lock.json" ] || [ "package.json" -nt "node_modules/.package-lock.json" ]; then
    echo "Installing dependencies..."
    npm ci --omit=optional 2>/dev/null || npm install --omit=optional
    npm ci --include=optional 2>/dev/null || npm install --include=optional
else
    echo "Skipping npm install (dependencies unchanged)"
fi

# Execute the build-android.sh script
exec bash scripts/build-android.sh
