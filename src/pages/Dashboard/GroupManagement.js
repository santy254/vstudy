import React, { useState, useEffect } from 'react';
import api from '../../api';
import './GroupManagement.css';

const GroupManagement = ({ onGroupChange = () => {} }) => {
  const [groups, setGroups] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [invitationLink, setInvitationLink] = useState('');
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [activeGroup, setActiveGroup] = useState(null);
  const [members, setMembers] = useState([]);
  
  useEffect(() => {
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
    fetchGroups();
  }, []);

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
  
      console.log('Creating group with name:', groupName, 'and description:', groupDescription);
      const res = await api.post(
        '/group/create',
        { groupName, groupDescription },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setGroups((prevGroups) => [...prevGroups, res.data.newGroup]);
      setGroupName('');
      setGroupDescription('');
      setNotification({ message: 'Group created successfully!', type: 'success' });
      
      setTimeout(() => setNotification({ message: '', type: '' }), 3000);
  
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'An unknown error occurred';
      console.error('Error creating group:', errorMessage);
      setNotification({ message: errorMessage, type: 'error' });
    }
  };

  const generateInvitationLink = async (groupId) => {
    try {
      const res = await api.get(`/group/invite/${groupId}`);
      const invitationToken = res.data.invitationToken;
  
      if (invitationToken) {
        setInvitationLink(`${window.location.origin}/join-group/${invitationToken}`);
        setNotification({ message: 'Invite link generated!', type: 'success' });
      } else {
        setNotification({ message: 'Failed to generate invite link', type: 'error' });
      }
    } catch (error) {
      setNotification({ message: 'Error generating invitation link', type: 'error' });
    }
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
    </div>
  );
};

export default GroupManagement;
