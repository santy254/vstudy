import axios from 'axios';

// Create an Axios instance with a base URL for all requests
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Make sure this matches your backend server URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept every request to add the JWT token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log("Token attached to request:", token); // Debugging line
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
