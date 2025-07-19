import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(true);

  // Load theme from user settings on app start
  useEffect(() => {
    const loadUserTheme = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await api.get('/settings/application');
          const userTheme = response.data.user?.application?.theme || 'light';
          setTheme(userTheme);
          console.log('Loaded user theme:', userTheme);
        }
      } catch (error) {
        console.error('Error loading user theme:', error);
        // Default to light theme if error
        setTheme('light');
      } finally {
        setLoading(false);
      }
    };

    loadUserTheme();
  }, []);

  // Apply theme to document body
  useEffect(() => {
    document.body.className = theme === 'dark' ? 'dark-theme' : 'light-theme';
    console.log('Applied theme to body:', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const updateTheme = (newTheme) => {
    setTheme(newTheme);
    console.log('Theme updated to:', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme, 
      updateTheme, 
      loading 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};