
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactPlayer from 'react-player';
import io from 'socket.io-client';
import api from '../../api'; // Import your axios instance
import './Youtube.css';

const YouTube = ({ userName }) => {
  const [groups, setGroups] = useState([]); 
  const [selectedGroup, setSelectedGroup] = useState(null); // Selected group ID
  const [url, setUrl] = useState(''); // Video URL to play
  const [title, setTitle] = useState(''); // Video title
  const [playing, setPlaying] = useState(false); // Playback state
  const [messages, setMessages] = useState([]); // Chat messages
  const [message, setMessage] = useState(''); // Input message
  const [videos, setVideos] = useState([]); // Videos list for the selected group
  const chatEndRef = useRef(null); // Reference for auto-scrolling chat
  const socketRef = useRef(); // Socket reference

    // Fetch group videos
    const fetchGroupVideoData = useCallback(async () => {
      if (!selectedGroup) return;
  
      try {
        const response = await api.get(`/videos/${selectedGroup}`);
        setVideos(response.data || []);
        if (response.data?.length > 0) {
          const latestVideo = response.data[0];
          setUrl(latestVideo.videoUrl);
          setTitle(latestVideo.videoTitle);
        } else {
          setUrl('');
          setTitle('');
        }
      } catch (error) {
        console.error('Error fetching video data:', error.message);
      }
    }, [selectedGroup]);
  
    // Fetch groups on mount
    useEffect(() => {
      const fetchGroups = async () => {
        try {
          const response = await api.get('/group/user-groups');
          setGroups(response.data || []);
          if (response.data?.length > 0) {
            setSelectedGroup(response.data[0]?.id);
          }
        } catch (error) {
          console.error('Error fetching groups:', error.message);
        }
      };
  
      fetchGroups();
  
      socketRef.current = io.connect('http://localhost:5000');
  
      return () => {
        socketRef.current.disconnect();
      };
    }, []);
  
    // Fetch videos when group changes
    useEffect(() => {
      if (selectedGroup) {
        fetchGroupVideoData();
        socketRef.current.emit('joinRoom', { youtubeId: selectedGroup, userName });
        setMessages([]);
      }
    }, [selectedGroup, fetchGroupVideoData, userName]);
  
    // Socket events
    useEffect(() => {
      if (!socketRef.current) return;
  
      socketRef.current.on('updateUrl', ({ newUrl, newTitle }) => {
        setUrl(newUrl);
        setTitle(newTitle);
      });
  
      socketRef.current.on('playbackUpdate', ({ playingState }) => {
        setPlaying(playingState);
      });
  
      socketRef.current.on('receiveMessage', ({ userName, message }) => {
        setMessages((prev) => [...prev, { userName, message }]);
      });
  
      return () => {
        socketRef.current.off('updateUrl');
        socketRef.current.off('playbackUpdate');
        socketRef.current.off('receiveMessage');
      };
    }, []);
  
    // Auto-scroll chat
    useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
  
    // Handle group change
    const handleGroupChange = (e) => {
      setSelectedGroup(e.target.value);
    };
  
    // Handle play/pause
    const handlePlayPause = () => {
      const newPlayingState = !playing;
      setPlaying(newPlayingState);
      socketRef.current.emit('playbackUpdate', { youtubeId: selectedGroup, playingState: newPlayingState });
    };
  
    // Handle URL change
    const handleUrlChange = async (e) => {
      const newUrl = e.target.value;
      setUrl(newUrl);
  
      try {
        const response = await fetch(`https://noembed.com/embed?url=${newUrl}`);
        const data = await response.json();
        const newTitle = data.title || 'New Video';
  
        setTitle(newTitle);
  
        socketRef.current.emit('updateUrl', { youtubeId: selectedGroup, newUrl, newTitle });
  
        await api.post('/videos', {
          groupId: selectedGroup,
          sharedBy: userName,
          videoTitle: newTitle,
          videoUrl: newUrl,
        });
  
        fetchGroupVideoData();
      } catch (error) {
        console.error('Error saving video data:', error.message);
      }
    };

  // Handle sending chat messages
  const handleSendMessage = () => {
    if (message.trim()) {
      socketRef.current.emit('sendMessage', { youtubeId: selectedGroup, userName, message });
      setMessages((prev) => [...prev, { userName: 'You', message }]);
      setMessage('');
    }
  };

  // Handle deleting a video
  const handleDeleteVideo = async (videoId) => {
    try {
      await api.delete(`/videos/${videoId}`);
      setVideos((prevVideos) => prevVideos.filter((video) => video._id !== videoId));
    } catch (error) {
      console.error('Error deleting video:', error.message);
    }
  };

  useEffect(() => {
    if (!socketRef.current) return;

    socketRef.current.on('videoDeleted', ({ videoId }) => {
      setVideos((prevVideos) => prevVideos.filter((video) => video._id !== videoId));
    });

    return () => {
      socketRef.current.off('videoDeleted');
    };
  }, []);

  // Auto-scroll chat to the latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="youtube-container">
      <div className="group-dropdown">
        <label htmlFor="group-select">Select Group: </label>
        <select
          id="group-select"
          value={selectedGroup || ''} // Default to empty if no group selected
          onChange={handleGroupChange}
        >
          {Array.isArray(groups) && groups.length > 0 ? (
            groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))
          ) : (
            <option>No groups available</option>
          )}
        </select>
      </div>

      <div className="player-wrapper">
        {title && <h3>{title}</h3>}
        <ReactPlayer
          className="react-player"
          url={url}
          playing={playing}
          controls
          width="100%"
          height="100%"
        />
      </div>

      <div className="url-input">
        <input
          type="text"
          placeholder="Enter YouTube URL..."
          value={url}
          onChange={handleUrlChange}
        />
        <button onClick={handlePlayPause}>{playing ? 'Pause' : 'Play'}</button>
      </div>

      <div className="video-list">
        <h4>Videos</h4>
        {videos.length > 0 ? (
          videos.map((video) => (
            <div key={video._id} className="video-item">
              <h5>{video.videoTitle}</h5>
              <button onClick={() => handleDeleteVideo(video._id)}>Delete</button>
            </div>
          ))
        ) : (
          <p>No videos found.</p>
        )}
      </div>

      <div className="chat-container">
        <h4>Chat</h4>
        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div key={index} className="chat-message">
              <strong>{msg.userName}: </strong> {msg.message}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
};

export default YouTube;
