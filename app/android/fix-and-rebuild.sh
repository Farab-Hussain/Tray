#!/bin/bash

# Android Build Fix and Rebuild Script
# This script fixes common Android build issues and rebuilds the app

set -e

echo "🔧 Starting Android build fix and rebuild process..."

# Navigate to app directory
cd "$(dirname "$0")/.."

# Step 1: Clean node_modules and reinstall
echo "📦 Step 1: Cleaning and reinstalling node modules..."
rm -rf node_modules
rm -f package-lock.json
npm install

# Step 2: Clean Android build
echo "🧹 Step 2: Cleaning Android build..."
cd android
./gradlew clean
rm -rf .gradle
rm -rf app/build
rm -rf build

# Step 3: Clean Gradle cache (optional but recommended)
echo "🗑️  Step 3: Cleaning Gradle cache..."
rm -rf ~/.gradle/caches/

# Step 4: Rebuild
echo "🔨 Step 4: Rebuilding Android app..."
cd ..
npx react-native run-android

echo "✅ Build process complete!"
echo ""
echo "If you still see errors:"
echo "1. Check that all dependencies are installed: npm install"
echo "2. Verify Android SDK is properly configured"
echo "3. Check Android Studio for any missing SDK components"
echo "4. See docs/ANDROID_BUILD_FIX.md for more details"

