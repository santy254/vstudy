import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaUsers, FaTasks, FaComments, FaUser, FaCog, FaFileAlt, FaBars, FaChartLine, FaCalendarAlt, FaQuestionCircle, FaChartBar, FaBell, FaBook } from 'react-icons/fa';
import { useLanguage } from '../contexts/LanguageContext';
import './sidebar.css';

const Sidebar = ({ isCollapsed, toggleSidebar, userEmail }) => {
  const { t } = useLanguage(); // Add language context

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        <FaBars />
      </button>

      {!isCollapsed && <div className="user-email">{userEmail}</div>}

      <nav>
        <NavLink to="/dashboard/overview">
          <FaChartLine className="icon" />
          {!isCollapsed && <span>{t('overview')}</span>}
        </NavLink>
        <NavLink to="/dashboard/group-management">
          <FaUsers className="icon" />
          {!isCollapsed && <span>{t('groupManagement')}</span>}
        </NavLink>
        <NavLink to="/dashboard/task-manager">
          <FaTasks className="icon" />
          {!isCollapsed && <span>{t('taskManager')}</span>}
        </NavLink>
        <NavLink to="/dashboard/group-chat-page">
          <FaComments className="icon" />
          {!isCollapsed && <span>{t('chat')}</span>}
        </NavLink>
        <NavLink to="/dashboard/profile">
          <FaUser className="icon" />
          {!isCollapsed && <span>{t('profile')}</span>}
        </NavLink>
        <NavLink to="/dashboard/settings">
          <FaCog className="icon" />
          {!isCollapsed && <span>{t('settings')}</span>}
        </NavLink>
        <NavLink to="/dashboard/calendar">
          <FaCalendarAlt className="icon" />
          {!isCollapsed && <span>Calendar</span>}
        </NavLink>
        <NavLink to="/dashboard/analytics">
          <FaChartBar className="icon" />
          {!isCollapsed && <span>Analytics</span>}
        </NavLink>
        <NavLink to="/dashboard/project-report">
          <FaFileAlt className="icon" />
          {!isCollapsed && <span>{t('projectReport')}</span>}
        </NavLink>
        <NavLink to="/dashboard/notifications">
          <FaBell className="icon" />
          {!isCollapsed && <span>Notifications</span>}
        </NavLink>
        <NavLink to="/dashboard/study-resources">
          <FaBook className="icon" />
          {!isCollapsed && <span>Study Resources</span>}
        </NavLink>
        <NavLink to="/dashboard/help">
          <FaQuestionCircle className="icon" />
          {!isCollapsed && <span>Help</span>}
        </NavLink>
      </nav>
    </div>
  );
};

export default Sidebar;
