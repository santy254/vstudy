import React, { useState, useEffect } from 'react';
import { NavLink, Routes, Route, useNavigate } from 'react-router-dom';
import * as Icons from 'react-icons/fa';
import GroupManagement from './GroupManagement';
import TaskManager from './TaskManager';


import GroupChatPage from './GroupChatPage';
import Profile from './Profile';
import Settings from './Settings';
import ProjectReport from './ProjectReport';
import './dashboardd.css';

// Sidebar Component
const Sidebar = ({ isCollapsed, toggleSidebar, userEmail }) => {
  const initial = userEmail ? userEmail[0].toUpperCase() : ' ';

  const links = [
    { to: 'group-management', icon: <Icons.FaUsers />, label: 'Group Management' },
    { to: 'task-manager', icon: <Icons.FaTasks />, label: 'Task Manager' },
    { to: 'group-chat-page', icon: <Icons.FaComments />, label: 'Group Chat' },
    { to: 'project-report', icon: <Icons.FaFileAlt />, label: 'Project Report' },
  ];

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="logo">
        <h1>Study Hub</h1>
        <button className="toggle-button" onClick={toggleSidebar}>
          <Icons.FaBars />
        </button>
      </div>
      <nav className="nav-links">
        {links.map((link, idx) => (
          <NavLink
            key={idx}
            to={link.to}
            className="nav-item"
            activeclassname="active"
            aria-label={link.label}
          >
            {link.icon} <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <NavLink to="settings" className="settings-link" aria-label="Settings">
          <Icons.FaCog /> <span>Settings</span>
        </NavLink>
        <div className="profile-section">
          <NavLink to="profile" className="profile-icon" aria-label="Profile">
            {initial}
          </NavLink>
          <div className="profile-details">
            <p>{userEmail}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Top Navigation Component
const TopNav = ({ toggleSearch }) => (
  <div className="top-nav">
    <h2>Dashboard</h2>
    <div className="nav-actions">
      <Icons.FaSearch className="search-icon" onClick={toggleSearch} aria-label="Search" />
      <Icons.FaBell className="notifications-icon" aria-label="Notifications" />
    </div>
  </div>
);


// Dashboard Component
const Dashboardd = () => {
  const [showSearch, setShowSearch] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const navigate = useNavigate();

  // Fetch user email from localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUserEmail(parsedUser.email || 'Email');
      } else {
        setUserEmail('Email');
      }
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
      setUserEmail('Email');
    }
  }, []);

  useEffect(() => {
    // Redirect to default path if the current path is `/dashboard`
    if (window.location.pathname === '/dashboard') {
      navigate('/dashboard/group-management');
    }
  }, [navigate]);

  return (
    
      <div className="dashboard-layout">
        <Sidebar
          isCollapsed={isCollapsed}
          toggleSidebar={() => setIsCollapsed(!isCollapsed)}
          userEmail={userEmail}
        />
        <div className="main-content">
          <TopNav toggleSearch={() => setShowSearch(!showSearch)} />
          {showSearch && <input type="text" className="search-bar" placeholder="Search..." />}
          <div className="content-wrapper">
            <Routes>
              <Route path="/profile" element={<Profile />} />
              <Route path="/task-manager" element={<TaskManager />} />
              <Route path="/group-management" element={<GroupManagement />} />
              <Route path="/group-chat-page" element={<GroupChatPage />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/project-report" element={<ProjectReport />} />
            </Routes>
          </div>
        </div>
        </div>
        
        
  );
};

export default Dashboardd;
