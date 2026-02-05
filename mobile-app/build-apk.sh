#!/bin/bash

# Bash script for building APK on Linux/Mac

echo "🚀 Building rash Mobile App APK..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from mobile-app directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build web app
echo "🔨 Building web app..."
cd ..
npm run build
cd mobile-app

# Sync Capacitor
echo "🔄 Syncing Capacitor..."
npx cap sync

# Build Android APK
echo "🤖 Building Android APK..."
cd android
if [ -f "gradlew" ]; then
    chmod +x gradlew
    ./gradlew assembleRelease
else
    echo "❌ gradlew not found. Please run 'npx cap sync' first."
    exit 1
fi

cd ..

echo "✅ Build complete!"
echo "📱 APK location: android/app/build/outputs/apk/release/app-release.apk"
