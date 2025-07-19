import React, { useState, useEffect } from "react";
import api from '../../api';
import { useLanguage } from '../../contexts/LanguageContext';
import NotificationHelper from '../../utils/notificationHelper';
import "./TaskManager.css";

const TaskManager = ({ onTaskAdded }) => {
  const { t } = useLanguage(); // Add language context
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("low");
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingTasks, setUpdatingTasks] = useState(new Set());
  const [completedTasksToday, setCompletedTasksToday] = useState(0);
  const [taskStats, setTaskStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    completionRate: 0
  });
  const [taskFilter, setTaskFilter] = useState('all');
  const [filteredTasks, setFilteredTasks] = useState([]);

  // Toggle task completion
  const toggleTaskCompletion = async (taskId, taskName) => {
    if (updatingTasks.has(taskId)) return; // Prevent double-clicking

    setUpdatingTasks(prev => new Set(prev).add(taskId));

    try {
      const response = await api.put(`/task/toggle/${taskId}`);
      const updatedTask = response.data;

      // Update local state
      setTasks(prev => 
        prev.map(task => 
          task._id === taskId ? updatedTask : task
        )
      );

      // Trigger notification and celebration if task was completed
      if (updatedTask.status === 'completed') {
        await NotificationHelper.onTaskCompleted(taskName, taskId);
        
        // Add celebration animation
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElement) {
          taskElement.classList.add('celebrating');
          setTimeout(() => {
            taskElement.classList.remove('celebrating');
          }, 800);
        }
        
        // Show completion message
        setError(''); // Clear any previous errors
        const successMessage = `🎉 Great job! "${taskName}" completed successfully!`;
        setError(successMessage);
        setTimeout(() => setError(''), 3000);
        
        // Play completion sound (optional)
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
          audio.volume = 0.3;
          audio.play().catch(() => {}); // Ignore errors if audio fails
        } catch (e) {
          // Ignore audio errors
        }
      } else {
        // Task marked as incomplete
        setError(''); // Clear any previous errors
        const message = `🔄 "${taskName}" marked as incomplete`;
        setError(message);
        setTimeout(() => setError(''), 2000);
      }

    } catch (error) {
      console.error('Error toggling task completion:', error);
      setError('Failed to update task status');
    } finally {
      setUpdatingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  // Fetch all tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await api.get("/task");
        const data = response.data;

        const tasksArray = Array.isArray(data) ? data : data.tasks || [];
        setTasks(tasksArray);
      } catch (error) {
        console.error("Failed to fetch tasks", error);
        setTasks([]); // fallback to empty array
      }
    };

    fetchTasks();
  }, []);

  // Calculate task statistics whenever tasks change
  useEffect(() => {
    const calculateStats = () => {
      const total = tasks.length;
      const completed = tasks.filter(task => task.status === 'completed').length;
      const pending = tasks.filter(task => task.status !== 'completed').length;
      
      // Calculate overdue tasks
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      const overdue = tasks.filter(task => 
        task.status !== 'completed' && new Date(task.dueDate) < today
      ).length;

      // Calculate completion rate
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Calculate tasks completed today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const completedToday = tasks.filter(task => 
        task.status === 'completed' && 
        task.updatedAt && 
        new Date(task.updatedAt) >= todayStart
      ).length;

      setTaskStats({
        total,
        completed,
        pending,
        overdue,
        completionRate
      });

      setCompletedTasksToday(completedToday);
    };

    calculateStats();
  }, [tasks]);

  // Filter tasks based on selected filter
  useEffect(() => {
    const filterTasks = () => {
      let filtered = [...tasks];
      
      switch (taskFilter) {
        case 'completed':
          filtered = tasks.filter(task => task.status === 'completed');
          break;
        case 'pending':
          filtered = tasks.filter(task => task.status !== 'completed');
          break;
        case 'overdue':
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          filtered = tasks.filter(task => 
            task.status !== 'completed' && new Date(task.dueDate) < today
          );
          break;
        case 'all':
        default:
          filtered = tasks;
          break;
      }
      
      // Sort tasks: overdue first, then by due date
      filtered.sort((a, b) => {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        
        const aOverdue = a.status !== 'completed' && new Date(a.dueDate) < today;
        const bOverdue = b.status !== 'completed' && new Date(b.dueDate) < today;
        
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;
        
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
      
      setFilteredTasks(filtered);
    };

    filterTasks();
  }, [tasks, taskFilter]);

  // Form validation
  const validateForm = () => {
    if (!title.trim()) {
      return t('taskTitleRequired') || "Task title is required";
    }
    if (!dueDate) {
      return t('dueDateRequired') || "Due date is required";
    }
    if (new Date(dueDate) < new Date().setHours(0, 0, 0, 0)) {
      return t('dueDatePastError') || "Due date cannot be in the past";
    }
    return null;
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError("");
    
    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      // Debug authentication
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      console.log('🔍 Debug Info:');
      console.log('Token exists:', !!token);
      console.log('Token length:', token ? token.length : 0);
      console.log('User data exists:', !!user);
      
      if (!token) {
        setError('❌ Authentication token missing. Please login again.');
        setIsSubmitting(false);
        // Redirect to login page
        setTimeout(() => {
          window.location.href = '/signin';
        }, 2000);
        return;
      }
      
      // Log the data being sent for debugging
      const taskData = {
        taskName: title.trim(),
        description: description.trim(),
        dueDate,
        priority,
      };
      
      console.log("Submitting task data:", taskData);
      console.log("API Base URL:", api.defaults.baseURL);

      const response = await api.post("/task", taskData);
      
      console.log("Task created successfully:", response.data);

      // Update tasks list
      const newTask = response.data;
      setTasks((prev) => [...prev, newTask]);
      
      // Trigger real-time notification
      await NotificationHelper.createTaskNotification(newTask.taskName || newTask.title, 'created');
      
      // Call parent callback if provided
      if (onTaskAdded) {
        onTaskAdded(newTask);
      }

      // Reset form
      setTitle("");
      setDescription("");
      setDueDate("");
      setPriority("low");
      
    } catch (error) {
      console.error("Error creating task:", error);
      
      // Better error handling
      let errorMessage = "Failed to create task";
      
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;
        
        if (data?.message) {
          errorMessage = data.message;
        } else if (data?.error) {
          errorMessage = data.error;
        } else {
          errorMessage = `Server error (${status}): ${error.response.statusText}`;
        }
        
        console.error("Server response:", JSON.stringify(data, null, 2));
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = "No response from server. Please check if the API is running.";
        console.error("No response received:", error.request);
      } else {
        // Something else happened
        errorMessage = `Request failed: ${error.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="task-manager">
      <h2>{t('taskManager')}</h2>



      {/* Enhanced Task Creation Form */}
      <div className="task-form-container">
        <div className="form-header">
          <h3>✨ {t('createNewTask') || 'Create New Task'}</h3>
          <p className="form-subtitle">Add a new task to your productivity journey</p>
        </div>
        
        {error && (
          <div className={`notification ${error.includes('🎉') ? 'success' : 'error'}`}>
            <div className="notification-content">
              <span className="notification-icon">
                {error.includes('🎉') ? '🎉' : '⚠️'}
              </span>
              <span className="notification-text">{error}</span>
            </div>
            <button 
              className="notification-close"
              onClick={() => setError('')}
            >
              ×
            </button>
          </div>
        )}
        
        <form className="task-form" onSubmit={handleTaskSubmit}>
          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="title" className="form-label">
                <span className="label-icon">📝</span>
                <span className="label-text">{t('taskTitle') || 'Task Title'} *</span>
              </label>
              <div className="input-wrapper">
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('enterTaskTitle') || 'Enter a clear, actionable task title...'}
                  required
                  disabled={isSubmitting}
                  className="form-input"
                  maxLength={100}
                />
                <div className="input-counter">{title.length}/100</div>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="description" className="form-label">
                <span className="label-icon">📄</span>
                <span className="label-text">{t('description') || 'Description'}</span>
                <span className="label-optional">(Optional)</span>
              </label>
              <div className="input-wrapper">
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('optionalDescription') || 'Add details, notes, or context for this task...'}
                  disabled={isSubmitting}
                  className="form-textarea"
                  rows={3}
                  maxLength={500}
                />
                <div className="input-counter">{description.length}/500</div>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dueDate" className="form-label">
                <span className="label-icon">📅</span>
                <span className="label-text">{t('dueDate') || 'Due Date'} *</span>
              </label>
              <div className="input-wrapper">
                <input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="form-input"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="priority" className="form-label">
                <span className="label-icon">🎯</span>
                <span className="label-text">{t('priority') || 'Priority'}</span>
              </label>
              <div className="input-wrapper">
                <select 
                  id="priority"
                  value={priority} 
                  onChange={(e) => setPriority(e.target.value)} 
                  required
                  disabled={isSubmitting}
                  className="form-select"
                >
                  <option value="low">🟢 {t('low') || 'Low'}</option>
                  <option value="medium">🟡 {t('medium') || 'Medium'}</option>
                  <option value="high">🔴 {t('high') || 'High'}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="clear-btn"
              onClick={() => {
                setTitle('');
                setDescription('');
                setDueDate('');
                setPriority('low');
                setError('');
              }}
              disabled={isSubmitting}
            >
              <span className="btn-icon">🗑️</span>
              <span className="btn-text">Clear</span>
            </button>
            
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isSubmitting || !title.trim() || !dueDate}
            >
              <span className="btn-icon">
                {isSubmitting ? '⏳' : '✨'}
              </span>
              <span className="btn-text">
                {isSubmitting ? (t('creating') || 'Creating...') : (t('createTask') || 'Create Task')}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Task Statistics Dashboard */}
      <div className="task-stats-dashboard">
        <h3>📊 Task Statistics</h3>
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-icon">📝</div>
            <div className="stat-content">
              <div className="stat-value">{taskStats.total}</div>
              <div className="stat-label">Total Tasks</div>
            </div>
          </div>
          
          <div className="stat-card completed">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-value">{taskStats.completed}</div>
              <div className="stat-label">Completed</div>
              <div className="stat-subtext">{completedTasksToday} today</div>
            </div>
          </div>
          
          <div className="stat-card pending">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <div className="stat-value">{taskStats.pending}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>
          
          <div className="stat-card overdue">
            <div className="stat-icon">🚨</div>
            <div className="stat-content">
              <div className="stat-value">{taskStats.overdue}</div>
              <div className="stat-label">Overdue</div>
              {taskStats.overdue > 0 && (
                <div className="stat-alert">Needs attention!</div>
              )}
            </div>
          </div>
          
          <div className="stat-card completion-rate">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <div className="stat-value">{taskStats.completionRate}%</div>
              <div className="stat-label">Completion Rate</div>
              <div className="stat-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${taskStats.completionRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="task-list">
        <div className="task-list-header">
          <h3>{t('tasks')} ({tasks.length})</h3>
          <div className="task-filters">
            <button 
              className={`filter-btn ${taskFilter === 'all' ? 'active' : ''}`} 
              onClick={() => setTaskFilter('all')}
            >
              All ({taskStats.total})
            </button>
            <button 
              className={`filter-btn ${taskFilter === 'pending' ? 'active' : ''}`} 
              onClick={() => setTaskFilter('pending')}
            >
              Pending ({taskStats.pending})
            </button>
            <button 
              className={`filter-btn ${taskFilter === 'completed' ? 'active' : ''}`} 
              onClick={() => setTaskFilter('completed')}
            >
              Completed ({taskStats.completed})
            </button>
            <button 
              className={`filter-btn ${taskFilter === 'overdue' ? 'active' : ''}`} 
              onClick={() => setTaskFilter('overdue')}
            >
              Overdue ({taskStats.overdue})
            </button>
          </div>
        </div>
        {filteredTasks.length === 0 ? (
          <p>{taskFilter === 'all' ? t('noTasks') : `No ${taskFilter} tasks`}</p>
        ) : (
          <ul>
            {filteredTasks.map((task) => {
              // Check if task is overdue
              const today = new Date();
              today.setHours(23, 59, 59, 999);
              const isOverdue = task.status !== 'completed' && new Date(task.dueDate) < today;
              
              return (
              <li key={task._id || task.id} className={`task-item ${task.status === 'completed' ? 'completed' : ''}`} data-task-id={task._id}>
                <div className="task-content">
                  <div className="task-header">
                    <h4>{task.taskName || task.title}</h4>
                    <div className="task-actions">
                      <button
                        className={`toggle-btn ${task.status === 'completed' ? 'completed' : 'incomplete'}`}
                        onClick={() => toggleTaskCompletion(task._id, task.taskName || task.title)}
                        disabled={updatingTasks.has(task._id)}
                        title={task.status === 'completed' ? 'Mark as incomplete' : 'Mark as complete'}
                      >
                        {updatingTasks.has(task._id) ? '⏳' : (task.status === 'completed' ? '✅' : '⭕')}
                      </button>
                    </div>
                  </div>
                  {task.description && <p className="task-description">{task.description}</p>}
                  <div className="task-meta">
                    <span className="due-date">
                      📅 {t('due')}: {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                    <span className={`priority priority-${task.priority}`}>
                      🎯 {t('priority')}: {t(task.priority)}
                    </span>
                    <span className={`status status-${task.status}`}>
                      {task.status === 'completed' ? '✅ Completed' : '⏳ Pending'}
                    </span>
                    {isOverdue && (
                      <span className="overdue-badge">🚨 Overdue</span>
                    )}
                  </div>
                </div>
              </li>
            );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TaskManager;