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
        const res = await api.get('/auth/profile');
        setProfile(res.data);
      } catch (err) {
        setError(err?.response?.data?.message || 'Error fetching profile data');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

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
                  src={profile.avatar || ' '}
                  alt="Profile"
                  className="profile-image"
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
