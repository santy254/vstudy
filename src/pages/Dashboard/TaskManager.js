import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  const [comments, setComments] = useState('');
  const [editTaskId, setEditTaskId] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState('null');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);
  const [activeGroup, setActiveGroup] = useState(urlGroupId || null);

  // Fetch user profile on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token'); // Assume token is stored after login
        const res = await api.get('/auth/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Set user data
        setUser(res.data); // Assuming res.data contains user object with id, name, and email
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };

    fetchUserProfile();
  }, []);
  // Fetch groups on mount
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await api.get('/group/user-groups', { headers: { Authorization: `Bearer ${token}` } });
        setGroups(res.data.groups || []);
        if (!urlGroupId && res.data.groups.length > 0) {
          setActiveGroup(res.data.groups[0]._id);
        }
      } catch (err) {
        setError('Failed to fetch groups');
        console.error('Error fetching groups:', err);
      }
    };
    fetchGroups();
  }, [urlGroupId]);

  // Fetch users for the active group
  useEffect(() => {
    const fetchUsers = async () => {
      if (!activeGroup) return;
      try {
        const token = localStorage.getItem('token');
        const res = await api.get(`/auth/group-users/${activeGroup}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data.users || []);
      } catch (err) {
        console.error('Error fetching group users:', err);
      }
    };
    fetchUsers();
  }, [activeGroup]);

  // Fetch tasks for the selected group
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

  const handleTaskSubmit = async (e) => {
    e.preventDefault();

    if (!activeGroup) {
      setError('Please select a group to add a task.');
      return;
    }

    if (!title || !dueDate || !priority) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      const newTask = { taskName: title, description, dueDate, priority, groupId: activeGroup, assignedTo };
      let res;
      if (editTaskId) {
        res = await api.put(`/task/${editTaskId}`, newTask);
        setTasks(tasks.map((task) => (task._id === editTaskId ? res.data.task : task)));
        setEditTaskId(null);
      } else {
        res = await api.post('/task', newTask);
        setTasks([...tasks, res.data.task]);
      }
      resetForm();
      setError('');
    } catch (err) {
      setError('Failed to save task');
      console.error('Error saving task:', err);
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await api.delete(`/task/${taskId}`);
      setTasks(tasks.filter((task) => task._id !== taskId));
    } catch (err) {
      setError('Failed to delete task');
      console.error('Error deleting task:', err);
    }
  };

  const handleToggleCompletion = async (taskId) => {
    // Optimistically update the UI
    const originalTasks = [...tasks];
    const updatedTasks = tasks.map((task) =>
      task._id === taskId ? { ...task, status: task.status === 'completed' ? 'incomplete' : 'completed' } : task
    );
    setTasks(updatedTasks);
  
    try {
      // Send the updated status to the backend
      await api.put(`/task/toggle/${taskId}`);
      // If the request was successful, the task status has already been updated optimistically.
    } catch (err) {
      // Revert to original state if the update fails
      setTasks(originalTasks);
      setError('Failed to update task status');
      console.error('Error updating task status:', err);
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
  const handleAddComment = async (taskId) => {
    if (!comments.trim()) {
      setError('Comment cannot be empty');
      return;
    }
  
    try {
      const token = localStorage.getItem('token');
      const res = await api.post(
        `/task/comment/${taskId}`,
        { comment: comments }, // Ensure this matches the backend schema
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      const updatedTasks = tasks.map((task) =>
        task._id === taskId
          ? { ...task, comments: [...task.comments, res.data.comment] } // Update the comment list
          : task
      );
  
      setTasks(updatedTasks); // Update the tasks state
      setComments(''); // Clear the input
    } catch (err) {
      setError('Failed to add comment');
      console.error('Error adding comment:', err);
    }
  };
  if (!user) {
    return <p>Loading user data...</p>; // Show loader while user data is being fetched
  }
  const handleDeleteComment = async (taskId, commentId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.delete(
        `/task/comment/${taskId}/${commentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("deleted successful:", res.data);

      // Update the task's comments by removing the deleted comment
      const updatedTasks = tasks.map((task) =>
        task._id === taskId
          ? { ...task, comments: task.comments.filter(comment => comment._id !== commentId) }
          : task
      );
      setTasks(updatedTasks); // Update the tasks state
  
      alert('You sure you want to delete the comment');
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert('Failed to delete comment');
    }
  };
  
  const handleAssignUser = async (selectedTaskId) => {
    // Ensure a task and user are selected
    if (!selectedTaskId || !selectedUserId) {
      alert("Please select a task and user.");
      return;
    }
  
    // Log taskId and userId for debugging
    console.log("Assigning Task ID:", selectedTaskId);
    console.log("Assigning User ID:", selectedUserId);
  
    try {
      const token = localStorage.getItem("token");
  
      // Call the backend API to assign the user to the task
      const res = await api.put(
        `/task/assign/${selectedTaskId}`,
        { userId: selectedUserId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      console.log("Assignment successful:", res.data);
  
      // Update the task in the local state
      const updatedTasks = tasks.map((task) =>
        task._id === selectedTaskId
          ? { ...task, assignedTo: res.data.task.assignedTo } // Update assignedTo field
          : task
      );
      setTasks(updatedTasks);
  
      // Reset the selected user and task
      setSelectedUserId("");
      setSelectedTaskId(null); // Close the assign form
    } catch (err) {
      console.error("Error assigning user:", err.response?.data || err.message);
      alert("Failed to assign user. Check console for more details.");
    }
  };
  
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate('');
    setPriority('medium');
    setAssignedTo('');
  };

  const handleCancelEdit = () => {
    resetForm();
    setEditTaskId(null);
  };

  return (
    <div className="task-manager">
 
 <div className="group-selector">
      <label For="group-select">Select a Group:</label>
      <select
        id="group-select"
        onChange={handleGroupChange}
        value={activeGroup || ""}
      >
        <option value="">-- Select Group --</option>
        {groups.map((group) => (
          <option key={group._id} value={group._id}>
            {group.name}
          </option>
        ))}
      </select>
    
    </div>
      {loading ? (
        <p>Loading...</p>
      ) : activeGroup ? (
        <>
          {/* Task Form */}
          <form onSubmit={handleTaskSubmit}>
            <input
              type="text"
              placeholder="Task Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <textarea
              placeholder="Task Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <button type="submit">{editTaskId ? 'Update Task' : 'Create Task'}</button>
            {editTaskId && <button onClick={handleCancelEdit}>Cancel</button>}
          </form>
  
          {/* Task List */}
          <ul className="task-list">
            {tasks.map((task) => (
              <li key={task._id} className={`task-item ${task.status === 'completed' ? 'completed' : ''}`}>
                <h3>{task.taskName}</h3>
                <p>{task.description}</p>
                <p>Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                <p>Priority: {task.priority}</p>
                <p>
  Assigned to:{" "}
  {task.assignedTo && task.assignedTo.length > 0
    ? task.assignedTo[0].name
    : "Unassigned"}
</p>
  {/* Task Comments Section */}
<div className="task-comments">
  <h4>Comments:</h4>

  {/* Comments List */}
  {task.comments && task.comments.length > 0 ? (
    <ul>
      {task.comments.map((comment) => {
        
        const commentUser = users.find((user) => user.userId === comment.userId);
        const isCommentOwner = comment.userId === user._id; // Check if the current user is the owner of the comment

        return (
          <li key={comment._id}>
            <p><strong>User:</strong> {commentUser ? commentUser.name : 'Unknown User'}</p>
            <p><strong>Comment:</strong> {comment.comment}</p>
            <p><strong>Date:</strong> {new Date(comment.date || Date.now()).toLocaleDateString()}</p>
            {/* Delete button (only visible to the comment owner) */}
            {isCommentOwner && (
              <button onClick={() => handleDeleteComment(task._id, comment._id)}>
                Delete
              </button>
            )}
          </li>
        );
      })}
    </ul>
  ) : (
    <p>No comments yet.</p>
  )}

  {/* Add Comment Section */}
  <textarea
    value={comments}
    onChange={(e) => setComments(e.target.value)}
    placeholder="Add a comment"
  />
  <button onClick={() => handleAddComment(task._id)}>Add Comment</button>
  {error && <p className="error">{error}</p>}
</div>

  
                {/* Task Assignment */}
                {isGroupAdmin && (
                  <div>
                    <button
                      onClick={() =>
                        setSelectedTaskId(selectedTaskId === task._id ? null : task._id)
                      }
                    >
                      {selectedTaskId === task._id ? 'Hide Assign Form' : 'Assign User'}
                    </button>
                    {selectedTaskId === task._id && (
                      <div className="assign-user-form">
                        <h4>Assign User</h4>
                        <select
                          value={selectedUserId}
                          onChange={(e) => setSelectedUserId(e.target.value)}
                        >
                          <option value="">Select a user</option>
                          {users.map((user) => (
                            <option key={user.userId} value={user.userId}>
                              {user.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            handleAssignUser(task._id);
                            setSelectedTaskId(null); // Close form after assignment
                          }}
                        >
                          Assign
                        </button>
                      </div>
                    )}
                  </div>
                )}
  
                {/* Task Actions */}
                <div className="task-actions">
                  {isGroupAdmin && (
                    <>
                    <button onClick={() => handleToggleCompletion(task._id)}>
                    Mark as {task.status === 'completed' ? 'Incomplete' : 'Completed'}
                  </button>
                      <button onClick={() => handleEdit(task)}>Edit</button>
                      <button onClick={() => handleDelete(task._id)}>Delete</button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>Please select a group to view tasks.</p>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
  
};

export default TaskManager;