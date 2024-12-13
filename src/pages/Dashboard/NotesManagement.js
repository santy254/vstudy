import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api';
import './NotesManagement.css';

const NotesManagement = () => {
  const { groupId } = useParams();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(groupId || '');
  const [notes, setNotes] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [editNoteId, setEditNoteId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await api.get('/group/user-groups', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGroups(Array.isArray(res.data) ? res.data : []);
        if (!selectedGroup && res.data.length > 0) {
          setSelectedGroup(res.data[0]._id);  // Set the first group if none selected
        }
      } catch (err) {
        setError('Error fetching groups. Please try again.');
      }
    };
    fetchGroups();
  }, [selectedGroup]);

  useEffect(() => {
    if (!selectedGroup) return;
    const fetchNotes = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await api.get(`/note?groupId=${selectedGroup}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotes(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setError('Error fetching notes. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, [selectedGroup]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (editNoteId) {
        await api.put(`/note/${editNoteId}`, { title: newTitle, content: newContent, groupId: selectedGroup }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotes(notes.map(note => note._id === editNoteId ? { ...note, title: newTitle, content: newContent } : note));
        setEditNoteId(null);
      } else {
        const res = await api.post('/note', { title: newTitle, content: newContent, groupId: selectedGroup }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotes([...notes, res.data]);
      }
      setNewTitle('');
      setNewContent('');
    } catch (err) {
      setError('Error saving the note. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    setError('');
    const remainingNotes = notes.filter(note => note._id !== id);
    setNotes(remainingNotes); // Optimistic UI update
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/note/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      setNotes(notes); // Revert optimistic update if delete fails
      setError('Error deleting the note. Please try again.');
    }
  };

  const handleEdit = (note) => {
    setEditNoteId(note._id);
    setNewTitle(note.title);
    setNewContent(note.content);
  };

  const handleCancelEdit = () => {
    setEditNoteId(null);
    setNewTitle('');
    setNewContent('');
  };

  const handleDownload = (note) => {
    const element = document.createElement("a");
    const file = new Blob([note.content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${note.title}.txt`;
    document.body.appendChild(element);
    element.click();
  };

  return (
    <div className="notes-management">
      <h2>Notes Management</h2>

      {loading && <div className="loading">Loading notes...</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="group-selector">
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
        >
          <option value="">Select Group</option>
          {Array.isArray(groups) && groups.map((group) => (
            <option key={group._id} value={group._id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      <form onSubmit={handleSubmit} className="note-form">
        <input
          type="text"
          placeholder="Note Title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Note Content"
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          required
        ></textarea>
        <button type="submit" className="note-button">
          {editNoteId ? 'Update Note' : 'Add Note'}
        </button>
        {editNoteId && (
          <button type="button" className="cancel-button" onClick={handleCancelEdit}>
            Cancel
          </button>
        )}
      </form>

      <ul className="notes-list">
        {notes.map((note) => (
          <li key={note._id} className="note-item">
            <h3>{note.title}</h3>
            <p>{note.content}</p>
            <div className="note-actions">
              <button onClick={() => handleEdit(note)} className="edit-button">Edit</button>
              <button onClick={() => handleDelete(note._id)} className="delete-button">Delete</button>
              <button onClick={() => handleDownload(note)} className="download-button">Download</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NotesManagement;
