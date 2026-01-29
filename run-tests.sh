# 🧪 QUICK TEST RUNNER
# Make this file executable: chmod +x run-tests.sh

echo "🚀 Starting Tray Platform Test Suite..."
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Install test dependencies if not present
if ! npm list jest &>/dev/null; then
    echo "📦 Installing test dependencies..."
    npm install --save-dev jest supertest @types/jest ts-jest
fi

# Create jest config if it doesn't exist
if [ ! -f "jest.config.js" ]; then
    echo "⚙️ Creating Jest configuration..."
    cat > jest.config.js << 'EOF'
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'backend/src/**/*.ts',
    '!backend/src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
};
EOF
fi

# Create tests directory if it doesn't exist
mkdir -p tests

echo ""
echo "🧪 Running Tests..."
echo "=================="

# Run the tests
if [ "$1" = "coverage" ]; then
    echo "📊 Running tests with coverage..."
    npm run test:coverage
elif [ "$1" = "watch" ]; then
    echo "👀 Running tests in watch mode..."
    npm run test:watch
elif [ "$1" = "new-features" ]; then
    echo "🆕 Running new features tests..."
    npm test tests/new-features.test.js
else
    echo "✅ Running all tests..."
    npm test
fi

echo ""
echo "🎉 Test run completed!"
echo "====================="

# Show coverage if it exists
if [ -d "coverage" ]; then
    echo "📊 Coverage report generated in coverage/ directory"
    echo "🌐 Open coverage/lcov-report/index.html in your browser to view"
fi
