import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import './JoinGroup.css';

const JoinGroup = () => {
  const { invitationToken } = useParams();
  const navigate = useNavigate();
  const [groupInfo, setGroupInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchGroupInfo();
  }, [invitationToken]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchGroupInfo = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching group info for token:', invitationToken);
      console.log('🌐 Current URL:', window.location.href);
      
      // Use the api instance but without authentication headers for this public endpoint
      const response = await api.get(`/group/invitation-info/${invitationToken}`);
      
      console.log('✅ Group info response:', response.data);
      // eslint-disable-next-line no-unused-vars
      
      setGroupInfo(response.data.group || response.data);
      setError('');
    } catch (err) {
      console.error('❌ Error fetching group info:', err);
      console.error('❌ Error details:', err.response?.data);
      
      // Provide more specific error messages
      if (err.response?.status === 404) {
        setError('This invitation link is invalid or has expired. Please ask the group creator for a new invitation link.');
      } else if (err.response?.status === 500) {
        setError('Server error occurred. Please try again later or contact support.');
      } else if (err.message.includes('Network Error') || err.code === 'ERR_NETWORK') {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
      } else {
        setError(err.response?.data?.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    try {
      setJoining(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        // Redirect to login with return URL
        localStorage.setItem('returnUrl', window.location.pathname);
        navigate('/login');
        return;
      }

      const response = await api.post(`/group/join/${invitationToken}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard/group-management');
      }, 2000);

    } catch (err) {
      console.error('Error joining group:', err);
      setError(err.response?.data?.message || 'Failed to join group');
    } finally {
      setJoining(false);
    }
  };

  const handleLoginRedirect = () => {
    localStorage.setItem('returnUrl', window.location.pathname);
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="join-group-container">
        <div className="join-group-card loading">
          <div className="loading-spinner"></div>
          <h2>Loading group information...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="join-group-container">
        <div className="join-group-card error">
          <div className="error-icon">❌</div>
          <h2>Invitation Error</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button 
              className="btn secondary"
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </button>
            <button 
              className="btn primary"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="join-group-container">
        <div className="join-group-card success">
          <div className="success-icon">✅</div>
          <h2>Successfully Joined!</h2>
          <p>Welcome to <strong>{groupInfo.groupName}</strong>!</p>
          <p>Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="join-group-container">
      <div className="join-group-card">
        <div className="group-invitation-header">
          <div className="invitation-icon">👥</div>
          <h1>You're Invited!</h1>
        </div>

        <div className="group-info">
          <h2>{groupInfo.groupName}</h2>
          <p className="group-description">{groupInfo.groupDescription}</p>
          
          <div className="group-stats">
            <div className="stat">
              <span className="stat-icon">👤</span>
              <span className="stat-text">{groupInfo.memberCount || 0} members</span>
            </div>
            <div className="stat">
              <span className="stat-icon">👑</span>
              <span className="stat-text">Created by {groupInfo.creatorName}</span>
            </div>
            <div className="stat">
              <span className="stat-icon">📅</span>
              <span className="stat-text">
                Created {new Date(groupInfo.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="join-actions">
          {localStorage.getItem('token') ? (
            <>
              <button 
                className="btn primary large"
                onClick={handleJoinGroup}
                disabled={joining}
              >
                {joining ? (
                  <>
                    <span className="btn-spinner"></span>
                    Joining...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">🚀</span>
                    Join Group
                  </>
                )}
              </button>
              <button 
                className="btn secondary"
                onClick={() => navigate('/dashboard')}
              >
                Maybe Later
              </button>
            </>
          ) : (
            <>
              <p className="login-prompt">Please log in to join this group</p>
              <button 
                className="btn primary large"
                onClick={handleLoginRedirect}
              >
                <span className="btn-icon">🔑</span>
                Login to Join
              </button>
              <button 
                className="btn secondary"
                onClick={() => navigate('/')}
              >
                Go Home
              </button>
            </>
          )}
        </div>

        <div className="invitation-footer">
          <p>This invitation link is secure and can only be used once per user.</p>
        </div>
      </div>
    </div>
  );
};

export default JoinGroup;