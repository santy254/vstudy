// Test script for password change functionality

const testPasswordChange = async () => {
  try {
    console.log('🧪 Testing password change functionality...');
    
    // Get the current token
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ No authentication token found');
      return;
    }
    
    console.log('✅ Token found, testing API endpoint...');
    
    // Test the security settings endpoint first
    const testResponse = await fetch('http://localhost:5002/api/settings/security', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 GET /security response status:', testResponse.status);
    
    if (testResponse.ok) {
      const data = await testResponse.json();
      console.log('✅ Security settings endpoint is working');
      console.log('Current security settings:', data.user?.security);
    } else {
      console.error('❌ Security settings endpoint failed');
      const errorData = await testResponse.json().catch(() => ({}));
      console.error('Error:', errorData);
      return;
    }
    
    // Test password change with dummy data (don't actually change password)
    console.log('🔑 Testing password change validation...');
    
    const passwordChangeResponse = await fetch('http://localhost:5002/api/settings/security', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currentPassword: 'wrong-password', // Intentionally wrong to test validation
        newPassword: 'new-test-password',
        twoFactorAuth: false,
        loginAlerts: true,
        sessionTimeout: '30',
        deviceTrust: true
      })
    });
    
    console.log('📡 PUT /security response status:', passwordChangeResponse.status);
    
    if (passwordChangeResponse.status === 400) {
      const errorData = await passwordChangeResponse.json();
      if (errorData.message === 'Incorrect current password') {
        console.log('✅ Password validation is working correctly');
        console.log('✅ Backend correctly rejected wrong current password');
      } else {
        console.log('⚠️ Unexpected error message:', errorData.message);
      }
    } else if (passwordChangeResponse.ok) {
      console.log('⚠️ Password change succeeded with wrong password - this should not happen');
    } else {
      console.error('❌ Unexpected response status:', passwordChangeResponse.status);
      const errorData = await passwordChangeResponse.json().catch(() => ({}));
      console.error('Error:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Export for use in browser console
window.testPasswordChange = testPasswordChange;

console.log('🧪 Password change test loaded');
console.log('Run: window.testPasswordChange() to test the functionality');