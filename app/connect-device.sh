#!/bin/bash

# Script to connect physical Android device to Metro bundler
# Usage: ./connect-device.sh

echo "🔌 Connecting physical Android device to Metro bundler..."
echo ""

# Get computer's IP address
IP=$(ifconfig | grep 'inet ' | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
PORT=8081

echo "📱 Your computer's IP address: $IP"
echo "🌐 Metro bundler port: $PORT"
echo ""
echo "Setting up port forwarding..."
adb reverse tcp:$PORT tcp:$PORT

if [ $? -eq 0 ]; then
    echo "✅ Port forwarding set up successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Make sure Metro bundler is running (npm start)"
    echo "2. Shake your device to open the dev menu"
    echo "3. Tap 'Settings' or 'Dev Settings'"
    echo "4. Tap 'Debug server host & port for device'"
    echo "5. Enter: $IP:$PORT"
    echo "6. Go back and tap 'Reload'"
    echo ""
    echo "Alternatively, you can manually enter the URL in the dev menu:"
    echo "   $IP:$PORT"
else
    echo "❌ Failed to set up port forwarding"
    echo "Make sure your device is connected via USB and USB debugging is enabled"
fi

