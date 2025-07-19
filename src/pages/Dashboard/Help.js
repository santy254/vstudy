import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import './Help.css';

const Help = () => {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaqs, setExpandedFaqs] = useState([]);

  // Toggle FAQ expansion
  const toggleFaq = (id) => {
    if (expandedFaqs.includes(id)) {
      setExpandedFaqs(expandedFaqs.filter(faqId => faqId !== id));
    } else {
      setExpandedFaqs([...expandedFaqs, id]);
    }
  };

  // Help categories and content
  const helpCategories = [
    { id: 'getting-started', name: 'Getting Started', icon: '🚀' },
    { id: 'tasks', name: 'Task Management', icon: '📝' },
    { id: 'groups', name: 'Study Groups', icon: '👥' },
    { id: 'calendar', name: 'Calendar', icon: '📅' },
    { id: 'analytics', name: 'Analytics', icon: '📊' },
    { id: 'account', name: 'Account Settings', icon: '⚙️' },
    { id: 'troubleshooting', name: 'Troubleshooting', icon: '🔧' },
  ];

  // FAQ data
  const faqs = [
    {
      id: 'faq-1',
      category: 'getting-started',
      question: 'How do I get started with the app?',
      answer: 'To get started, first create an account and log in. Once logged in, you\'ll see your dashboard with an overview of your tasks and study groups. You can create your first task by clicking on "Task Manager" in the sidebar and then clicking the "Create Task" button.'
    },
    {
      id: 'faq-2',
      category: 'tasks',
      question: 'How do I create a new task?',
      answer: 'To create a new task, go to the Task Manager page from the sidebar. Fill out the task creation form with a title, description (optional), due date, and priority level. Click "Create Task" to save your new task.'
    },
    {
      id: 'faq-3',
      category: 'tasks',
      question: 'How do I mark a task as complete?',
      answer: 'In the Task Manager, each task has a circle button (⭕) next to it. Click this button to mark the task as complete. The button will change to a checkmark (✅) and the task will be marked as completed.'
    },
    {
      id: 'faq-4',
      category: 'groups',
      question: 'How do I create a study group?',
      answer: 'Go to the Group Management page from the sidebar. Click the "Create Group" button and fill out the form with a group name and description. Click "Create Group" to create your new study group.'
    },
    {
      id: 'faq-5',
      category: 'groups',
      question: 'How do I invite others to my study group?',
      answer: 'In the Group Management page, find your group and click "Generate Invite Link". You can then share this link via WhatsApp, Email, or SMS. You can also share the QR code for easy mobile access.'
    },
    {
      id: 'faq-6',
      category: 'calendar',
      question: 'How does the calendar view work?',
      answer: 'The Calendar page shows all your tasks organized by their due dates. You can navigate between months, weeks, or days using the controls at the top. Click on any task in the calendar to see its details or click on a day to see all tasks due on that day.'
    },
    {
      id: 'faq-7',
      category: 'analytics',
      question: 'What do the analytics show me?',
      answer: 'The Analytics page provides insights into your productivity and progress. You can see statistics about your task completion rate, study streak, weekly activity, and more. Use these insights to understand your study habits and improve your productivity.'
    },
    {
      id: 'faq-8',
      category: 'account',
      question: 'How do I change my password?',
      answer: 'Go to the Settings page from the sidebar. In the Security tab, you\'ll find the option to change your password. Enter your current password and your new password, then click "Save Changes".'
    },
    {
      id: 'faq-9',
      category: 'account',
      question: 'How do I update my profile picture?',
      answer: 'Go to your Profile page by clicking on your name in the sidebar. Click "Edit Profile", then click on the profile picture area to upload a new image. Click "Save" to update your profile picture.'
    },
    {
      id: 'faq-10',
      category: 'troubleshooting',
      question: 'I can\'t log in to my account. What should I do?',
      answer: 'First, make sure you\'re using the correct email and password. If you\'ve forgotten your password, use the "Forgot Password" link on the login page. If you still can\'t log in, try clearing your browser cache or using a different browser.'
    },
    {
      id: 'faq-11',
      category: 'troubleshooting',
      question: 'The app is running slowly. How can I fix this?',
      answer: 'Try clearing your browser cache and cookies. Make sure you\'re using the latest version of your browser. If the problem persists, try using a different browser or contact support for assistance.'
    },
    {
      id: 'faq-12',
      category: 'getting-started',
      question: 'Is there a mobile app available?',
      answer: 'Currently, our application is web-based and optimized for mobile browsers. You can access it from any device by visiting the website. The responsive design ensures a great experience on both desktop and mobile devices.'
    },
  ];

  // Filter FAQs based on active category and search query
  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Video tutorials data
  const videoTutorials = [
    {
      id: 'video-1',
      title: 'Getting Started with Virtual Study Group',
      thumbnail: 'https://via.placeholder.com/300x169',
      duration: '3:45',
      category: 'getting-started'
    },
    {
      id: 'video-2',
      title: 'How to Create and Manage Tasks',
      thumbnail: 'https://via.placeholder.com/300x169',
      duration: '4:20',
      category: 'tasks'
    },
    {
      id: 'video-3',
      title: 'Creating and Managing Study Groups',
      thumbnail: 'https://via.placeholder.com/300x169',
      duration: '5:15',
      category: 'groups'
    },
    {
      id: 'video-4',
      title: 'Using the Calendar Effectively',
      thumbnail: 'https://via.placeholder.com/300x169',
      duration: '3:30',
      category: 'calendar'
    },
  ];

  // Filter videos based on active category
  const filteredVideos = videoTutorials.filter(video => 
    activeCategory === 'all' || video.category === activeCategory
  );

  return (
    <div className="help-page">
      <div className="help-header">
        <h1>📚 Help & Documentation</h1>
        <p>Find answers to common questions and learn how to use the app</p>
      </div>

      {/* Search Bar */}
      <div className="help-search">
        <input
          type="text"
          placeholder="Search for help topics..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button className="search-btn">
          🔍 Search
        </button>
      </div>

      {/* Category Navigation */}
      <div className="category-nav">
        <button 
          className={`category-btn ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          🔍 All Topics
        </button>
        {helpCategories.map(category => (
          <button
            key={category.id}
            className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(category.id)}
          >
            {category.icon} {category.name}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="help-content">
        {/* FAQs Section */}
        <div className="faqs-section">
          <h2>Frequently Asked Questions</h2>
          {filteredFaqs.length > 0 ? (
            <div className="faq-list">
              {filteredFaqs.map(faq => (
                <div 
                  key={faq.id} 
                  className={`faq-item ${expandedFaqs.includes(faq.id) ? 'expanded' : ''}`}
                  onClick={() => toggleFaq(faq.id)}
                >
                  <div className="faq-question">
                    <h3>{faq.question}</h3>
                    <span className="expand-icon">
                      {expandedFaqs.includes(faq.id) ? '−' : '+'}
                    </span>
                  </div>
                  {expandedFaqs.includes(faq.id) && (
                    <div className="faq-answer">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-results">
              <p>No FAQs found for your search. Try a different query or category.</p>
            </div>
          )}
        </div>

        {/* Video Tutorials Section */}
        <div className="video-section">
          <h2>Video Tutorials</h2>
          {filteredVideos.length > 0 ? (
            <div className="video-grid">
              {filteredVideos.map(video => (
                <div key={video.id} className="video-card">
                  <div className="video-thumbnail">
                    <img src={video.thumbnail} alt={video.title} />
                    <span className="video-duration">{video.duration}</span>
                    <button className="play-btn">▶</button>
                  </div>
                  <h3>{video.title}</h3>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-results">
              <p>No video tutorials available for this category.</p>
            </div>
          )}
        </div>

        {/* Quick Start Guide */}
        {(activeCategory === 'getting-started' || activeCategory === 'all') && (
          <div className="quick-start-section">
            <h2>Quick Start Guide</h2>
            <div className="steps-container">
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>Create Your Account</h3>
                  <p>Sign up with your email and create a password to get started.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Set Up Your Profile</h3>
                  <p>Add your personal information and upload a profile picture.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>Create Your First Task</h3>
                  <p>Go to Task Manager and create your first study task with a due date.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h3>Join or Create a Study Group</h3>
                  <p>Connect with other students by joining existing groups or creating your own.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">5</div>
                <div className="step-content">
                  <h3>Track Your Progress</h3>
                  <p>Use the Analytics page to monitor your productivity and study habits.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contact Support */}
        <div className="contact-support">
          <h2>Still Need Help?</h2>
          <p>If you can't find the answer you're looking for, don't hesitate to reach out to our support team.</p>
          <div className="contact-options">
            <button className="contact-btn email">
              📧 Email Support
            </button>
            <button className="contact-btn chat">
              💬 Live Chat
            </button>
            <button className="contact-btn phone">
              📞 Call Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;