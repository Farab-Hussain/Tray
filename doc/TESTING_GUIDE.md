# 🧪 TESTING GUIDE FOR TRAY PLATFORM

## 📋 QUICK START GUIDE

### 1️⃣ Install Testing Dependencies
```bash
# Navigate to your project root
cd /Users/mac/Documents/Application/Tray

# Install testing tools
npm install --save-dev jest supertest @types/jest ts-jest

# Install additional testing utilities
npm install --save-dev @types/supertest jest-environment-node
```

### 2️⃣ Configure Jest for TypeScript
Create a `jest.config.js` file in your project root:

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'backend/src/**/*.ts',
    '!backend/src/**/*.d.ts',
    '!backend/src/app.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};
```

### 3️⃣ Create Test Setup File
Create `tests/setup.ts`:

```typescript
// tests/setup.ts
import 'jest';

// Global test setup
beforeAll(() => {
  console.log('🚀 Starting Tray Platform Test Suite');
});

afterAll(() => {
  console.log('✅ Test Suite Completed');
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
```

### 4️⃣ Update Package.json Scripts
Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:new-features": "jest tests/new-features.test.ts",
    "test:unit": "jest tests/unit/",
    "test:integration": "jest tests/integration/"
  }
}
```

## 🎯 HOW TO RUN TESTS

### Basic Commands
```bash
# Run all tests
npm test

# Run tests in watch mode (auto-reruns on changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only new features tests
npm run test:new-features

# Run tests and see coverage in browser
open coverage/lcov-report/index.html
```

### Advanced Commands
```bash
# Run specific test file
npx jest tests/new-features.test.ts

# Run tests matching a pattern
npx jest --testNamePattern="Enhanced Student Profile"

# Run tests and show detailed output
npx jest --verbose

# Run tests and update snapshots
npx jest --updateSnapshot
```

## 📊 UNDERSTANDING TEST RESULTS

### Success Indicators
```
✅ PASS - Test passed successfully
⏱️  TIME - Test execution time
📊 COVERAGE - Code coverage percentage
```

### Failure Indicators
```
❌ FAIL - Test failed
🔍 EXPECTED - What we expected
📎 RECEIVED - What we actually got
📍 LOCATION - Where the test failed
```

### Coverage Report
- **Lines**: Percentage of code lines tested
- **Functions**: Percentage of functions tested
- **Branches**: Percentage of conditional logic tested
- **Statements**: Percentage of statements tested

## 🛠️ TROUBLESHOOTING GUIDE

### Common Issues & Solutions

#### ❌ "Cannot find module" Error
```bash
# Solution: Install missing dependencies
npm install

# Solution: Check file paths
ls -la tests/
```

#### ❌ "TypeScript compilation" Error
```bash
# Solution: Build TypeScript first
npx tsc

# Solution: Check tsconfig.json
cat tsconfig.json
```

#### ❌ "Firebase connection" Error
```bash
# Solution: Tests use mocks, ensure Firebase is properly mocked
# Check jest.config.js setupFilesAfterEnv
```

#### ❌ "Authentication" Error
```bash
# Solution: Ensure auth middleware is mocked
# Check test headers format
```

## 📝 WRITING YOUR OWN TESTS

### Test Structure Template
```typescript
// tests/example.test.ts
import request from 'supertest';
import app from '../backend/src/app';

describe('🧪 Feature Name', () => {
  
  // Setup before each test
  beforeEach(() => {
    // Reset mocks, setup test data
  });

  // Cleanup after each test
  afterEach(() => {
    // Clean up test data
  });

  test('✅ should do something successfully', async () => {
    // Arrange: Setup test data
    const testData = { /* test data */ };
    
    // Act: Make the request
    const response = await request(app)
      .post('/api/endpoint')
      .set('Authorization', 'Bearer test-token')
      .send(testData)
      .expect(200);
    
    // Assert: Check the response
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
  });

  test('❌ should handle errors gracefully', async () => {
    // Test error cases
    const response = await request(app)
      .post('/api/endpoint')
      .send({ invalid: 'data' })
      .expect(400);
    
    expect(response.body.error).toBeDefined();
  });
});
```

### Testing Best Practices

1. **Arrange, Act, Assert Pattern**
   ```typescript
   // Arrange: Setup test data
   const userData = { name: 'Test User' };
   
   // Act: Perform the action
   const response = await request(app).post('/users').send(userData);
   
   // Assert: Verify the result
   expect(response.status).toBe(201);
   ```

2. **Test Both Success & Failure Cases**
   ```typescript
   test('✅ success case', async () => { /* ... */ });
   test('❌ error case', async () => { /* ... */ });
   ```

3. **Use Descriptive Test Names**
   ```typescript
   test('should create user with valid data', async () => { /* ... */ });
   test('should reject user with invalid email', async () => { /* ... */ });
   ```

4. **Mock External Dependencies**
   ```typescript
   jest.mock('firebase-admin', () => ({
     auth: { verifyIdToken: jest.fn() },
     firestore: () => ({ collection: jest.fn() })
   }));
   ```

## 🚀 RUNNING TESTS STEP-BY-STEP

### Step 1: Install Dependencies
```bash
cd /Users/mac/Documents/Application/Tray
npm install --save-dev jest supertest @types/jest ts-jest
```

### Step 2: Configure Jest
```bash
# Create jest.config.js (copy from above)
touch jest.config.js
# Paste the configuration content
```

### Step 3: Run First Test
```bash
# Run the new features test
npm run test:new-features
```

### Step 4: Check Results
```bash
# View detailed output
npm test -- --verbose

# Generate coverage report
npm run test:coverage
```

### Step 5: Debug Issues
```bash
# Run tests in watch mode for debugging
npm run test:watch

# Run specific failing test
npx jest --testNamePattern="test name"
```

## 📈 CONTINUOUS INTEGRATION

### GitHub Actions Setup
Create `.github/workflows/test.yml`:

```yaml
name: Run Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## 🎯 NEXT STEPS

1. **Run the tests**: `npm run test:new-features`
2. **Fix any failing tests**: Follow the error messages
3. **Add more tests**: Test edge cases and error scenarios
4. **Set up CI/CD**: Automate testing on code changes
5. **Monitor coverage**: Aim for 80%+ code coverage

## 📞 NEED HELP?

- **Jest Documentation**: https://jestjs.io/docs/getting-started
- **Supertest Documentation**: https://github.com/visionmedia/supertest
- **TypeScript Jest**: https://kulshekhar.github.io/ts-jest/

Happy Testing! 🧪✨
