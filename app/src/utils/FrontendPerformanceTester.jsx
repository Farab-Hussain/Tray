import axios from 'axios';
import { Alert } from 'react-native';

// Test configuration
const API_BASE_URL = 'https://semiexpansible-unescheated-genoveva.ngrok-free.dev';
const TIMEOUT_DURATION = 60000; // 1 minute for testing

// Create axios instance for testing
const testApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT_DURATION,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Test course data (minimal to reduce variables)
const testCourseData = {
  title: 'Frontend Test Course',
  description: 'This is a frontend test course for performance measurement',
  shortDescription: 'Frontend test course',
  category: 'Technology',
  level: 'Beginner',
  language: 'en',
  price: 50,
  currency: 'USD',
  isFree: false,
  thumbnailUrl: 'https://res.cloudinary.com/dkblutnml/image/upload/test.jpg',
  previewVideoUrl: 'https://res.cloudinary.com/dkblutnml/video/upload/test.mp4',
  duration: 30,
  durationText: '30 minutes',
  lessonsCount: 3,
  objectives: ['Test objective'],
  prerequisites: [],
  targetAudience: ['Test audience'],
  tags: ['frontend', 'test'],
  difficultyScore: 2,
  timeCommitment: 'Self-paced',
  certificateAvailable: false,
  slug: `frontend-test-${Date.now()}`,
  instructorId: 'ynZEszrb24NjwpMCVNBYMkTxeLQ2', // Use actual user ID
  instructorName: 'Test User'
};

class FrontendPerformanceTester {
  constructor() {
    this.authToken = null;
  this.results = {};
  this.testStartTime = null;
  this.testEndTime = null;
  }

  // Get auth token from storage or use a test token
  async getAuthToken() {
    console.log('🔐 Getting authentication token...');
    
    try {
      // In a real app, this would come from AsyncStorage
      // For testing, we'll use the current user's token
      const response = await testApiClient.get('/auth/me');
      console.log('✅ Auth token retrieved successfully');
      return response.headers.authorization || 'Bearer test-token';
    } catch (error) {
      console.error('❌ Failed to get auth token:', error.message);
      return null;
    }
  }

