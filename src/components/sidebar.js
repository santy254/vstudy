import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaUsers, FaTasks, FaComments, FaUser, FaCog, FaFileAlt, FaBars } from 'react-icons/fa';
import './sidebar.css';

const Sidebar = ({ isCollapsed, toggleSidebar, userEmail }) => {
  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        <FaBars />
      </button>

      {!isCollapsed && <div className="user-email">{userEmail}</div>}

      <nav>
        <NavLink to="/dashboard/group-management">
          <FaUsers className="icon" />
          {!isCollapsed && <span>Group Management</span>}
        </NavLink>
        <NavLink to="/dashboard/task-manager">
          <FaTasks className="icon" />
          {!isCollapsed && <span>Task Manager</span>}
        </NavLink>
        <NavLink to="/dashboard/group-chat-page">
          <FaComments className="icon" />
          {!isCollapsed && <span>Group Chat</span>}
        </NavLink>
        <NavLink to="/dashboard/profile">
          <FaUser className="icon" />
          {!isCollapsed && <span>Profile</span>}
        </NavLink>
        <NavLink to="/dashboard/settings">
          <FaCog className="icon" />
          {!isCollapsed && <span>Settings</span>}
        </NavLink>
        <NavLink to="/dashboard/project-report">
          <FaFileAlt className="icon" />
          {!isCollapsed && <span>Project Rep</span>}
        </NavLink>
      </nav>
    </div>
  );
};

export default Sidebar;
