import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import AuthContext from '../../AuthContext'; // Import AuthContext
import './Profile.css';
import './EditProfile';


const Profile = () => {
  const { logout } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Add timestamp to prevent caching
        const res = await api.get(`/auth/profile?t=${Date.now()}`);
        console.log('Profile data received:', res.data);
        console.log('Profile picture field:', res.data.profilePicture);
        setProfile(res.data);
      } catch (err) {
        setError(err?.response?.data?.message || 'Error fetching profile data');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Function to refresh profile data
  const refreshProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/auth/profile?t=${Date.now()}`);
      console.log('🔄 Profile refreshed:', res.data);
      console.log('🖼️ Profile picture field:', res.data.profilePicture);
      setProfile(res.data);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Error fetching profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    logout();
    navigate('/');
  };

  return (
    <div className="content-box">
      <div className="profile-page">
        {error && <p className="error-message">{error}</p>}
        {loading ? (
          <div className="loading-spinner">Loading profile...</div>
        ) : (
          profile && (
            <div className="profile-container">
              <div className="profile-card">
               <img
  src={
    profile.profilePicture
      ? `http://localhost:5002${profile.profilePicture}`
      : '/logo192.png'
  }
  alt="Profile"
  className="profile-image"
  onLoad={(e) => {
    console.log('✅ Profile image loaded successfully:', e.target.src);
  }}
  onError={(e) => {
    console.log('❌ Profile image failed to load:', e.target.src);
    console.log('Profile picture field value:', profile.profilePicture);
    console.log('Constructed URL:', `http://localhost:5002${profile.profilePicture}`);
    e.target.src = '/logo192.png';
  }}
/>

                <h2 className="profile-name">Welcome, {profile.name}</h2>
                <p className="profile-email">Email: {profile.email}</p>
                <p className="profile-role">Role: {profile.role}</p>

                <div className="profile-details">
                  <div className="detail-item">
                    <h4>Location</h4>
                    <p>{profile.location || 'Not specified'}</p>
                  </div>
                  <div className="detail-item">
                    <h4>Bio</h4>
                    <p>{profile.bio || 'No bio available'}</p>
                  </div>
                </div>

                <button className="edit-button" onClick={() => navigate('/edit-profile')}>
                  Edit Profile
                </button>
                <button className="refresh-button" onClick={refreshProfile}>
                  🔄 Refresh Profile
                </button>
                <button 
                  className="test-button" 
                  onClick={() => {
                    if (profile.profilePicture) {
                      const imageUrl = `http://localhost:5002${profile.profilePicture}`;
                      console.log('🧪 Testing profile picture URL:', imageUrl);
                      window.open(imageUrl, '_blank');
                    } else {
                      alert('No profile picture set');
                    }
                  }}
                  style={{
                    background: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    margin: '5px',
                    cursor: 'pointer'
                  }}
                >
                  🔗 Test Image URL
                </button>
                <button className="logout-button" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Profile;
