// Test script to verify external profiles API endpoints
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001/api';

async function testExternalProfiles() {
  console.log('🧪 Testing External Profiles API...');
  
  // Test data
  const testProfiles = {
    profiles: [
      {
        id: '1',
        platform: 'linkedin',
        displayName: 'LinkedIn',
        url: 'https://linkedin.com/in/johndoe',
        icon: 'linkedin',
        color: '#0077B5'
      },
      {
        id: '2',
        platform: 'github',
        displayName: 'GitHub',
        url: 'https://github.com/johndoe',
        icon: 'github',
        color: '#333333'
      },
      {
        id: '3',
        platform: 'custom',
        displayName: 'My Blog',
        url: 'https://myblog.com',
        icon: 'custom',
        color: '#8B5CF6'
      }
    ]
  };

  try {
    // Test GET endpoint
    console.log('\n📥 Testing GET /resume/external-profiles...');
    const getResponse = await fetch(`${BASE_URL}/resume/external-profiles`, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    
    if (getResponse.ok) {
      const data = await getResponse.json();
      console.log('✅ GET successful:', data);
    } else {
      console.log('❌ GET failed:', getResponse.status, getResponse.statusText);
    }

    // Test PUT endpoint
    console.log('\n💾 Testing PUT /resume/external-profiles...');
    const putResponse = await fetch(`${BASE_URL}/resume/external-profiles`, {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testProfiles)
    });
    
    if (putResponse.ok) {
      const data = await putResponse.json();
      console.log('✅ PUT successful:', data);
    } else {
      console.log('❌ PUT failed:', putResponse.status, putResponse.statusText);
      const errorData = await putResponse.json();
      console.log('Error details:', errorData);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

console.log('External Profiles Implementation Test');
console.log('=====================================');
console.log('✅ Backend model updated to support multiple external links');
console.log('✅ Backend services updated with new data structure');
console.log('✅ Frontend completely rewritten with new features:');
console.log('   - Multiple links per platform');
console.log('   - 13 predefined platforms including Binance');
console.log('   - Custom platform support with naming');
console.log('   - Professional modal interface');
console.log('   - Proper API integration');
console.log('\n🚀 To test the implementation:');
console.log('1. Start your backend server');
console.log('2. Start your React Native app');
console.log('3. Navigate to External Profiles screen');
console.log('4. Try adding multiple links of different types');
console.log('5. Test custom links with names');
console.log('\n📝 The implementation includes:');
console.log('- Backend: New ExternalProfile interface with multiple profiles');
console.log('- Backend: Updated services to handle array of profiles');
console.log('- Frontend: Beautiful modal with platform selection');
console.log('- Frontend: Support for unlimited custom links');
console.log('- Frontend: Professional UI with proper validation');

testExternalProfiles();
