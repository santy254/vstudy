import React, { useState, useEffect } from 'react'; 
import { FaCommentAlt, FaVideo, FaUsers } from 'react-icons/fa'; // Added icons
import Chat from './Chat';
import VideoChat from './VideoChat';
import api from '../../api';
import GroupSidebar from '../../components/GroupSidebar';
import './GroupChatPage.css';

const GroupChatPage = () => {
  const [groups, setGroups] = useState([]); // List of user groups
  const [currentGroup, setCurrentGroup] = useState(null); // Currently selected group
  const [isVideoChat, setIsVideoChat] = useState(false); // Toggle between chat and video chat

  // Fetch groups when component mounts
  useEffect(() => {
    fetchUserGroups();
  }, []);

  const fetchUserGroups = async () => {
    try {
      const response = await api.get('/group/user-groups'); // Fetch user groups from backend
      setGroups(response.data.groups);
      if (response.data.groups.length > 0) {
        setCurrentGroup(response.data.groups[0]._id); // Default to first group
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  // Handle group change for chat and video
  const handleGroupChange = (groupId) => {
    setCurrentGroup(groupId);
    setIsVideoChat(false); // Reset to chat when switching groups
  };

  return (
    <div className="group-chat-page">
      {/* Sidebar for selecting groups */}
      <GroupSidebar
        groups={groups}
        onGroupChange={handleGroupChange}
        currentGroup={currentGroup}
      />

      {/* Main chat and video chat area */}
      <div className="chat-video-container">
        {/* Header for group name and toggle button */}
        <div className="chat-video-header">
       
        <h2>
  <FaUsers /> {groups.find((group) => group._id === currentGroup)?.groupName || 'Unnamed Group'}
</h2>


          <button
            className="toggle-button"
            onClick={() => setIsVideoChat((prev) => !prev)}
          >
            {isVideoChat ? <FaCommentAlt /> : <FaVideo />}
            
          </button>
        </div>

        {/* Conditional rendering of chat or video chat */}
        {isVideoChat ? (
          <VideoChat groupId={currentGroup} />
        ) : (
          <Chat groupId={currentGroup} groups={groups} />
        )}
      </div>
    </div>
  );
};

export default GroupChatPage;