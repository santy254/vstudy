import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

const SimpleEditProfile = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    console.log('File selected:', file);
    
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    setUploading(true);
    console.log('Starting upload...');

    const formData = new FormData();
    formData.append('avatar', selectedFile);
    formData.append('name', 'ping'); // Use your actual name
    formData.append('email', 'ping@gmail.com'); // Use your actual email
    formData.append('location', '');
    formData.append('bio', 'king');

    console.log('FormData created with file:', selectedFile.name);

    try {
      const response = await api.put('/auth/profile', formData);
      console.log('Upload successful:', response.data);
      alert('Profile picture uploaded successfully!');
      navigate('/dashboard/profile');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Simple Profile Picture Upload Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <input 
          type="file" 
          accept="image/*"
          onChange={handleFileSelect}
          style={{ marginBottom: '10px' }}
        />
      </div>

      {preview && (
        <div style={{ marginBottom: '20px' }}>
          <img 
            src={preview} 
            alt="Preview" 
            style={{ width: '200px', height: '200px', objectFit: 'cover' }}
          />
        </div>
      )}

      <button 
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: selectedFile ? '#007bff' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: '4px'
        }}
      >
        {uploading ? 'Uploading...' : 'Upload Profile Picture'}
      </button>

      <div style={{ marginTop: '20px' }}>
        <button onClick={() => navigate('/dashboard/profile')}>
          Back to Profile
        </button>
      </div>
    </div>
  );
};

export default SimpleEditProfile;