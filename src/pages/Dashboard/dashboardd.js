import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

import GroupManagement from './GroupManagement';
import TaskManager from './TaskManager';
import GroupChatPage from './GroupChatPage';
import Profile from './Profile';
import Settings from './Settings';
import ProjectReport from './ProjectReport';
import Overview from './Overview';
import Analytics from './Analytics';
import Calendar from './Calendar';
import Help from './Help';
import Notifications from './Notifications';
import StudyResources from './StudyResources';

import CourseDetail from '../../components/courseDetail';
import Sidebar from '../../components/sidebar';
import TopNav from '../../components/TopNav';
import VoiceNavigation from '../../components/VoiceNavigation';
import NotificationToast from '../../components/NotificationToast';

import './dashboardd.css';

const Dashboardd = () => {
  const { t } = useLanguage(); // Add language context
  const [showSearch, setShowSearch] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('Student');
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalTimeSpent: 0,
    sessionsToday: 0,
    tasksCompleted: 0,
    activeGroups: 0,
    coursesEnrolled: 0,
    weeklyGoalProgress: 0
  });

  const navigate = useNavigate();

  // Define data arrays at the top
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
      navigate('/dashboard/overview');
    }
  }, [navigate]);

  // Initialize dashboard stats tracking
  useEffect(() => {
    const initializeDashboardStats = () => {
      // Get or create session start time
      const sessionStart = localStorage.getItem('sessionStart') || Date.now();
      if (!localStorage.getItem('sessionStart')) {
        localStorage.setItem('sessionStart', sessionStart);
      }

      // Load existing stats from localStorage
      const savedStats = localStorage.getItem('dashboardStats');
      let stats = {
        totalTimeSpent: 0,
        sessionsToday: 1,
        tasksCompleted: 8,
        activeGroups: 3,
        coursesEnrolled: userCourses.length,
        weeklyGoalProgress: 65,
        lastLoginDate: new Date().toISOString().split('T')[0],
        totalLogins: 1,
        studyStreak: 5
      };

      if (savedStats) {
        const parsedStats = JSON.parse(savedStats);
        const today = new Date().toISOString().split('T')[0];
        
        // Check if it's a new day
        if (parsedStats.lastLoginDate !== today) {
          stats = {
            ...parsedStats,
            sessionsToday: 1,
            lastLoginDate: today,
            totalLogins: parsedStats.totalLogins + 1,
            studyStreak: parsedStats.studyStreak + 1
          };
        } else {
          stats = {
            ...parsedStats,
            sessionsToday: parsedStats.sessionsToday + 1
          };
        }
      }

      setDashboardStats(stats);
      localStorage.setItem('dashboardStats', JSON.stringify(stats));
    };

    initializeDashboardStats();

    // Update time spent every minute
    const timeInterval = setInterval(() => {
      const sessionStart = localStorage.getItem('sessionStart');
      const currentTime = Date.now();
      const timeSpent = Math.floor((currentTime - sessionStart) / (1000 * 60)); // in minutes

      setDashboardStats(prevStats => {
        const updatedStats = {
          ...prevStats,
          totalTimeSpent: prevStats.totalTimeSpent + 1
        };
        localStorage.setItem('dashboardStats', JSON.stringify(updatedStats));
        return updatedStats;
      });
    }, 60000); // Update every minute

    return () => clearInterval(timeInterval);
  }, [userCourses.length]);

  // Initialize notifications
  useEffect(() => {
    const sampleNotifications = [
      {
        id: 1,
        type: 'task',
        title: 'Assignment Due Soon',
        message: 'Web Design assignment is due in 2 days',
        time: '2 hours ago',
        read: false,
        action: () => navigate('/dashboard/task-manager')
      },
      {
        id: 2,
        type: 'course',
        title: 'New Course Material',
        message: 'Dr. Jane uploaded new AI course materials',
        time: '5 hours ago',
        read: false,
        action: () => navigate('/dashboard/group-management')
      },
      {
        id: 3,
        type: 'group',
        title: 'Group Meeting Reminder',
        message: 'Study group meeting tomorrow at 3 PM',
        time: '1 day ago',
        read: true,
        action: () => navigate('/dashboard/group-chat-page')
      },
      {
        id: 4,
        type: 'system',
        title: 'Profile Updated',
        message: 'Your profile information has been successfully updated',
        time: '2 days ago',
        read: true,
        action: () => navigate('/dashboard/profile')
      },
      {
        id: 5,
        type: 'reminder',
        title: 'Weekly Report Due',
        message: 'Don\'t forget to submit your weekly project report',
        time: '3 days ago',
        read: false,
        action: () => navigate('/dashboard/project-report')
      }
    ];
    
    setNotifications(sampleNotifications);
  }, [navigate]);

  const readTask = (task) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(task);
    synth.speak(utterance);
  };

