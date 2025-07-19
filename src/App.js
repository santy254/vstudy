
import React, { useState, useEffect } from 'react'; // Importing useState and useEffect
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'; // Importing Router and Routes

import { AuthProvider } from './AuthContext'; // Import Auth Context and Provider
import { ThemeProvider } from './contexts/ThemeContext'; // Import Theme Context
import { LanguageProvider } from './contexts/LanguageContext'; // Import Language Context
import { NotificationProvider } from './contexts/NotificationContext'; // Import Notification Context
import { DashboardProvider } from './contexts/DashboardContext'; // Import Dashboard Context
import './themes.css'; // Import theme styles

import Home from './pages/Home';
import Features from './pages/Features';
import FAQ from './pages/FAQ';
import About from './pages/About';
import SignIn from './pages/SignIn'; // SignIn form page
import GetStarted from './pages/GetStarted'; // Get Started form page
import Pricing from './pages/Pricing';
import Contact from './pages/Contact';
import JoinGroup from './pages/JoinGroup';
import TaskManager from './pages/Dashboard/TaskManager';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import EditProfile from './pages/Dashboard/EditProfile';
import Dashboardd from './pages/Dashboard/dashboardd'; // Dashboard component
import PublicLayout from './components/PublicLayout'; // Layout for public pages
import PrivateRoute from './components/PrivateRoute'; // Private Route

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if the user is authenticated on initial render
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token); // Set authentication state based on token presence
  }, []);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider value={{ isAuthenticated, setIsAuthenticated }}>
          <Router>
            <Routes>
              {/* Public Routes wrapped in PublicLayout */}
              <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
              <Route path="/features" element={<PublicLayout><Features /></PublicLayout>} />
              <Route path="/faq" element={<PublicLayout><FAQ /></PublicLayout>} />
              <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
              <Route path="/pricing" element={<PublicLayout><Pricing /></PublicLayout>} />
              <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />

              {/* Pages without Navbar and Footer */}
              <Route path="/signin" element={<SignIn />} />
              <Route path="/get-started" element={<GetStarted />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/join-group/:invitationToken" element={<JoinGroup />} />
              <Route path="/edit-profile" element={<EditProfile />} />
              <Route path="/task-manager/:groupId" element={<TaskManager />} />
              
              {/* Protected Route for Dashboard */}
              <Route
                path="/dashboard/*"
                element={
                  <PrivateRoute isAuthenticated={isAuthenticated}>
                    <NotificationProvider>
                      <DashboardProvider>
                        <Dashboardd />
                      </DashboardProvider>
                    </NotificationProvider>
                  </PrivateRoute>
                }
              />
            </Routes>
          </Router>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
