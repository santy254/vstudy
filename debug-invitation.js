// Debug script to test invitation endpoints

// Test 1: Check what URLs we're generating
console.log('=== URL DEBUG ===');
const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
console.log('API Base URL:', apiBaseUrl);

// Test 2: Test different URL combinations
const testToken = 'abc123';
const urls = [
  `${apiBaseUrl}/group/invitation-info/${testToken}`,
  `http://localhost:5002/api/group/invitation-info/${testToken}`,
  `http://localhost:5002/group/invitation-info/${testToken}`,
];

console.log('Testing these URLs:');
urls.forEach((url, index) => {
  console.log(`${index + 1}. ${url}`);
});

// Test 3: Check if backend is running
async function testBackend() {
  try {
    console.log('=== BACKEND TEST ===');
    
    // Test basic backend connection
    const response = await fetch('http://localhost:5002/api/group/user-groups', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
    });
    
    console.log('Backend response status:', response.status);
    
    if (response.ok) {
      console.log('✅ Backend is running and accessible');
    } else {
      console.log('❌ Backend responded with error:', response.status);
    }
  } catch (error) {
    console.log('❌ Backend connection failed:', error.message);
  }
}

// Test 4: Test invitation endpoint specifically
async function testInvitationEndpoint(token) {
  console.log('=== INVITATION ENDPOINT TEST ===');
  
  const testUrls = [
    `http://localhost:5002/api/group/invitation-info/${token}`,
    `http://localhost:5002/group/invitation-info/${token}`,
  ];
  
  for (const url of testUrls) {
    try {
      console.log(`Testing: ${url}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Success:', data);
        return url; // Return the working URL
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log('❌ Error:', errorData);
      }
    } catch (error) {
      console.log('❌ Request failed:', error.message);
    }
  }
  
  return null;
}

// Export functions for use in browser console
window.debugInvitation = {
  testBackend,
  testInvitationEndpoint,
  apiBaseUrl
};

console.log('Debug functions available as window.debugInvitation');
console.log('Usage:');
console.log('- window.debugInvitation.testBackend()');
console.log('- window.debugInvitation.testInvitationEndpoint("your-token-here")');