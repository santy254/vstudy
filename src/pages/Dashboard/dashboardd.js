import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';

import GroupManagement from './GroupManagement';
import TaskManager from './TaskManager';
import GroupChatPage from './GroupChatPage';
import Profile from './Profile';
import Settings from './Settings';
import ProjectReport from './ProjectReport';

import CourseDetail from '../../components/courseDetail';
import Sidebar from '../../components/sidebar';
import TopNav from '../../components/TopNav';

import './dashboardd.css';

const Dashboardd = () => {
  const [showSearch, setShowSearch] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('Student');

  const navigate = useNavigate();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUserEmail(parsedUser.email || '');
        setUserName(parsedUser.name || 'Student');
      }
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
    }
  }, []);

  useEffect(() => {
    if (window.location.pathname === '/dashboard') {
      navigate('/dashboard/group-management');
    }
  }, [navigate]);

  const tasks = [
  'Complete assignment for Web Design',
  'Prepare for next group meeting',
  'Submit project outline by Friday'
];

const userCourses = [
  { title: 'Introduction to AI', instructor: 'Dr. Jane' },
  { title: 'Web Development', instructor: 'Mr. Mike' },
  { title: 'Database Systems', instructor: 'Ms. Linda' }
];

const readTask = (task) => {
  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(task);
  synth.speak(utterance);
};

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
          <Route path="/group-management" element={
  <GroupManagement 
    userCourses={userCourses} 
    tasks={tasks} 
    readTask={readTask} 
    userName={userName}
  />
} />

            <Route path="/group-chat-page" element={<GroupChatPage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/project-report" element={<ProjectReport />} />
            <Route path="/course/:courseId" element={<CourseDetail />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};
export default Dashboardd;
