import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaPaperPlane, FaUserCircle, FaSmile, FaFileUpload } from 'react-icons/fa';
import io from 'socket.io-client';
import EmojiPicker from 'emoji-picker-react';
import api from '../../api';
import './Chat.css';

const Chat = ({ groupId }) => {
  const [parsedUser, setParsedUser] = useState({});
  const [userName, setUserName] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load user information from localStorage
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (storedUser) {
      setParsedUser(storedUser);
      setUserName(storedUser.name);
    }
  }, []);

  // Establish socket connection
  useEffect(() => {
    socketRef.current = io.connect('http://localhost:5000');
    socketRef.current.on('receiveMessage', (message) => {
      if (message.groupId === groupId) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    });
    return () => {
      socketRef.current.disconnect();
    };
  }, [groupId]);

  // Fetch messages for the group
  const fetchGroupMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/message/group/${groupId}`);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Error fetching group messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (groupId) {
      fetchGroupMessages();
    }
  }, [groupId, fetchGroupMessages]);

  // Scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleMessageChange = (e) => setNewMessage(e.target.value);

  // Emoji selection handler
  const handleShowEmojiPicker = () => {
    setShowEmojiPicker((prev) => !prev);
  };

  const handleEmojiReaction = (messageId, emoji) => {
    const message = messages.find((msg) => msg._id === messageId);
    const userId = parsedUser.name;
    const existingReaction = message?.emojiReactions.find((reaction) => reaction.emoji === emoji);

    if (existingReaction) {
      // If reaction exists, remove it if this user has reacted
      const userReaction = existingReaction.users.includes(userId);
      if (userReaction) {
        socketRef.current.emit('removeEmojiReaction', { messageId, emoji, userId, groupId });
      }
    } else {
      // If reaction does not exist, add it
      socketRef.current.emit('addEmojiReaction', { messageId, emoji, userId, groupId });
    }
  };

  // File selection handler
  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleChooseFile = () => fileInputRef.current?.click();

  const sendMessage = async () => {
    if (!newMessage.trim() && !file) return;
    if (!parsedUser?.name|| !groupId) {
      console.error("Error: Missing user or groupId");
      return;
    }
    const messageData = {
      sender: parsedUser.name, // Use the sender's name
      groupId,
      content: newMessage || '',
      timestamp: new Date().toLocaleString(), 
      createdBy: parsedUser.name, // Ensure `createdBy` is set
    };
    try {
      // Check if file exists for upload
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('groupId', groupId);
        formData.append('sender', parsedUser.name);
        formData.append('timestamp', messageData.timestamp);
        formData.append('createdBy', parsedUser.name);
        
        
        // Upload file to server
        const uploadResponse = await api.post('/message/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        Object.assign(messageData, {
          fileUrl: uploadResponse.data.fileUrl,
          fileType: uploadResponse.data.fileType,
        });
        setFile(null); // Reset file state after upload
      }

      // Send message to backend API
      const savedMessage = await api.post('/message', messageData);
      
      // Emit message to other clients via socket
      socketRef.current.emit('sendMessage', {
        chatId: groupId,
        userName: parsedUser.name,
        ...savedMessage.data,
      });


      // Update local message state
      setMessages((prevMessages) => [...prevMessages, savedMessage.data]);
      setNewMessage(''); // Clear input field after sending message
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  
  // JSX Rendering Section
  return (
    <div className="chat-page">
      <div className="chat-container">
        <header className="chat-header">
          <p><FaUserCircle /> {userName}</p>
        </header>
        <div className="chat-messages">
  {isLoading ? (
    <p>Loading messages...</p>
  ) : (
    messages.map((message) => (
      <div
        key={message._id}
        className={`message ${
          message.sender?.name === parsedUser.name ? 'my-message' : 'other-message'
        }`}
      >
        <div className="message-info">
          <span className="message-sender">
            {message.sender?.name === parsedUser.name ? 'You' : message.sender?.name || 'Unknown Sender'}
          </span>
          <span className="message-timestamp">{message.timestamp}</span>
        </div>
        <div className="message-content">
          {message.fileUrl ? (
            <a href={message.fileUrl} target="_blank" rel="noopener noreferrer">
              View File
            </a>
          ) : (
            message.content
          )}
          <div className="emoji-reactions">
            {message.emojiReactions?.map((reaction, idx) => (
              <span
                key={reaction.emoji + idx}
                className="emoji"
                onClick={() => handleEmojiReaction(message._id, reaction.emoji)}
              >
                {reaction.emoji} ({reaction.count})
              </span>
            ))}
          </div>
        </div>
      </div>
    ))
  )}
  <div ref={messagesEndRef} />
</div>


  
        <footer className="chat-input">
          <button className="emoji-button" onClick={handleShowEmojiPicker}>
            <FaSmile />
          </button>
  
          {showEmojiPicker && (
            <EmojiPicker onEmojiClick={(e, emoji) => setNewMessage((prev) => prev + emoji.emoji)} pickerStyle={{ position: 'absolute', bottom: '60px', right: '10px' }} />
          )}
  
          <textarea
            rows="2"
            value={newMessage}
            onChange={handleMessageChange}
            placeholder="Type a message..."
          />
  
          <input type="file" onChange={handleFileChange} style={{ display: 'none' }} ref={fileInputRef} />
          <button onClick={handleChooseFile} className="file-upload-button">
            <FaFileUpload />
          </button>
  
          <button onClick={sendMessage} className="send-button">
            <FaPaperPlane />
          </button>
        </footer>
      </div>
    </div>
  );
  
};

export default Chat;
