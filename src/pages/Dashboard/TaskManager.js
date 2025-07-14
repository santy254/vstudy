import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import api from '../../api';
import './TaskManager.css';

const TaskManager = () => {
  const { groupId: urlGroupId } = useParams();
  const [groups, setGroups] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [comments, setComments] = useState({});
  const [editTaskId, setEditTaskId] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);
  const [activeGroup, setActiveGroup] = useState(urlGroupId || null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await api.get('/auth/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };
    fetchUserProfile();
  }, []);

  useEffect(() => {
    const fetchGroupsAndUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const groupRes = await axios.get('http://localhost:3000/group/user-groups', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const groupData = groupRes.data.groups || groupRes.data;
        setGroups(groupData);

        const userRes = await axios.get('http://localhost:3000/user', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUsers(userRes.data.users || []);
      } catch (error) {
        console.error('Error fetching groups or users:', error);
      }
    };

    fetchGroupsAndUsers();
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!activeGroup) {
        setTasks([]);
        return;
      }
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await api.get(`/task/group/${activeGroup}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTasks(res.data.tasks || []);
        setIsGroupAdmin(res.data.isAdmin || false);
      } catch (err) {
        setError('Failed to load tasks');
        console.error('Error fetching tasks:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [activeGroup]);

  const handleGroupChange = (e) => {
    setActiveGroup(e.target.value);
    setError('');
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate('');
    setPriority('medium');
    setAssignedTo('');
    setEditTaskId(null);
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!activeGroup) return setError('Select a group first.');
    if (!title || !dueDate || !priority) return setError('All fields are required.');

    try {
      const taskData = {
        taskName: title,
        description,
        dueDate,
        priority,
        groupId: activeGroup,
        assignedTo,
      };

      const token = localStorage.getItem('token');
      let res;

      if (editTaskId) {
        res = await api.put(`/task/${editTaskId}`, taskData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTasks(tasks.map((task) => (task._id === editTaskId ? res.data.task : task)));
      } else {
        res = await api.post('/task', taskData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTasks([...tasks, res.data.task]);
      }

      resetForm();
      setError('');
    } catch (err) {
      console.error('Task save error:', err);
      setError('Failed to save task.');
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/task/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(tasks.filter((task) => task._id !== taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task.');
    }
  };

  const handleEdit = (task) => {
    setEditTaskId(task._id);
    setTitle(task.taskName);
    setDescription(task.description);
    setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().substring(0, 10) : '');
    setPriority(task.priority || 'medium');
    setAssignedTo(task.assignedTo || '');
  };

  const handleToggleCompletion = async (taskId) => {
    const original = [...tasks];
    const updated = tasks.map((t) =>
      t._id === taskId ? { ...t, status: t.status === 'completed' ? 'incomplete' : 'completed' } : t
    );
    setTasks(updated);
    try {
      await api.put(`/task/toggle/${taskId}`);
    } catch (err) {
      setTasks(original);
      setError('Failed to toggle task.');
    }
  };

  const handleAddComment = async (taskId) => {
    const commentText = comments[taskId]?.trim();
    if (!commentText) return setError('Comment cannot be empty.');

    try {
      const token = localStorage.getItem('token');
      const res = await api.post(
        `/task/comment/${taskId}`,
        { comment: commentText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updated = tasks.map((task) =>
        task._id === taskId ? { ...task, comments: [...task.comments, res.data.comment] } : task
      );
      setTasks(updated);
      setComments((prev) => ({ ...prev, [taskId]: '' }));
    } catch (err) {
      console.error('Add comment error:', err);
      setError('Failed to add comment.');
    }
  };

  const handleDeleteComment = async (taskId, commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/task/comment/${taskId}/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(tasks.map((task) =>
        task._id === taskId
          ? { ...task, comments: task.comments.filter(c => c._id !== commentId) }
          : task
      ));
    } catch (err) {
      console.error('Delete comment error:', err);
    }
  };

  const handleAssignUser = async (taskId) => {
    if (!selectedUserId) return alert("Select a user.");
    try {
      const token = localStorage.getItem("token");
      const res = await api.put(
        `/task/assign/${taskId}`,
        { userId: selectedUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(tasks.map((task) =>
        task._id === taskId
          ? { ...task, assignedTo: res.data.task.assignedTo }
          : task
      ));
      setSelectedUserId("");
      setSelectedTaskId(null);
    } catch (err) {
      console.error("Assign user error:", err);
      alert("Failed to assign user.");
    }
  };

  if (!user) return <p>Loading user data...</p>;

  return (
    <div className="task-manager">
      {/* The JSX rendering logic remains unchanged */}
      {/* You already have full JSX logic for form, task list, comments, etc. */}
      {/* Add your JSX from the previous code block */}
    </div>
  );
};

export default TaskManager;
