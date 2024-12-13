import React, { useState } from 'react';
import api from '../api';  
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState(''); // State to store email input
  const [message, setMessage] = useState(''); // State to store success messages
  const [error, setError] = useState(''); // State to store error messages
  const [loading, setLoading] = useState(false); // State to manage loading state

  // Function to validate email format
  const validateEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous messages
    setMessage('');
    setError('');

    // Basic validation for email
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true); // Set loading to true while the request is in progress

      // Make a POST request to your backend API to send the reset link
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data.message); // Display success message from backend
      setEmail(''); // Clear the email field after successful submission
    } catch (err) {
      setError(err.response?.data?.message || 'Error sending reset link'); // Set error message
    } finally {
      setLoading(false); // Set loading to false when request completes
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-form">
        <h2>Forgot Your Password?</h2>
        <p>Enter your registered email to receive a password reset link.</p>
        <form onSubmit={handleSubmit} aria-live="polite">
          <label htmlFor="email" className="sr-only">Email Address</label>
          <input
            id="email"
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-required="true"
            aria-label="Email Address"
            className={error ? 'input-error' : ''} // Add class for styling if needed
            disabled={loading} // Disable input during loading
          />
          <button type="submit" className="btn-reset" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        {/* Display Success or Error Messages */}
        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message" aria-live="assertive">{error}</p>}
      </div>
    </div>
  );
};

export default ForgotPassword;
