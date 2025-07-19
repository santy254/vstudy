import React, { useState, useEffect } from 'react';
import api from '../../api';
import './Calendar.css';

const Calendar = () => {
  const [tasks, setTasks] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'

  // Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const response = await api.get('/task');
        setTasks(response.data);
        setError('');
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError('Failed to load tasks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Calendar navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Helper functions for calendar rendering
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  // Format date for display
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', { 
      month: 'long', 
      year: 'numeric' 
    }).format(date);
  };

  // Check if a date has tasks
  const getTasksForDate = (date) => {
    const dateString = date.toISOString().split('T')[0];
    return tasks.filter(task => {
      const taskDate = new Date(task.dueDate).toISOString().split('T')[0];
      return taskDate === dateString;
    });
  };

  // Render calendar days
  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    const today = new Date();
    
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div key={`empty-${i}`} className="calendar-day empty"></div>
      );
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      const tasksForDay = getTasksForDate(date);
      const isToday = today.getDate() === day && 
                      today.getMonth() === month && 
                      today.getFullYear() === year;
      const isPast = date < new Date(today.setHours(0, 0, 0, 0));
      
      days.push(
        <div 
          key={day} 
          className={`calendar-day ${isToday ? 'today' : ''} ${isPast ? 'past' : ''}`}
          onClick={() => handleDayClick(date)}
        >
          <div className="day-header">
            <span className="day-number">{day}</span>
            {tasksForDay.length > 0 && (
              <span className="task-indicator">{tasksForDay.length}</span>
            )}
          </div>
          <div className="day-content">
            {tasksForDay.slice(0, 3).map(task => (
              <div 
                key={task._id} 
                className={`task-item priority-${task.priority} ${task.status === 'completed' ? 'completed' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTask(task);
                }}
              >
                <span className="task-title">{task.taskName || task.title}</span>
              </div>
            ))}
            {tasksForDay.length > 3 && (
              <div className="more-tasks">+{tasksForDay.length - 3} more</div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  // Handle day click
  const handleDayClick = (date) => {
    console.log('Day clicked:', date);
    // You can implement day view or task creation for this date
  };

  // Close task details modal
  const closeTaskDetails = () => {
    setSelectedTask(null);
  };

  return (
    <div className="calendar-page">
      <div className="calendar-header">
        <h1>📅 Task Calendar</h1>
        <p>Visualize your tasks and deadlines</p>
      </div>

      <div className="calendar-controls">
        <div className="calendar-navigation">
          <button onClick={goToPreviousMonth} className="nav-btn">
            &lt; Previous
          </button>
          <h2 className="current-month">{formatDate(currentDate)}</h2>
          <button onClick={goToNextMonth} className="nav-btn">
            Next &gt;
          </button>
        </div>
        <div className="view-controls">
          <button 
            className={`view-btn ${viewMode === 'month' ? 'active' : ''}`}
            onClick={() => setViewMode('month')}
          >
            Month
          </button>
          <button 
            className={`view-btn ${viewMode === 'week' ? 'active' : ''}`}
            onClick={() => setViewMode('week')}
          >
            Week
          </button>
          <button 
            className={`view-btn ${viewMode === 'day' ? 'active' : ''}`}
            onClick={() => setViewMode('day')}
          >
            Day
          </button>
          <button onClick={goToToday} className="today-btn">
            Today
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your calendar...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      ) : (
        <div className="calendar-container">
          <div className="calendar-weekdays">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>
          <div className="calendar-grid">
            {renderCalendarDays()}
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <div className="task-modal-overlay" onClick={closeTaskDetails}>
          <div className="task-modal" onClick={(e) => e.stopPropagation()}>
            <div className="task-modal-header">
              <h3>{selectedTask.taskName || selectedTask.title}</h3>
              <button className="close-btn" onClick={closeTaskDetails}>×</button>
            </div>
            <div className="task-modal-content">
              <div className="task-detail">
                <span className="detail-label">Status:</span>
                <span className={`detail-value status-${selectedTask.status}`}>
                  {selectedTask.status === 'completed' ? 'Completed' : 'Pending'}
                </span>
              </div>
              <div className="task-detail">
                <span className="detail-label">Due Date:</span>
                <span className="detail-value">
                  {new Date(selectedTask.dueDate).toLocaleDateString()}
                </span>
              </div>
              <div className="task-detail">
                <span className="detail-label">Priority:</span>
                <span className={`detail-value priority-${selectedTask.priority}`}>
                  {selectedTask.priority.charAt(0).toUpperCase() + selectedTask.priority.slice(1)}
                </span>
              </div>
              {selectedTask.description && (
                <div className="task-description">
                  <h4>Description:</h4>
                  <p>{selectedTask.description}</p>
                </div>
              )}
            </div>
            <div className="task-modal-actions">
              <button className="action-btn edit">
                Edit Task
              </button>
              <button 
                className={`action-btn ${selectedTask.status === 'completed' ? 'incomplete' : 'complete'}`}
              >
                {selectedTask.status === 'completed' ? 'Mark Incomplete' : 'Mark Complete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="calendar-legend">
        <h3>Legend</h3>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-color priority-high"></span>
            <span className="legend-label">High Priority</span>
          </div>
          <div className="legend-item">
            <span className="legend-color priority-medium"></span>
            <span className="legend-label">Medium Priority</span>
          </div>
          <div className="legend-item">
            <span className="legend-color priority-low"></span>
            <span className="legend-label">Low Priority</span>
          </div>
          <div className="legend-item">
            <span className="legend-color completed"></span>
            <span className="legend-label">Completed</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;