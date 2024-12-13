import React, { useState } from 'react';
import api from '../../api';
import { useParams, useNavigate } from 'react-router-dom';
import './JoinGroup.css';

const JoinGroup = () => {
  const { invitationToken } = useParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const navigate = useNavigate();

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token); // Save the token for future use
      setErrorMessage('');
      setStatusMessage('Login successful! Joining the group...');
      joinGroup(res.data.token); // Proceed to join the group after login
    } catch (error) {
      setErrorMessage('Login failed. Please check your credentials or sign up.');
    }
  };

  // Join the group
  const joinGroup = async (token) => {
    setIsJoining(true);
    try {
      const res = await api.post(`/group/join/${invitationToken}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStatusMessage(res.data.message || 'Successfully joined the group!');
      setTimeout(() => navigate('/dashboard'), 2000); // Redirect after joining
    } catch (error) {
      setStatusMessage(error.response?.data?.message || 'Error joining the group.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="join-group-page">
      {!isJoining ? (
        <>
          <h1>Group Invitation</h1>
          <p>Please log in to join the group.</p>
          <form onSubmit={handleLogin}>
            <div>
              <label>Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit">Login and Join</button>
          </form>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          <p>Don’t have an account? <a href="/get-started">Sign up</a></p>
        </>
      ) : (
        <div>
          <h1>Joining the Group...</h1>
          <p>{statusMessage}</p>
        </div>
      )}
    </div>
  );
};

export default JoinGroup;
