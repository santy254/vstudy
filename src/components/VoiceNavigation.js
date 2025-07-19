import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import './VoiceNavigation.css';

const VoiceNavigation = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [lastCommand, setLastCommand] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('unknown'); // 'granted', 'denied', 'prompt', 'unknown'
  const [showPermissionHelp, setShowPermissionHelp] = useState(false);
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);

  // Voice commands mapping
  const voiceCommands = {
    // Navigation commands
    'overview': '/dashboard/overview',
    'dashboard': '/dashboard/overview',
    'home': '/dashboard/overview',
    'groups': '/dashboard/group-management',
    'group management': '/dashboard/group-management',
    'tasks': '/dashboard/task-manager',
    'task manager': '/dashboard/task-manager',
    'chat': '/dashboard/group-chat-page',
    'messages': '/dashboard/group-chat-page',
    'profile': '/dashboard/profile',
    'settings': '/dashboard/settings',
    'report': '/dashboard/project-report',
    'project report': '/dashboard/project-report',
    
    // Action commands
    'go to overview': '/dashboard/overview',
    'go to dashboard': '/dashboard/overview',
    'go to groups': '/dashboard/group-management',
    'go to tasks': '/dashboard/task-manager',
    'go to chat': '/dashboard/group-chat-page',
    'go to profile': '/dashboard/profile',
    'go to settings': '/dashboard/settings',
    'go to report': '/dashboard/project-report',
    'open overview': '/dashboard/overview',
    'open dashboard': '/dashboard/overview',
    'open groups': '/dashboard/group-management',
    'open tasks': '/dashboard/task-manager',
    'open chat': '/dashboard/group-chat-page',
    'open profile': '/dashboard/profile',
    'open settings': '/dashboard/settings',
    'open report': '/dashboard/project-report',
    'show overview': '/dashboard/overview',
    'show dashboard': '/dashboard/overview',
    'show groups': '/dashboard/group-management',
    'show tasks': '/dashboard/task-manager',
    'show chat': '/dashboard/group-chat-page',
    'show profile': '/dashboard/profile',
    'show settings': '/dashboard/settings',
    'show report': '/dashboard/project-report',
    
    // Special commands
    'help': 'help',
    'voice help': 'help',
    'what can i say': 'help',
    'commands': 'help',
    'stop listening': 'stop',
    'stop': 'stop',
    'cancel': 'stop'
  };

  useEffect(() => {
    // Check if speech recognition is supported
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      checkMicrophonePermission();
      initializeSpeechRecognition();
    } else {
      setIsSupported(false);
      console.warn('Speech recognition not supported in this browser');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      // Check if Permissions API is supported
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'microphone' });
        setPermissionStatus(permission.state);
        
        // Listen for permission changes
        permission.onchange = () => {
          setPermissionStatus(permission.state);
        };
      } else {
        // Fallback: try to access microphone directly
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setPermissionStatus('granted');
          // Stop the stream immediately as we only needed to check permission
          stream.getTracks().forEach(track => track.stop());
        } catch (error) {
          if (error.name === 'NotAllowedError') {
            setPermissionStatus('denied');
          } else {
            setPermissionStatus('prompt');
          }
        }
      }
    } catch (error) {
      console.error('Error checking microphone permission:', error);
      setPermissionStatus('unknown');
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionStatus('granted');
      setShowPermissionHelp(false);
      showFeedbackMessage('Microphone permission granted! You can now use voice navigation.', 'success');
      // Stop the stream immediately
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setPermissionStatus('denied');
      showFeedbackMessage('Microphone permission denied. Please enable it in your browser settings.', 'error');
      setShowPermissionHelp(true);
    }
  };

  const initializeSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      setConfidence(0);
      playSound('start');
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;

        if (event.results[i].isFinal) {
          finalTranscript += transcript;
          setConfidence(confidence);
        } else {
          interimTranscript += transcript;
        }
      }

      const currentTranscript = finalTranscript || interimTranscript;
      setTranscript(currentTranscript);

      if (finalTranscript) {
        processVoiceCommand(finalTranscript.toLowerCase().trim());
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      // Handle different error types
      switch (event.error) {
        case 'not-allowed':
          setPermissionStatus('denied');
          showFeedbackMessage('Microphone access denied. Click the permission button to enable it.', 'error');
          setShowPermissionHelp(true);
          break;
        case 'no-speech':
          showFeedbackMessage('No speech detected. Please try again.', 'info');
          break;
        case 'audio-capture':
          showFeedbackMessage('No microphone found. Please check your audio devices.', 'error');
          break;
        case 'network':
          showFeedbackMessage('Network error. Please check your internet connection.', 'error');
          break;
        default:
          showFeedbackMessage(`Voice recognition error: ${event.error}`, 'error');
      }
      playSound('error');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  };

  const processVoiceCommand = (command) => {
    setLastCommand(command);
    
    // Find matching command
    const matchedRoute = voiceCommands[command];
    
    if (matchedRoute) {
      if (matchedRoute === 'help') {
        showHelpCommands();
        playSound('success');
      } else if (matchedRoute === 'stop') {
        stopListening();
        showFeedbackMessage('Voice navigation stopped', 'info');
        playSound('stop');
      } else {
        // Navigate to the matched route
        navigate(matchedRoute);
        showFeedbackMessage(`Navigating to ${getPageName(matchedRoute)}`, 'success');
        playSound('success');
      }
    } else {
      // Try partial matching
      const partialMatch = findPartialMatch(command);
      if (partialMatch) {
        navigate(partialMatch);
        showFeedbackMessage(`Navigating to ${getPageName(partialMatch)}`, 'success');
        playSound('success');
      } else {
        showFeedbackMessage(`Command "${command}" not recognized. Say "help" for available commands.`, 'error');
        playSound('error');
      }
    }
  };

  const findPartialMatch = (command) => {
    // Check if command contains key words
    const keywords = {
      'overview': '/dashboard/overview',
      'dashboard': '/dashboard/overview',
      'group': '/dashboard/group-management',
      'task': '/dashboard/task-manager',
      'chat': '/dashboard/group-chat-page',
      'message': '/dashboard/group-chat-page',
      'profile': '/dashboard/profile',
      'setting': '/dashboard/settings',
      'report': '/dashboard/project-report'
    };

    for (const [keyword, route] of Object.entries(keywords)) {
      if (command.includes(keyword)) {
        return route;
      }
    }
    return null;
  };

  const getPageName = (route) => {
    const pageNames = {
      '/dashboard/overview': 'Overview',
      '/dashboard/group-management': 'Group Management',
      '/dashboard/task-manager': 'Task Manager',
      '/dashboard/group-chat-page': 'Chat',
      '/dashboard/profile': 'Profile',
      '/dashboard/settings': 'Settings',
      '/dashboard/project-report': 'Project Report'
    };
    return pageNames[route] || 'Unknown Page';
  };

  const showHelpCommands = () => {
    const helpText = `
Available voice commands:
• "Go to Overview" or "Dashboard"
• "Go to Groups" or "Group Management"
• "Go to Tasks" or "Task Manager"
• "Go to Chat" or "Messages"
• "Go to Profile"
• "Go to Settings"
• "Go to Report" or "Project Report"
• "Help" - Show this help
• "Stop" - Stop voice navigation
    `;
    showFeedbackMessage(helpText, 'info');
  };

  const showFeedbackMessage = (message, type) => {
    setShowFeedback({ message, type });
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setShowFeedback(false);
    }, 4000);
  };

  const playSound = (type) => {
    // Create audio feedback for different actions
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    const frequencies = {
      start: 800,
      success: 1000,
      error: 400,
      stop: 600
    };

    oscillator.frequency.setValueAtTime(frequencies[type] || 800, audioContext.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  };

  const startListening = () => {
    if (recognitionRef.current && isSupported) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        showFeedbackMessage('Error starting voice recognition', 'error');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setTranscript('');
  };

  if (!isSupported) {
    return (
      <div className="voice-nav-unsupported">
        <span>🎤</span>
        <span className="tooltip">Voice navigation not supported in this browser</span>
      </div>
    );
  }

  return (
    <div className="voice-navigation">
      <button
        className={`voice-btn ${isListening ? 'listening' : ''}`}
        onClick={isListening ? stopListening : startListening}
        title={isListening ? 'Stop voice navigation' : 'Start voice navigation'}
      >
        <span className="voice-icon">
          {isListening ? '🔴' : '🎤'}
        </span>
        {isListening && <div className="pulse-ring"></div>}
      </button>

      {isListening && (
        <div className="voice-status">
          <div className="listening-indicator">
            <div className="sound-wave">
              <div className="wave"></div>
              <div className="wave"></div>
              <div className="wave"></div>
            </div>
            <span>Listening...</span>
          </div>
          {transcript && (
            <div className="transcript">
              <span>"{transcript}"</span>
              {confidence > 0 && (
                <span className="confidence">
                  {Math.round(confidence * 100)}% confident
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {showFeedback && (
        <div className={`voice-feedback ${showFeedback.type}`}>
          <div className="feedback-content">
            <span className="feedback-icon">
              {showFeedback.type === 'success' && '✅'}
              {showFeedback.type === 'error' && '❌'}
              {showFeedback.type === 'info' && 'ℹ️'}
            </span>
            <span className="feedback-message">{showFeedback.message}</span>
          </div>
        </div>
      )}

      {lastCommand && !isListening && (
        <div className="last-command">
          Last command: "{lastCommand}"
        </div>
      )}

      {/* Permission Help Panel */}
      {(permissionStatus === 'denied' || showPermissionHelp) && (
        <div className="permission-help">
          <div className="permission-content">
            <div className="permission-header">
              <span className="permission-icon">🎤</span>
              <h3>Microphone Permission Required</h3>
            </div>
            <p>Voice navigation needs microphone access to work. Please follow these steps:</p>
            
            <div className="permission-steps">
              <div className="step">
                <span className="step-number">1</span>
                <div className="step-content">
                  <strong>Click the microphone icon</strong> in your browser's address bar
                </div>
              </div>
              <div className="step">
                <span className="step-number">2</span>
                <div className="step-content">
                  <strong>Select "Allow"</strong> to grant microphone permission
                </div>
              </div>
              <div className="step">
                <span className="step-number">3</span>
                <div className="step-content">
                  <strong>Refresh the page</strong> if needed
                </div>
              </div>
            </div>

            <div className="permission-actions">
              <button 
                className="permission-btn primary"
                onClick={requestMicrophonePermission}
              >
                🎤 Request Permission
              </button>
              <button 
                className="permission-btn secondary"
                onClick={() => setShowPermissionHelp(false)}
              >
                ✕ Close
              </button>
            </div>

            <div className="browser-help">
              <details>
                <summary>Browser-specific instructions</summary>
                <div className="browser-instructions">
                  <div className="browser-item">
                    <strong>Chrome:</strong> Click the microphone icon in the address bar, then "Allow"
                  </div>
                  <div className="browser-item">
                    <strong>Firefox:</strong> Click "Allow" when prompted, or check the shield icon
                  </div>
                  <div className="browser-item">
                    <strong>Safari:</strong> Go to Safari → Settings → Websites → Microphone
                  </div>
                  <div className="browser-item">
                    <strong>Edge:</strong> Click the microphone icon in the address bar, then "Allow"
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>
      )}

      {/* Permission Status Indicator */}
      {permissionStatus === 'denied' && (
        <div className="permission-status denied">
          <span className="status-icon">🚫</span>
          <span className="status-text">Microphone Blocked</span>
        </div>
      )}
    </div>
  );
};

export default VoiceNavigation;