import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css'; // Optional: for styling

const Sidebar = ({ isCollapsed, toggleSidebar, userEmail }) => {
  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button onClick={toggleSidebar}>☰</button>
      <p>{userEmail}</p>
      <nav>
        <ul>
          <li><Link to="/dashboard/group-management">Group Management</Link></li>
          <li><Link to="/dashboard/task-manager">Task Manager</Link></li>
          <li><Link to="/dashboard/group-chat-page">Group Chat</Link></li>
          <li><Link to="/dashboard/profile">Profile</Link></li>
          <li><Link to="/dashboard/settings">Settings</Link></li>
          <li><Link to="/dashboard/project-report">Project Report</Link></li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