// Search functionality
const handleSearch = (query) => {
  setSearchQuery(query);
  
  if (!query.trim()) {
    setSearchResults([]);
    return;
  }

  const searchableContent = [
    ...userCourses.map(course => ({
      type: 'course',
      title: course.title,
      subtitle: `Instructor: ${course.instructor}`,
      action: () => navigate('/dashboard/group-management')
    })),
    ...tasks.map(task => ({
      type: 'task',
      title: task,
      subtitle: 'Task',
      action: () => navigate('/dashboard/task-manager')
    })),
    {
      type: 'page',
      title: 'Profile',
      subtitle: 'User Profile Settings',
      action: () => navigate('/dashboard/profile')
    },
    {
      type: 'page',
      title: 'Task Manager',
      subtitle: 'Manage your tasks',
      action: () => navigate('/dashboard/task-manager')
    },
    {
      type: 'page',
      title: 'Group Management',
      subtitle: 'Manage study groups',
      action: () => navigate('/dashboard/group-management')
    },
    {
      type: 'page',
      title: 'Settings',
      subtitle: 'Application settings',
      action: () => navigate('/dashboard/settings')
    },
    {
      type: 'page',
      title: 'Calendar',
      subtitle: 'View tasks in calendar format',
      action: () => navigate('/dashboard/calendar')
    },
    {
      type: 'page',
      title: 'Analytics',
      subtitle: 'View your productivity analytics',
      action: () => navigate('/dashboard/analytics')
    },
    {
      type: 'page',
      title: 'Help',
      subtitle: 'Get help and documentation',
      action: () => navigate('/dashboard/help')
    },
    {
      type: 'page',
      title: 'Project Report',
      subtitle: 'Generate and view project reports',
      action: () => navigate('/dashboard/project-report')
    },
    {
      type: 'page',
      title: 'Notifications',
      subtitle: 'View and manage your notifications',
      action: () => navigate('/dashboard/notifications')
    },
    {
      type: 'page',
      title: 'Study Resources',
      subtitle: 'Access study tools and learning materials',
      action: () => navigate('/dashboard/study-resources')
    }
  ];

  const filtered = searchableContent.filter(item =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  setSearchResults(filtered);
};

// Notification functionality
const handleNotificationRead = (notificationId) => {
  setNotifications(prevNotifications =>
    prevNotifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, read: true }
        : notification
    )
  );
};

  return (
    <div className="dashboard-layout">
      <Sidebar
        isCollapsed={isCollapsed}
        toggleSidebar={() => setIsCollapsed(!isCollapsed)}
        userEmail={userEmail}
      />
      <div className="main-content">
        <TopNav 
          toggleSearch={() => setShowSearch(!showSearch)} 
          onSearch={handleSearch}
          notifications={notifications}
          onNotificationRead={handleNotificationRead}
        />
        
        {searchResults.length > 0 && (
          <div className="search-results">
            <h3>Search Results for "{searchQuery}"</h3>
            <div className="search-results-list">
              {searchResults.map((result, index) => (
                <div 
                  key={index} 
                  className="search-result-item"
                  onClick={result.action}
                >
                  <div className="search-result-icon">
                    {result.type === 'course' && '📚'}
                    {result.type === 'task' && '✅'}
                    {result.type === 'page' && '📄'}
                  </div>
                  <div className="search-result-content">
                    <h4>{result.title}</h4>
                    <p>{result.subtitle}</p>
                  </div>
                  <div className="search-result-arrow">→</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="content-wrapper">
          <Routes>
            <Route path="/overview" element={<Overview />} />
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
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/project-report" element={<ProjectReport />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/study-resources" element={<StudyResources />} />
            <Route path="/help" element={<Help />} />
            <Route path="/course/:courseId" element={<CourseDetail />} />
          </Routes>
        </div>
      </div>
      
      {/* Voice Navigation Component */}
      <VoiceNavigation />
      
      {/* Real-time Notification Toasts */}
      <NotificationToast />
    </div>
  );
};



export default Dashboardd;
