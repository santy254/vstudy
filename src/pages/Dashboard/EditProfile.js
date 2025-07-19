// src/pages/EditProfile.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './EditProfile.css';
import api from '../../api';

const EditProfile = () => {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    location: '',
    bio: '',
    avatar: null, // Change from '' to null
  });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/profile');
        // Only set the fields we need, don't overwrite avatar
        setProfile({
          name: res.data.name || '',
          email: res.data.email || '',
          location: res.data.location || '',
          bio: res.data.bio || '',
          avatar: null, // Keep avatar as null for file uploads
        });
        // Fix: use profilePicture instead of avatar
        if (res.data.profilePicture) {
          setPreview(`http://localhost:5002${res.data.profilePicture}`);
          console.log('✅ Setting preview URL:', `http://localhost:5002${res.data.profilePicture}`);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    console.log('File selected:', file);
    console.log('File details:', {
      name: file?.name,
      size: file?.size,
      type: file?.type
    });
    setProfile({ ...profile, avatar: file });
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('=== SUBMITTING PROFILE UPDATE ===');
    console.log('Profile state:', profile);
    console.log('Profile avatar file:', profile.avatar);
    console.log('Avatar is File?', profile.avatar instanceof File);

    const formData = new FormData();
    formData.append('name', profile.name);
    formData.append('email', profile.email);
    formData.append('location', profile.location);
    formData.append('bio', profile.bio);
    
    if (profile.avatar && profile.avatar instanceof File) {
      formData.append('avatar', profile.avatar);
      console.log('✅ Avatar file added to FormData:', profile.avatar.name);
      console.log('File size:', profile.avatar.size);
      console.log('File type:', profile.avatar.type);
    } else {
      console.log('❌ No valid file to upload. Avatar:', profile.avatar);
    }

    // Debug FormData contents
    console.log('FormData contents:');
    for (let [key, value] of formData.entries()) {
      console.log(key, ':', value);
    }

    try {
      // Don't set Content-Type header - let the browser set it automatically for FormData
      const response = await api.put('/auth/profile', formData);
      console.log('Profile update response:', response.data);
      console.log('Updated profilePicture field:', response.data.profilePicture);
      
      // Test if the uploaded image is accessible
      if (response.data.profilePicture) {
        const imageUrl = `http://localhost:5002${response.data.profilePicture}`;
        console.log('🧪 Testing image accessibility:', imageUrl);
        
        // Test image load
        const testImg = new Image();
        testImg.onload = () => {
          console.log('✅ Profile image is accessible at:', imageUrl);
        };
        testImg.onerror = () => {
          console.log('❌ Profile image failed to load at:', imageUrl);
        };
        testImg.src = imageUrl;
      }
      
      alert('Profile updated successfully!');
      navigate('/dashboard/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile.');
    }
  };

  return (
    <div className="edit-profile">
      <h2>Edit Profile</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <label>
            Full Name
            <input
              type="text"
              name="name"
              value={profile.name}
              onChange={handleChange}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleChange}
            />
          </label>
          <label>
            Location
            <input
              type="text"
              name="location"
              value={profile.location}
              onChange={handleChange}
            />
          </label>
          <label>
            Bio
            <textarea
              name="bio"
              value={profile.bio}
              onChange={handleChange}
            />
          </label>
          <label>
            Profile Picture
            <input 
              type="file" 
              accept="image/*"
              onChange={handleImageChange}
              ref={(input) => {
                if (input) {
                  console.log('File input element:', input);
                }
              }}
            />
          </label>
          {preview && <img src={preview} alt="Profile Preview" className="image-preview" />}
          <button type="submit">Save Changes</button>
        </form>
      )}
    </div>
  );
};

export default EditProfile;