  // Test 1: Health check
  async testHealthCheck() {
    console.log('🧪 [Frontend Test 1] Testing health check...');
    const startTime = Date.now();
    
    try {
      const response = await testApiClient.get('/health');
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`✅ [Frontend Test 1] Health check completed in ${duration}ms`);
      console.log(`📊 Status: ${response.status}`);
      
      this.results.healthCheck = duration;
      return duration;
    } catch (error) {
      console.error('❌ [Frontend Test 1] Health check failed:', error.message);
      throw error;
    }
  }

  // Test 2: Authentication check
  async testAuthentication() {
    console.log('🧪 [Frontend Test 2] Testing authentication...');
    const startTime = Date.now();
    
    try {
      const response = await testApiClient.get('/auth/me');
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`✅ [Frontend Test 2] Authentication check completed in ${duration}ms`);
      console.log(`👤 User: ${response.data.name}`);
      
      this.results.authentication = duration;
      return duration;
    } catch (error) {
      console.error('❌ [Frontend Test 2] Authentication check failed:', error.message);
      throw error;
    }
  }

  // Test 3: Course creation API call
  async testCourseCreation() {
    console.log('🧪 [Frontend Test 3] Testing course creation API call...');
    
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const startTime = Date.now();
    
    try {
      // Set up request interceptor to log timing
      const requestStartTime = Date.now();
      
      const response = await testApiClient.post('/courses', testCourseData, {
        headers: {
          'Authorization': token,
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`📤 Upload progress: ${progress}%`);
        },
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`✅ [Frontend Test 3] Course creation completed in ${duration}ms`);
      console.log(`📝 Course ID: ${response.data.course?.id || 'No ID returned'}`);
      console.log(`📊 Status: ${response.status}`);
      
      this.results.courseCreation = duration;
      
      // Store course ID for cleanup
      this.createdCourseId = response.data.course?.id;
      
      return duration;
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.error(`❌ [Frontend Test 3] Course creation failed after ${duration}ms:`);
      console.error('Error details:', error.response?.data || error.message);
      
      if (error.code === 'ECONNABORTED') {
        console.error('⏰ Request timed out - this indicates a server-side bottleneck');
      }
      
      this.results.courseCreation = duration;
      throw error;
    }
  }

  // Test 4: Multiple course creations
  async testMultipleCreations() {
    console.log('🧪 [Frontend Test 4] Testing multiple course creations...');
    const times = [];
    
    for (let i = 0; i < 3; i++) {
      console.log(`📊 [Frontend Test 4] Creation ${i + 1}/3...`);
      
      const modifiedData = {
        ...testCourseData,
        title: `Multiple Test Course ${i + 1}`,
        slug: `multiple-test-${i + 1}-${Date.now()}`,
      };
      
      const startTime = Date.now();
      
      try {
        const response = await testApiClient.post('/courses', modifiedData, {
          headers: {
            'Authorization': await this.getAuthToken(),
          },
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        times.push(duration);
        
        console.log(`✅ [Frontend Test 4] Creation ${i + 1} completed in ${duration}ms`);
        
        // Store for cleanup
        if (!this.createdCourseIds) this.createdCourseIds = [];
        this.createdCourseIds.push(response.data.course?.id);
        
      } catch (error) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        times.push(duration);
        
        console.error(`❌ [Frontend Test 4] Creation ${i + 1} failed after ${duration}ms:`, error.message);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    console.log(`📊 [Frontend Test 4] Performance Analysis:`);
    console.log(`   Average: ${avgTime.toFixed(2)}ms`);
    console.log(`   Min: ${minTime}ms`);
    console.log(`   Max: ${maxTime}ms`);
    
    this.results.multipleCreations = { avgTime, minTime, maxTime, times };
    return { avgTime, minTime, maxTime, times };
  }

  // Test 5: Network latency
  async testNetworkLatency() {
    console.log('🧪 [Frontend Test 5] Testing network latency...');
    const times = [];
    
    for (let i = 0; i < 10; i++) {
      const startTime = Date.now();
      
      try {
        await testApiClient.get('/health');
        const endTime = Date.now();
        times.push(endTime - startTime);
      } catch (error) {
        console.error(`❌ [Frontend Test 5] Latency test ${i + 1} failed:`, error.message);
      }
    }
    
    const avgLatency = times.reduce((a, b) => a + b, 0) / times.length;
    const minLatency = Math.min(...times);
    const maxLatency = Math.max(...times);
    
    console.log(`📊 [Frontend Test 5] Network Latency Analysis:`);
    console.log(`   Average: ${avgLatency.toFixed(2)}ms`);
    console.log(`   Min: ${minLatency}ms`);
    console.log(`   Max: ${maxLatency}ms`);
    
    this.results.networkLatency = { avgLatency, minLatency, maxLatency };
    return { avgLatency, minLatency, maxLatency };
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting comprehensive frontend performance tests...\n');
    this.testStartTime = Date.now();
    
    try {
      // Test 1: Health check
      await this.testHealthCheck();
      console.log('');
      
      // Test 2: Authentication
      await this.testAuthentication();
      console.log('');
      
      // Test 3: Network latency
      await this.testNetworkLatency();
      console.log('');
      
      // Test 4: Course creation
      await this.testCourseCreation();
      console.log('');
      
      // Test 5: Multiple creations
      await this.testMultipleCreations();
      console.log('');
      
      this.testEndTime = Date.now();
      this.printSummary();
      
    } catch (error) {
      console.error('❌ Frontend test suite failed:', error);
    }
    
    console.log('\n🏁 Frontend performance tests completed');
  }

  // Print comprehensive summary
  printSummary() {
    console.log('📋 FRONTEND PERFORMANCE TEST SUMMARY:');
    console.log('=====================================');
    console.log(`Health Check: ${this.results.healthCheck}ms`);
    console.log(`Authentication: ${this.results.authentication}ms`);
    console.log(`Network Latency (Avg): ${this.results.networkLatency?.avgLatency?.toFixed(2)}ms`);
    console.log(`Course Creation: ${this.results.courseCreation}ms`);
    console.log(`Multiple Creations (Avg): ${this.results.multipleCreations?.avgTime?.toFixed(2)}ms`);
    console.log('');
    
    // Analysis
    console.log('🔍 PERFORMANCE ANALYSIS:');
    
    if (this.results.healthCheck > 500) {
      console.log('⚠️  WARNING: Health check is slow (>500ms) - network or server issue');
    }
    
    if (this.results.authentication > 2000) {
      console.log('⚠️  WARNING: Authentication is slow (>2s) - auth middleware issue');
    }
    
    if (this.results.networkLatency?.avgLatency > 200) {
      console.log('⚠️  WARNING: Network latency is high (>200ms) - network connectivity issue');
    }
    
    if (this.results.courseCreation > 10000) {
      console.log('⚠️  CRITICAL: Course creation is very slow (>10s) - major backend issue');
    } else if (this.results.courseCreation > 5000) {
      console.log('⚠️  WARNING: Course creation is slow (>5s) - backend optimization needed');
    }
    
    if (this.results.multipleCreations?.avgTime > 8000) {
      console.log('⚠️  WARNING: Average course creation is slow (>8s) - scalability issue');
    }
    
    // Recommendations
    console.log('');
    console.log('💡 RECOMMENDATIONS:');
    
    if (this.results.courseCreation > 5000) {
      console.log('🔧 Consider optimizing database operations');
      console.log('🔧 Check for blocking operations in course creation flow');
      console.log('🔧 Implement database connection pooling');
    }
    
    if (this.results.authentication > 1000) {
      console.log('🔧 Optimize Firebase token verification');
      console.log('🔧 Consider token caching');
    }
    
    if (this.results.networkLatency?.avgLatency > 200) {
      console.log('🔧 Check network connectivity');
      console.log('🔧 Consider CDN for static assets');
    }
  }
}

// Export for use in React Native app
export default FrontendPerformanceTester;

// For standalone testing
if (typeof window !== 'undefined') {
  // Browser environment
  window.runFrontendTests = () => {
    const tester = new FrontendPerformanceTester();
    return tester.runAllTests();
  };
}
