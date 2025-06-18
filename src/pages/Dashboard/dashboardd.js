import React, { useState, useEffect } from 'react';
import { NavLink, Routes, Route, useNavigate, Link } from 'react-router-dom';
import * as Icons from 'react-icons/fa';
import GroupManagement from './GroupManagement';
import TaskManager from './TaskManager';
import GroupChatPage from './GroupChatPage';
import Profile from './Profile';
import Settings from './Settings';
import ProjectReport from './ProjectReport';
import CourseDetail from './CourseDetail';
import './dashboardd.css';

const Dashboardd = () => {
  const [showSearch, setShowSearch] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('Student');
  const [tasks, setTasks] = useState([
    'Complete assignment for Web Design',
    'Prepare for next group meeting',
    'Submit project outline by Friday'
  ]);

  const userCourses = [
    { title: 'Introduction to AI', instructor: 'Dr. Jane' },
    { title: 'Web Development', instructor: 'Mr. Mike' },
    { title: 'Database Systems', instructor: 'Ms. Linda' }
  ];

  const navigate = useNavigate();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUserEmail(parsedUser.email || 'Email');
        setUserName(parsedUser.name || 'Student');
      } else {
        setUserEmail('Email');
        setUserName('Student');
      }
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
      setUserEmail('Email');
      setUserName('Student');
    }
  }, []);

  useEffect(() => {
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
          <section className="welcome-panel" aria-label="Welcome panel">
            <img src="/profile-pic.jpg" alt="Profile" className="profile-pic" />
            <h3>{getGreeting()}, {userName}!</h3>
            <p>You're enrolled in 4 courses. Your next class is at 2 PM.</p>
          </section>

          <section className="course-overview" aria-label="Course overview">
            <h4>Current Courses</h4>
            <ul>
              {userCourses.map((course, index) => (
                <li key={index}>
                  <Link to={`/dashboard/course/${course.title.toLowerCase().replace(/\s+/g, '-')}`}>{course.title} – Instructor: {course.instructor}</Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="events-panel" aria-label="Upcoming events">
            <h4>Upcoming Events</h4>
            <ul>
              <li>Midterm exam – July 25</li>
              <li>Assignment 2 due – July 30</li>
              <li>Project proposal – Aug 5</li>
            </ul>
          </section>

          <section className="todo-section" aria-label="To-Do List">
            <h4>Your Tasks</h4>
            <ul>
              {tasks.map((task, index) => (
                <li key={index}>
                  <button onClick={() => readTask(task)}>🔊</button> {task}
                </li>
              ))}
            </ul>
          </section>

          <Routes>
            <Route path="/profile" element={<Profile />} />
            <Route path="/task-manager" element={<TaskManager />} />
            <Route path="/group-management" element={<GroupManagement />} />
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

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

const readTask = (task) => {
  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(task);
  synth.speak(utterance);
};

export default Dashboardd;
