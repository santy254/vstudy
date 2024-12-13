import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import './SignIn.css';
import AuthContext from '../AuthContext'; // Import Auth Context

const SignIn = () => {
  const { setIsAuthenticated } = useContext(AuthContext); // Use context to update authentication state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic form validation for email and password
    if (!/\S+@\S+\.\S+/.test(email)) {
      return setError('Please enter a valid email address.');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }

    setLoading(true);
    try {
      // Make the API call to log in the user
      const res = await api.post('/auth/login', { email, password });

      // Store the token and user data in localStorage
      localStorage.setItem('token', res.data.token);
      console.log("Token stored in localStorage:", res.data.token); // Debugging line
      localStorage.setItem('user', JSON.stringify(res.data.user)); // Store user data
      console.log("User data stored in localStorage:", res.data.user); // Debugging line
     


      // Update the authentication state
      setIsAuthenticated(true); // Set authenticated to true

      // Redirect to the dashboard after successful login
      navigate('/dashboard');
     
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="signin-container">
      <div className="signin-form">
        <h2>Welcome Back!</h2>
        <p>Please sign in to continue</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn-signin" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
          {error && <p className="error-message">{error}</p>} {/* Display error message */}
        </form>
        <p>
          <Link to="/forgot-password" className="forgot-password-link">Forgot Password?</Link>
        </p>
        <p>
          Don't have an account? <Link to="/get-started" className="get-started-link">Get Started</Link>
        </p>
      </div>
    </div>
  );
};

export default SignIn;
