import React, { useState, useEffect } from 'react';
import api from '../../api';
import NotificationHelper from '../../utils/notificationHelper';
import './GroupManagement.css';
  
const GroupManagement = ({
  userCourses = [],
  tasks = [],
  readTask = () => {},
  userName = 'Student',
  onGroupChange = () => {},
}) => {
const [courses, setCourses] = useState([]); // Initialize as empty array

  const [groups, setGroups] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [invitationLink, setInvitationLink] = useState('');
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [activeGroup, setActiveGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newInstructor, setNewInstructor] = useState('');

  
useEffect(() => {
  fetchGroups();
  fetchCourses(); // Add this to load courses on component mount
}, []);

const fetchGroups = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');
    
    const res = await api.get('/group/user-groups', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    setGroups(res.data.groups || []);
  } catch (err) {
    setNotification({ message: 'Failed to load groups', type: 'error' });
  }
};

// Add function to fetch courses from the database
const fetchCourses = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');
    
    const res = await api.get('/courses/user-courses', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    console.log('Fetched courses:', res.data);
    setCourses(res.data.courses || res.data || []);
  } catch (err) {
    console.error('Failed to load courses:', err);
    setNotification({ message: 'Failed to load courses', type: 'error' });
  }
};


  const fetchGroupMembers = async (groupId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get(`/auth/group-users/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMembers(res.data.users || []); // Assuming the response gives an array of users
    } catch (err) {
      setNotification({ message: 'Failed to load members', type: 'error' });
    }
  };

  const handleGroupClick = async (groupId) => {
    setActiveGroup(groupId);
    onGroupChange(groupId);
    await fetchGroupMembers(groupId);
  };

  const activeGroupDetails = groups.find((group) => group._id === activeGroup);

  const handleRemoveMember = async (memberId) => {
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/group/members/${activeGroup}/${memberId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMembers(members.filter((member) => member._id !== memberId));
      setNotification({ message: 'Member removed successfully', type: 'success' });
    } catch (err) {
      setNotification({ message: 'Failed to remove member', type: 'error' });
    }
  };
const handleCreateGroup = async () => {
  if (!groupName.trim() || !groupDescription.trim()) {
    setNotification({ message: 'Name and description cannot be empty', type: 'error' });
    return;
  }

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      setNotification({ message: 'Please login again', type: 'error' });
      return;
    }

    const res = await api.post(
      '/group/create',
      { groupName, groupDescription },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // ✅ Refresh entire group list from backend
    await fetchGroups(); 

    // Trigger real-time notification
    await NotificationHelper.createGroupNotification(groupName, 'created');

    // Clear form and notify
    setGroupName('');
    setGroupDescription('');
    setNotification({ message: 'Group created successfully!', type: 'success' });
    setTimeout(() => setNotification({ message: '', type: '' }), 3000);

  } catch (err) {
    const errorMessage = err.response?.data?.message || 'An unknown error occurred';
    setNotification({ message: errorMessage, type: 'error' });
  }
};
const handleCourseFormSubmit = async (e) => {
  e.preventDefault();

  try {
    const response = await api.post('/courses/register', {
      title: newCourseTitle,
      instructor: newInstructor,
    });

    if (response.status === 200 || response.status === 201) {
      setNotification({ message: 'Course registered successfully!', type: 'success' });
      
      // ✅ Refresh courses from database instead of just adding to local state
      await fetchCourses();

      // Clear input fields
      setNewCourseTitle('');
      setNewInstructor('');
      
      setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    }
  } catch (err) {
    console.error('Course registration error:', err);
    const errorMessage = err.response?.data?.message || 'Failed to register course';
    setNotification({ message: errorMessage, type: 'error' });
  }
};

// Add function to delete a course
const handleDeleteCourse = async (courseId, courseTitle) => {
  if (!window.confirm(`Are you sure you want to delete "${courseTitle}"?`)) {
    return;
  }

  try {
    await api.delete(`/courses/${courseId}`);
    setNotification({ message: 'Course deleted successfully!', type: 'success' });
    
    // ✅ Refresh courses from database
    await fetchCourses();
    
    setTimeout(() => setNotification({ message: '', type: '' }), 3000);
  } catch (err) {
    console.error('Course deletion error:', err);
    const errorMessage = err.response?.data?.message || 'Failed to delete course';
    setNotification({ message: errorMessage, type: 'error' });
  }
};


  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedGroupForShare, setSelectedGroupForShare] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Helper function to get the correct API base URL
  const getApiBaseUrl = () => {
    // Use the same base URL as the api.js configuration
    return process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
  };

  // Helper function to get local network IP for sharing
  const getShareableUrl = (token) => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // For development - use your actual local network IP for external sharing
      const localIP = '192.168.1.162'; // Your actual local IP address
      return `http://${localIP}:3000/join-group/${token}`;
    } else {
      // For production
      return `${window.location.origin}/join-group/${token}`;
    }
  };

  const generateInvitationLink = async (groupId) => {
    try {
      console.log('🔄 Generating invitation link for group:', groupId);
      const res = await api.get(`/group/invite/${groupId}`);
      const invitationToken = res.data.invitationToken;
      
      console.log('📝 Received invitation token:', invitationToken);
  
      if (invitationToken) {
        // Create a proper URL that will be recognized as clickable
        let baseUrl;
        
        // Create a proper URL that will be recognized as clickable
        const link = getShareableUrl(invitationToken);
        
        console.log('✅ Generated invitation link:', link);
        console.log('🎫 Token:', invitationToken);
        
        // Test if the URL is valid and accessible
        try {
          const testUrl = new URL(link);
          console.log('✅ URL is valid - Protocol:', testUrl.protocol, 'Host:', testUrl.host, 'Path:', testUrl.pathname);
          
          // Test if the URL is accessible (for development)
          if (link.includes('192.168.1.162')) {
            console.log('🏠 Local network URL - should work for external sharing');
          } else {
            console.log('🌐 Production URL - should work for external sharing');
          }
        } catch (urlError) {
          console.error('❌ Invalid URL generated:', link, urlError);
          throw new Error('Invalid URL generated');
        }
        
        setInvitationLink(link);
        setSelectedGroupForShare(groups.find(g => g._id === groupId));
        setShowShareModal(true);
        
        // Generate QR code with better encoding
        const qrData = link;
        console.log('📱 QR Code data:', qrData);
        
        // Use a more reliable QR code service
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}&format=png&ecc=H&margin=1&color=000000&bgcolor=ffffff`;
        
        setQrCodeUrl(qrCodeUrl);
        console.log('📱 Generated QR Code URL:', qrCodeUrl);
        
        // Test QR code generation
        const testQR = new Image();
        testQR.onload = () => {
          console.log('✅ QR Code loaded successfully');
          setNotification({ message: '✅ Invite link and QR code generated successfully!', type: 'success' });
        };
        testQR.onerror = () => {
          console.log('❌ QR Code failed to load, trying fallback');
          // Fallback QR service
          const fallbackQR = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(qrData)}&choe=UTF-8`;
          setQrCodeUrl(fallbackQR);
          setNotification({ message: '✅ Invite link generated (using fallback QR service)', type: 'success' });
        };
        testQR.src = qrCodeUrl;
        
      } else {
        setNotification({ message: 'Failed to generate invite link - no token received', type: 'error' });
      }
    } catch (error) {
      console.error('Error generating invitation link:', error);
      setNotification({ message: `Error generating invitation link: ${error.message}`, type: 'error' });
    }
  };

  const copyToClipboard = async (text) => {
    try {
      // Check if clipboard API is available
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setNotification({ message: '✅ Link copied to clipboard!', type: 'success' });
        console.log('Copied using Clipboard API:', text);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          setNotification({ message: '✅ Link copied to clipboard!', type: 'success' });
          console.log('Copied using fallback method:', text);
        } else {
          throw new Error('Copy command failed');
        }
      }
      
      // Auto-hide notification after 3 seconds
      setTimeout(() => {
        setNotification({ message: '', type: '' });
      }, 3000);
      
    } catch (err) {
      console.error('Failed to copy text:', err);
      setNotification({ 
        message: '❌ Failed to copy. Please copy the link manually.', 
        type: 'error' 
      });
      
      // Auto-hide error notification after 5 seconds
      setTimeout(() => {
        setNotification({ message: '', type: '' });
      }, 5000);
    }
  };

  const shareViaEmail = (groupName, link) => {
    try {
      const subject = `Join my study group: ${groupName}`;
      const body = `Hi there! 👋

I'd like to invite you to join my study group "${groupName}".

🔗 CLICK HERE TO JOIN:
${link}

This link will take you directly to the group invitation page where you can join with just one click!

Looking forward to studying together!

Best regards`;
      const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      window.open(mailtoLink, '_blank');
      setNotification({ message: '📧 Email app opened with clickable link!', type: 'success' });
      
      setTimeout(() => {
        setNotification({ message: '', type: '' });
      }, 3000);
    } catch (error) {
      console.error('Email sharing failed:', error);
      setNotification({ message: '❌ Failed to open email app', type: 'error' });
    }
  };

  const shareViaWhatsApp = (groupName, link) => {
    try {
      // Format message to ensure link is clickable in WhatsApp
      // WhatsApp recognizes URLs better when they're on their own line
      const message = `🎓 *Join my study group: ${groupName}*

📚 Let's learn together and achieve our goals!

🔗 *CLICK THIS LINK TO JOIN:*

${link}

👆 Tap the link above to join instantly!

Looking forward to studying with you! 📖✨`;
      
      const whatsappLink = `https://wa.me/?text=${encodeURIComponent(message)}`;
      
      window.open(whatsappLink, '_blank');
      setNotification({ message: '💬 WhatsApp opened with clickable link!', type: 'success' });
      
      setTimeout(() => {
        setNotification({ message: '', type: '' });
      }, 3000);
    } catch (error) {
      console.error('WhatsApp sharing failed:', error);
      setNotification({ message: '❌ Failed to open WhatsApp', type: 'error' });
    }
  };

  const shareViaTwitter = (groupName, link) => {
    try {
      const text = `🎓 Join my study group "${groupName}"! 📚👥 #StudyGroup #Learning #Education`;
      const twitterLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`;
      
      window.open(twitterLink, '_blank');
      setNotification({ message: '🐦 Twitter opened!', type: 'success' });
      
      setTimeout(() => {
        setNotification({ message: '', type: '' });
      }, 3000);
    } catch (error) {
      console.error('Twitter sharing failed:', error);
      setNotification({ message: '❌ Failed to open Twitter', type: 'error' });
    }
  };

  const shareViaFacebook = (groupName, link) => {
    try {
      const facebookLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}&quote=${encodeURIComponent(`Join my study group "${groupName}"! 📚👥`)}`;
      
      window.open(facebookLink, '_blank', 'width=600,height=400');
      setNotification({ message: '📘 Facebook opened!', type: 'success' });
      
      setTimeout(() => {
        setNotification({ message: '', type: '' });
      }, 3000);
    } catch (error) {
      console.error('Facebook sharing failed:', error);
      setNotification({ message: '❌ Failed to open Facebook', type: 'error' });
    }
  };

  const shareViaLinkedIn = (groupName, link) => {
    try {
      const linkedinLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`;
      
      window.open(linkedinLink, '_blank', 'width=600,height=400');
      setNotification({ message: '💼 LinkedIn opened!', type: 'success' });
      
      setTimeout(() => {
        setNotification({ message: '', type: '' });
      }, 3000);
    } catch (error) {
      console.error('LinkedIn sharing failed:', error);
      setNotification({ message: '❌ Failed to open LinkedIn', type: 'error' });
    }
  };

  const shareViaTelegram = (groupName, link) => {
    try {
      const message = `🎓 Join my study group "${groupName}"!\n\n📚 Let's learn together!\n\n${link}`;
      const telegramLink = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(message)}`;
      
      window.open(telegramLink, '_blank');
      setNotification({ message: '✈️ Telegram opened!', type: 'success' });
      
      setTimeout(() => {
        setNotification({ message: '', type: '' });
      }, 3000);
    } catch (error) {
      console.error('Telegram sharing failed:', error);
      setNotification({ message: '❌ Failed to open Telegram', type: 'error' });
    }
  };

  const shareViaSMS = (groupName, link) => {
    try {
      const message = `🎓 Join my study group "${groupName}"! 

Click this link: ${link}

Looking forward to studying together! 📚`;
      
      const smsLink = `sms:?body=${encodeURIComponent(message)}`;
      
      window.open(smsLink, '_blank');
      setNotification({ message: '📱 SMS app opened with clickable link!', type: 'success' });
      
      setTimeout(() => {
        setNotification({ message: '', type: '' });
      }, 3000);
    } catch (error) {
      console.error('SMS sharing failed:', error);
      setNotification({ message: '❌ Failed to open SMS app', type: 'error' });
    }
  };
const handleRegisterCourse = (course) => {
  // Placeholder logic – replace with real API logic if needed
  setNotification({
    message: `You have registered for "${course.title}"!`,
    type: 'success',
  });

  setTimeout(() => setNotification({ message: '', type: '' }), 3000);
};

  const handleDeleteGroup = async (groupId) => {
    try {
      await api.delete(`/group/${groupId}`);
      setGroups(groups.filter((group) => group._id !== groupId));
      setNotification({ message: 'Group deleted successfully', type: 'success' });
    } catch (err) {
      setNotification({ message: 'Failed to delete group', type: 'error' });
    }
  };

  return (
    <div className="content-box">
      <h1 className="page-title">Group Management</h1>
      <section className="welcome-panel">
  <h3>Hello, {userName}!</h3>
  <p>Welcome to your group dashboard.</p>
</section>
<section className="course-overview">
  <h4>Your Courses</h4>
  {courses.length === 0 ? (
    <p>No courses registered yet. Register your first course below!</p>
  ) : (
    <ul className="course-list">
      {courses.map((course, index) => (
        <li key={course._id || course.id || index} className="course-item">
          <div className="course-info">
            <strong>{course.title}</strong>
            <br />
            <span>Instructor: {course.instructor}</span>
          </div>
          <button 
            onClick={() => handleDeleteCourse(course._id || course.id, course.title)}
            className="delete-course-button"
            title="Delete this course"
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            🗑️ Delete
          </button>
        </li>
      ))}
    </ul>
  )}

  <h4>Register a New Course Unit Title</h4>
  <form className="course-form" onSubmit={handleCourseFormSubmit}>
    <input
      type="text"
      placeholder="Course Title"
      value={newCourseTitle}
      onChange={(e) => setNewCourseTitle(e.target.value)}
      required
    />
    <input
      type="text"
      placeholder="Instructor"
      value={newInstructor}
      onChange={(e) => setNewInstructor(e.target.value)}
      required
    />
    <button type="submit" className="register-button">Submit Course</button>
  </form>
</section>

<section className="todo-section">
  <h4>Your Tasks by Course</h4>
  {courses.map((course, cIndex) => {
    // Filter tasks that mention the course title
    const courseTasks = tasks.filter(task =>
      task.toLowerCase().includes(course.title.toLowerCase())
    );

    return (
      <div key={cIndex} className="course-task-group">
        <h5>{course.title}</h5>
        {courseTasks.length > 0 ? (
          <ul>
            {courseTasks.map((task, index) => (
              <li key={index}>
                <button onClick={() => readTask(task)}>🔊</button> {task}
              </li>
            ))}
          </ul>
        ) : (
          <p>No tasks for this course.</p>
        )}
      </div>
    );
  })}
</section>


      {notification.message && <div className={`notification ${notification.type}`}>{notification.message}</div>}

      <div className="group-creation">
        <h3>Create a New Group</h3>
        <input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Enter group name"
          className="group-input"
        />
        <textarea
          value={groupDescription}
          onChange={(e) => setGroupDescription(e.target.value)}
          placeholder="Enter group description"
          className="group-description-input"
        ></textarea>
        <button onClick={handleCreateGroup} className="create-group-button">Create Group</button>
      </div>

      {/* Group selection dropdown */}
      <div className="group-dropdown">
        <h4>Select a Group</h4>
        <select
          value={activeGroup || ''}
          onChange={(e) => handleGroupClick(e.target.value)}
        >
          <option value="">-- Select a group --</option>
          {groups.map((group) => (
            <option key={group._id} value={group._id}>
              {group.groupName}
            </option>
          ))}
        </select>
      </div>

      <div className="group-list-container">

        <h3>Your Groups</h3>
        <ul className="group-list">
          {groups.map((group) => (
            <li key={group._id} className="group-item">
              <div className="group-details">
                <span className="group-name" onClick={() => handleGroupClick(group._id)}>{group.groupName}</span>
                <p className="group-description" onClick={() => handleGroupClick(group._id)}>{group.groupDescription}</p>
              </div>
              {group.isCreatedByUser && (
                <div className="admin-actions">
                  <button onClick={() => generateInvitationLink(group._id)} className="invite-link-button">Generate Invite Link</button>
                  <button onClick={() => handleDeleteGroup(group._id)} className="delete-group-button">Delete Group</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {invitationLink && (
        <div className="invitation-link-container">
          <h4>Share this link to invite others:</h4>
          <div className="invitation-link">{invitationLink}</div>
        </div>
      )}

      {activeGroup && (
        <div className="group-members">
          <h3>Group Members</h3>
          <ul className="member-list">
            {members.map((member) => (
              <li key={member.userId} className="member-item">
                <span>{member.name}</span>
                {member.isAdmin && <span>(Admin)</span>}
                  {/* Only show the "Remove" button if the current user is the creator of the active group */}
                {activeGroupDetails?.isCreatedByUser && (
                  <button onClick={() => handleRemoveMember(member._id)} className="remove-member-button">
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Enhanced Share Modal */}
      {showShareModal && selectedGroupForShare && (
        <div className="share-modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="share-modal-header">
              <h3>Share Group: {selectedGroupForShare.groupName}</h3>
              <button 
                className="close-modal-btn"
                onClick={() => setShowShareModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="share-modal-content">
              <div className="share-section">
                <h4>📋 Copy Link</h4>
                <div className="link-container">
                  <div className="link-display">
                    <a 
                      href={invitationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="invitation-link-clickable"
                      title="Click to open invitation page"
                    >
                      {invitationLink}
                    </a>
                  </div>
                  <button 
                    className="copy-btn"
                    onClick={() => copyToClipboard(invitationLink)}
                  >
                    📋 Copy
                  </button>
                </div>
                <div className="link-actions">
                  <button 
                    className="test-link-btn"
                    onClick={() => window.open(invitationLink, '_blank')}
                  >
                    🔗 Test Link
                  </button>
                  <button 
                    className="debug-link-btn"
                    onClick={() => {
                      console.log('=== LINK DEBUG INFO ===');
                      console.log('Full URL:', invitationLink);
                      console.log('URL Length:', invitationLink.length);
                      console.log('URL Valid:', /^https?:\/\/.+/.test(invitationLink));
                      console.log('QR Code URL:', qrCodeUrl);
                      console.log('Current Origin:', window.location.origin);
                      console.log('Current Protocol:', window.location.protocol);
                      console.log('Current Host:', window.location.host);
                      
                      // Extract and show token info
                      const token = invitationLink.split('/join-group/')[1];
                      console.log('🎫 Extracted Token:', token);
                      console.log('🎫 Token Length:', token?.length);
                      
                      // Test if URL is accessible
                      fetch(invitationLink, { method: 'HEAD', mode: 'no-cors' })
                        .then(() => console.log('✅ URL is accessible'))
                        .catch(err => console.log('❌ URL access failed:', err));
                      
                      alert(`Link Debug Info:
URL: ${invitationLink}
Token: ${token}
Token Length: ${token?.length}
Valid Format: ${/^https?:\/\/.+/.test(invitationLink)}
Protocol: ${window.location.protocol}
Host: ${window.location.host}

Check console for more details!`);
                    }}
                  >
                    🔍 Debug
                  </button>
                  <button 
                    className="share-test-btn"
                    onClick={() => {
                      // Test sharing functionality
                      const testMessage = `🎓 Test Group Invitation

Click this link: ${invitationLink}

This is a test to verify the link works properly.`;
                      
                      if (navigator.share) {
                        navigator.share({
                          title: 'Test Group Invitation',
                          text: testMessage,
                          url: invitationLink
                        }).then(() => {
                          setNotification({ message: '✅ Native sharing worked!', type: 'success' });
                        }).catch(err => {
                          console.error('Native sharing failed:', err);
                          // Fallback to copying
                          copyToClipboard(testMessage);
                        });
                      } else {
                        // Fallback for browsers without native sharing
                        copyToClipboard(testMessage);
                        setNotification({ message: '📋 Test message copied! Paste it anywhere to test.', type: 'success' });
                      }
                    }}
                  >
                    🧪 Test Share
                  </button>
                  <button 
                    className="verify-backend-btn"
                    onClick={async () => {
                      try {
                        console.log('🔍 Testing backend connection...');
                        const testResponse = await api.get('/group/user-groups');
                        console.log('✅ Backend connection successful:', testResponse.data);
                        setNotification({ message: '✅ Backend connection working!', type: 'success' });
                      } catch (error) {
                        console.error('❌ Backend connection failed:', error);
                        setNotification({ message: '❌ Backend connection failed', type: 'error' });
                      }
                    }}
                  >
                    🔧 Test Backend
                  </button>
                  <button 
                    className="test-external-btn"
                    onClick={async () => {
                      try {
                        console.log('🌐 Testing external access to invitation...');
                        
                        // Extract token from invitation link
                        const token = invitationLink.split('/join-group/')[1];
                        console.log('🎫 Testing token:', token);
                        
                        // Test the public invitation-info endpoint using the correct API base URL
                        const apiBaseUrl = getApiBaseUrl();
                        const response = await fetch(`${apiBaseUrl}/group/invitation-info/${token}`, {
                          method: 'GET',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                        });
                        
                        console.log('📡 Response status:', response.status);
                        
                        if (response.ok) {
                          const data = await response.json();
                          console.log('✅ External access successful:', data);
                          setNotification({ 
                            message: `✅ External access works! Group: ${data.group?.groupName}`, 
                            type: 'success' 
                          });
                        } else {
                          const errorData = await response.json().catch(() => ({}));
                          console.error('❌ External access failed:', errorData);
                          setNotification({ 
                            message: `❌ External access failed: ${errorData.message || response.statusText}`, 
                            type: 'error' 
                          });
                        }
                      } catch (error) {
                        console.error('❌ External test failed:', error);
                        setNotification({ 
                          message: `❌ External test failed: ${error.message}`, 
                          type: 'error' 
                        });
                      }
                    }}
                  >
                    🌐 Test External
                  </button>
                  <span className="link-info">Click to test if the invitation link works</span>
                </div>
              </div>

              <div className="share-section">
                <h4>📱 QR Code</h4>
                <div className="qr-code-container">
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code for group invitation" 
                    className="qr-code"
                  />
                  <p>Scan to join the group</p>
                </div>
              </div>

              <div className="share-section">
                <h4>🚀 Share Via</h4>
                <div className="share-buttons">
                  <button 
                    className="share-btn email"
                    onClick={() => shareViaEmail(selectedGroupForShare.groupName, invitationLink)}
                  >
                    📧 Email
                  </button>
                  <button 
                    className="share-btn whatsapp"
                    onClick={() => shareViaWhatsApp(selectedGroupForShare.groupName, invitationLink)}
                  >
                    💬 WhatsApp
                  </button>
                  <button 
                    className="share-btn twitter"
                    onClick={() => shareViaTwitter(selectedGroupForShare.groupName, invitationLink)}
                  >
                    🐦 Twitter
                  </button>
                  <button 
                    className="share-btn facebook"
                    onClick={() => shareViaFacebook(selectedGroupForShare.groupName, invitationLink)}
                  >
                    📘 Facebook
                  </button>
                  <button 
                    className="share-btn linkedin"
                    onClick={() => shareViaLinkedIn(selectedGroupForShare.groupName, invitationLink)}
                  >
                    💼 LinkedIn
                  </button>
                  <button 
                    className="share-btn telegram"
                    onClick={() => shareViaTelegram(selectedGroupForShare.groupName, invitationLink)}
                  >
                    ✈️ Telegram
                  </button>
                  <button 
                    className="share-btn sms"
                    onClick={() => shareViaSMS(selectedGroupForShare.groupName, invitationLink)}
                  >
                    📱 SMS
                  </button>
                </div>
              </div>

              <div className="share-section">
                <h4>ℹ️ Group Info</h4>
                <div className="group-share-info">
                  <p><strong>Description:</strong> {selectedGroupForShare.groupDescription}</p>
                  <p><strong>Members:</strong> {members.length} people</p>
                  <p><strong>Created:</strong> {new Date(selectedGroupForShare.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="share-modal-footer">
              <p>💡 This invitation link is secure and can be used multiple times.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupManagement;
