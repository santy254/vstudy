import React, { useState } from 'react';
import './StudyResources.css';

const StudyResources = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteResources, setFavoriteResources] = useState([]);

  // Study resources data
  const studyResources = [
    {
      id: 1,
      title: 'Pomodoro Timer',
      description: 'A productivity technique using 25-minute focused work sessions',
      category: 'productivity',
      type: 'tool',
      url: '#',
      icon: '🍅',
      rating: 4.8,
      tags: ['focus', 'time-management', 'productivity']
    },
    {
      id: 2,
      title: 'Mind Mapping Guide',
      description: 'Learn how to create effective mind maps for better learning',
      category: 'study-techniques',
      type: 'guide',
      url: '#',
      icon: '🧠',
      rating: 4.6,
      tags: ['visualization', 'memory', 'organization']
    },
    {
      id: 3,
      title: 'Khan Academy',
      description: 'Free online courses and practice exercises',
      category: 'learning-platforms',
      type: 'platform',
      url: 'https://khanacademy.org',
      icon: '🎓',
      rating: 4.9,
      tags: ['math', 'science', 'free', 'courses']
    },
    {
      id: 4,
      title: 'Anki Flashcards',
      description: 'Spaced repetition flashcard system for memorization',
      category: 'memory-tools',
      type: 'app',
      url: 'https://apps.ankiweb.net',
      icon: '📚',
      rating: 4.7,
      tags: ['memory', 'flashcards', 'spaced-repetition']
    },
    {
      id: 5,
      title: 'Forest App',
      description: 'Stay focused and avoid phone distractions while studying',
      category: 'productivity',
      type: 'app',
      url: '#',
      icon: '🌲',
      rating: 4.5,
      tags: ['focus', 'distraction-blocking', 'gamification']
    },
    {
      id: 6,
      title: 'Cornell Note-Taking System',
      description: 'Effective note-taking method for better retention',
      category: 'study-techniques',
      type: 'guide',
      url: '#',
      icon: '📝',
      rating: 4.4,
      tags: ['note-taking', 'organization', 'retention']
    },
    {
      id: 7,
      title: 'Coursera',
      description: 'Online courses from top universities and companies',
      category: 'learning-platforms',
      type: 'platform',
      url: 'https://coursera.org',
      icon: '🏛️',
      rating: 4.6,
      tags: ['courses', 'certificates', 'universities']
    },
    {
      id: 8,
      title: 'Quizlet',
      description: 'Create and study flashcards, games, and practice tests',
      category: 'memory-tools',
      type: 'platform',
      url: 'https://quizlet.com',
      icon: '🎯',
      rating: 4.3,
      tags: ['flashcards', 'games', 'practice-tests']
    },
    {
      id: 9,
      title: 'Active Recall Techniques',
      description: 'Learn how to use active recall for better memory retention',
      category: 'study-techniques',
      type: 'guide',
      url: '#',
      icon: '🔄',
      rating: 4.8,
      tags: ['memory', 'retention', 'active-learning']
    },
    {
      id: 10,
      title: 'Notion',
      description: 'All-in-one workspace for notes, tasks, and project management',
      category: 'productivity',
      type: 'tool',
      url: 'https://notion.so',
      icon: '📋',
      rating: 4.7,
      tags: ['organization', 'notes', 'project-management']
    }
  ];

  // Categories
  const categories = [
    { id: 'all', name: 'All Resources', icon: '📚' },
    { id: 'productivity', name: 'Productivity Tools', icon: '⚡' },
    { id: 'study-techniques', name: 'Study Techniques', icon: '🎯' },
    { id: 'learning-platforms', name: 'Learning Platforms', icon: '🌐' },
    { id: 'memory-tools', name: 'Memory Tools', icon: '🧠' }
  ];

  // Filter resources
  const filteredResources = studyResources.filter(resource => {
    const matchesCategory = activeCategory === 'all' || resource.category === activeCategory;
    const matchesSearch = searchQuery === '' || 
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Toggle favorite
  const toggleFavorite = (resourceId) => {
    if (favoriteResources.includes(resourceId)) {
      setFavoriteResources(favoriteResources.filter(id => id !== resourceId));
    } else {
      setFavoriteResources([...favoriteResources, resourceId]);
    }
  };

  // Study tips
  const studyTips = [
    {
      id: 1,
      title: 'Use the 50/10 Rule',
      description: 'Study for 50 minutes, then take a 10-minute break',
      icon: '⏰'
    },
    {
      id: 2,
      title: 'Create a Study Schedule',
      description: 'Plan your study sessions in advance for better consistency',
      icon: '📅'
    },
    {
      id: 3,
      title: 'Find Your Peak Hours',
      description: 'Identify when you\'re most alert and schedule difficult tasks then',
      icon: '🌅'
    },
    {
      id: 4,
      title: 'Use Multiple Senses',
      description: 'Engage visual, auditory, and kinesthetic learning styles',
      icon: '👁️'
    },
    {
      id: 5,
      title: 'Teach Someone Else',
      description: 'Explaining concepts to others helps reinforce your understanding',
      icon: '👥'
    },
    {
      id: 6,
      title: 'Practice Retrieval',
      description: 'Test yourself regularly instead of just re-reading notes',
      icon: '🔄'
    }
  ];

  return (
    <div className="study-resources-page">
      <div className="resources-header">
        <h1>📚 Study Resources</h1>
        <p>Discover tools, techniques, and platforms to enhance your learning</p>
      </div>

      {/* Search and Filter */}
      <div className="resources-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search resources, tools, or techniques..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button className="search-btn">🔍</button>
        </div>

        <div className="category-filters">
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(category.id)}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Grid */}
      <div className="resources-section">
        <h2>Available Resources ({filteredResources.length})</h2>
        {filteredResources.length > 0 ? (
          <div className="resources-grid">
            {filteredResources.map(resource => (
              <div key={resource.id} className="resource-card">
                <div className="resource-header">
                  <div className="resource-icon">{resource.icon}</div>
                  <button 
                    className={`favorite-btn ${favoriteResources.includes(resource.id) ? 'active' : ''}`}
                    onClick={() => toggleFavorite(resource.id)}
                  >
                    {favoriteResources.includes(resource.id) ? '❤️' : '🤍'}
                  </button>
                </div>
                
                <div className="resource-content">
                  <h3>{resource.title}</h3>
                  <p>{resource.description}</p>
                  
                  <div className="resource-meta">
                    <div className="resource-type">
                      <span className={`type-badge ${resource.type}`}>
                        {resource.type}
                      </span>
                    </div>
                    <div className="resource-rating">
                      <span className="rating-stars">⭐</span>
                      <span className="rating-value">{resource.rating}</span>
                    </div>
                  </div>
                  
                  <div className="resource-tags">
                    {resource.tags.map(tag => (
                      <span key={tag} className="tag">#{tag}</span>
                    ))}
                  </div>
                </div>
                
                <div className="resource-actions">
                  <button className="action-btn primary">
                    {resource.type === 'guide' ? 'Read Guide' : 
                     resource.type === 'tool' ? 'Use Tool' : 
                     resource.type === 'app' ? 'Get App' : 'Visit Site'}
                  </button>
                  <button className="action-btn secondary">
                    Learn More
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-resources">
            <div className="no-resources-icon">🔍</div>
            <h3>No resources found</h3>
            <p>Try adjusting your search or category filter</p>
          </div>
        )}
      </div>

      {/* Study Tips */}
      <div className="study-tips-section">
        <h2>💡 Study Tips & Techniques</h2>
        <div className="tips-grid">
          {studyTips.map(tip => (
            <div key={tip.id} className="tip-card">
              <div className="tip-icon">{tip.icon}</div>
              <div className="tip-content">
                <h4>{tip.title}</h4>
                <p>{tip.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2>⚡ Quick Study Tools</h2>
        <div className="quick-actions-grid">
          <div className="quick-action-card">
            <div className="action-icon">🍅</div>
            <h3>Pomodoro Timer</h3>
            <p>Start a focused 25-minute study session</p>
            <button className="action-btn primary">Start Timer</button>
          </div>
          
          <div className="quick-action-card">
            <div className="action-icon">📝</div>
            <h3>Note Template</h3>
            <p>Download Cornell note-taking templates</p>
            <button className="action-btn primary">Download</button>
          </div>
          
          <div className="quick-action-card">
            <div className="action-icon">🎯</div>
            <h3>Study Planner</h3>
            <p>Create a personalized study schedule</p>
            <button className="action-btn primary">Create Plan</button>
          </div>
          
          <div className="quick-action-card">
            <div className="action-icon">📊</div>
            <h3>Progress Tracker</h3>
            <p>Track your learning goals and milestones</p>
            <button className="action-btn primary">Track Progress</button>
          </div>
        </div>
      </div>

      {/* Favorites Section */}
      {favoriteResources.length > 0 && (
        <div className="favorites-section">
          <h2>❤️ Your Favorite Resources</h2>
          <div className="favorites-list">
            {favoriteResources.map(resourceId => {
              const resource = studyResources.find(r => r.id === resourceId);
              return (
                <div key={resourceId} className="favorite-item">
                  <span className="favorite-icon">{resource.icon}</span>
                  <span className="favorite-title">{resource.title}</span>
                  <button className="favorite-remove" onClick={() => toggleFavorite(resourceId)}>
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyResources;