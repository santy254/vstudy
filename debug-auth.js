// Debug script to check authentication issues
console.log('🔍 Debugging Authentication Issues');

// Check 1: Verify token exists in localStorage
function checkLocalStorage() {
  console.log('\n📱 Checking localStorage...');
  
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  console.log('Token exists:', !!token);
  console.log('Token length:', token ? token.length : 0);
  console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'No token');
  
  console.log('User data exists:', !!user);
  if (user) {
    try {
      const userData = JSON.parse(user);
      console.log('User email:', userData.email);
      console.log('User ID:', userData._id);
    } catch (e) {
      console.log('❌ Invalid user data in localStorage');
    }
  }
  
  return { token, user };
}

// Check 2: Test API call with current token
async function testApiCall() {
  console.log('\n🌐 Testing API call...');
  
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('❌ No token found - user needs to login');
    return;
  }
  
  try {
    const response = await fetch('http://localhost:5002/api/task', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('API Response status:', response.status);
    
    if (response.status === 401) {
      console.log('❌ Token is invalid or expired');
      const errorData = await response.json();
      console.log('Error details:', errorData);
    } else if (response.status === 200) {
      console.log('✅ Authentication working correctly');
      const data = await response.json();
      console.log('Tasks found:', data.length);
    } else {
      console.log('⚠️ Unexpected response:', response.status);
      const errorData = await response.json();
      console.log('Response data:', errorData);
    }
  } catch (error) {
    console.log('❌ API call failed:', error.message);
  }
}

// Check 3: Verify backend is running
async function checkBackend() {
  console.log('\n🖥️ Checking backend server...');
  
  try {
    const response = await fetch('http://localhost:5002/api/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Backend response status:', response.status);
    
    if (response.status === 200) {
      console.log('✅ Backend is running and accessible');
      const userData = await response.json();
      console.log('Current user:', userData.user?.email);
    } else {
      console.log('⚠️ Backend issue or authentication problem');
    }
  } catch (error) {
    console.log('❌ Cannot reach backend:', error.message);
    console.log('💡 Make sure backend server is running on port 5002');
  }
}

// Check 4: Test task creation with detailed logging
async function testTaskCreation() {
  console.log('\n📝 Testing task creation...');
  
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('❌ No token - cannot test task creation');
    return;
  }
  
  const testTask = {
    taskName: 'Test Task ' + Date.now(),
    description: 'This is a test task',
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
    priority: 'medium'
  };
  
  console.log('Test task data:', testTask);
  
  try {
    const response = await fetch('http://localhost:5002/api/task', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testTask)
    });
    
    console.log('Task creation response status:', response.status);
    
    if (response.status === 201) {
      console.log('✅ Task created successfully!');
      const newTask = await response.json();
      console.log('New task:', newTask.taskName);
    } else {
      console.log('❌ Task creation failed');
      const errorData = await response.json();
      console.log('Error details:', errorData);
    }
  } catch (error) {
    console.log('❌ Task creation request failed:', error.message);
  }
}

// Main debug function
async function debugAuthentication() {
  console.log('🚀 Starting Authentication Debug...\n');
  
  // Run all checks
  checkLocalStorage();
  await testApiCall();
  await checkBackend();
  await testTaskCreation();
  
  console.log('\n📋 Debug Summary:');
  console.log('1. Check if token exists in localStorage');
  console.log('2. Verify backend server is running (port 5002)');
  console.log('3. Test API authentication');
  console.log('4. Try task creation');
  
  console.log('\n💡 Common Solutions:');
  console.log('• If no token: Login again');
  console.log('• If token expired: Login again');
  console.log('• If backend not running: Start backend server');
  console.log('• If JWT_SECRET missing: Check backend .env file');
}

// Export for browser console
if (typeof window !== 'undefined') {
  window.debugAuth = debugAuthentication;
  console.log('💡 Run window.debugAuth() in browser console to debug');
}

// Auto-run debug
debugAuthentication();