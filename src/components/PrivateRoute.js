// src/components/PrivateRoute.js
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../AuthContext';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);

  // Redirect to sign-in if not authenticated
  if (!isAuthenticated) return <Navigate to="/signin" />;

  return children;
};

export default PrivateRoute;
