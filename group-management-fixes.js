// Fixed functions for GroupManagement.js

// Helper function to get the correct API base URL
const getApiBaseUrl = () => {
  // Use the same base URL as the api.js configuration
  return process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
};

// Helper function to get local network IP for sharing
const getShareableUrl = (token) => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // For development - use your actual local network IP
    const localIP = '192.168.1.162'; // Your actual local IP
    return `http://${localIP}:3000/join-group/${token}`;
  } else {
    // For production
    return `${window.location.origin}/join-group/${token}`;
  }
};

// Fixed generateInvitationLink function
const generateInvitationLink = async (groupId) => {
  try {
    console.log('🔄 Generating invitation link for group:', groupId);
    const res = await api.get(`/group/invite/${groupId}`);
    const invitationToken = res.data.invitationToken;
    
    console.log('📝 Received invitation token:', invitationToken);

    if (invitationToken) {
      // Create a proper URL that will be recognized as clickable
      const link = getShareableUrl(invitationToken);
      
      console.log('✅ Generated invitation link:', link);
      console.log('🎫 Token:', invitationToken);
      
      // Test if the URL is valid and accessible
      try {
        const testUrl = new URL(link);
        console.log('✅ URL is valid - Protocol:', testUrl.protocol, 'Host:', testUrl.host, 'Path:', testUrl.pathname);
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

// Fixed Test External button function
const testExternalAccess = async (invitationLink) => {
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
};

// Fixed sharing functions to ensure links are clickable
const shareViaWhatsApp = (groupName, link) => {
  try {
    // Format message to ensure link is clickable in WhatsApp
    // Use proper formatting with line breaks and clear link indication
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