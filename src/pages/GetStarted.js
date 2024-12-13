import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api'; // Ensure that api.js exports an Axios instance
import './GetStarted.css';

const GetStarted = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // Added state for Confirm Password
  const [error, setError] = useState(''); // State to handle error messages
  const [message, setMessage] = useState(''); // State to handle success messages
  const navigate = useNavigate(); // Use navigate for redirection

  // Handle Sign Up form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Reset any previous error
    setMessage(''); // Reset any previous success message

    // Validate password and confirmPassword match
    if (password !== confirmPassword) {
      setError('Passwords do not match'); // Show error if passwords don't match
      return;
    }

    try {
      // Use the api instance for the POST request
      const res = await api.post('/auth/register', { name, email, password });

      // Set success message
      setMessage(res.data.message);

      // Clear the form fields
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword(''); // Clear confirm password

      // Redirect to the Sign In page after successful registration
      setTimeout(() => {
        navigate('/signin');
      }, 2000); // Optional: Add a short delay before redirecting
    } catch (err) {
      // Set error message if registration fails
      setError(err.response?.data?.message || 'Error creating account');
    }
  };

  return (
    <div className="getstarted-container">
      <div className="getstarted-form">
        <h2>Create Your Account</h2>
        <p>Get started by creating a new account</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"  // Corrected the input type
            placeholder="Confirm Password"
            value={confirmPassword} // Separate state for confirm password
            onChange={(e) => setConfirmPassword(e.target.value)} // Use confirmPassword state
            required
          />
          <button type="submit" className="btn-getstarted">Create Account</button>
          {message && <p className="success-message">{message}</p>} {/* Display success message */}
          {error && <p className="error-message">{error}</p>} {/* Display error message */}
        </form>
        <p>
          Already have an account? <Link to="/signin">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default GetStarted;
