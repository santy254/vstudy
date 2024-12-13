// src/pages/Home.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css'; // Ensure to create this file for styling

const Home = () => {
  return (
    <div className="home-container">
      <div className="home-hero">
        {/* Hero Image */}
        <img src="home.jpg" alt="Study Group" className="hero-image" />
        <div className="hero-content">
          <h1>Virtual Study Group Platform</h1>
          <p>Connect, Collaborate, and Learn Better Together</p>
          <Link to="/get-started" className="btn-hero">Get Started</Link>
        </div>
      </div>
      
      <div className="home-features-preview">
        <h2>Why Choose Us?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Real-Time Collaboration</h3>
            <p>Chat, video call, and collaborate seamlessly in real-time.</p>
          </div>
          <div className="feature-card">
            <h3>Task Management</h3>
            <p>Stay organized with powerful task management tools.</p>
          </div>
          <div className="feature-card">
            <h3>Shared Notes</h3>
            <p>Create, edit, and share notes with your group members.</p>
          </div>
          <div className="feature-card">
            <h3>Video Integration</h3>
            <p>Integrate YouTube content directly into your study sessions.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
