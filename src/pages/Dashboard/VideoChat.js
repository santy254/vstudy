import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import Peer from 'simple-peer';
import io from 'socket.io-client';
import {
  FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaSync, FaDesktop,
  FaRegPaperPlane, FaPhone, FaPhoneSlash, FaUsers, FaCommentDots,
} from 'react-icons/fa';
import api from '../../api';
import './VideoChat.css';

const VideoChat = ({ groupId }) => {
  const currentUser = useSelector((state) => state.user.currentUser);
  const [inCall, setInCall] = useState(false);
  const [sessionId, setSessionId] = useState(null);
 
  const [peers, setPeers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [participants, setParticipants] = useState([]);

  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [showParticipants, setShowParticipants] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const socketRef = useRef();
  const userVideo = useRef();
  const peersRef = useRef([]);
  // Initialize socket connection
  const initializeSocket = useCallback((sessionId, isInitiator) => {
    socketRef.current = io.connect('http://localhost:5000');

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((mediaStream) => {
        setStream(mediaStream);
        userVideo.current.srcObject = mediaStream;

        const event = isInitiator ? 'startCall' : 'joinCall';
        socketRef.current.emit(event, {
          roomId: sessionId,
          userId: currentUser,
        });

        socketRef.current.on('allUsers', (users) => {
          const peers = users.map((userId) => createPeer(userId, socketRef.current.id, mediaStream));
          setPeers(peers);
        });

        socketRef.current.on('userJoined', ({ signal, callerID }) => {
          const peer = addPeer(signal, callerID, mediaStream);
          peersRef.current.push({ peerID: callerID, peer });
          setPeers((prev) => [...prev, peer]);
        });

        socketRef.current.on('receivingReturnedSignal', ({ id, signal }) => {
          const item = peersRef.current.find((p) => p.peerID === id);
          if (item) item.peer.signal(signal);
        });

        socketRef.current.on('updateParticipants', (updatedParticipants) => {
          setParticipants(updatedParticipants); // Ensure participants are updated
        });

        socketRef.current.on('receiveMessage', (msg) => setMessages((prev) => [...prev, msg]));
      })
      .catch((err) => console.error('Error accessing media devices:', err));
  }, [currentUser]);

  // Start a new call
  const startCall = async () => {
    try {
      const { data } = await api.post('/videosession/start', { groupId, hostUserId: currentUser });
      setInCall(true);
      setSessionId(data.sessionId);
      setParticipants([]);
      initializeSocket(data.sessionId, true); // Initiator
    } catch (error) {
      if (error.response?.status === 409) {
        alert('There is already an ongoing session for this group.');
      } else {
        console.error('Failed to start video session:', error);
      }
    }
  };

  // Join an existing call
  const joinCall = useCallback(async () => {
    try {
      const { data } = await api.get(`/videosession/get-session?groupId=${groupId}`);
      if (data.sessionId) {
        setInCall(true);
        setSessionId(data.sessionId);
        setParticipants([]);
        initializeSocket(data.sessionId, false); // Non-initiator
      } else {
        console.error('No active session found for this group.');
      }
    } catch (error) {
      console.error('Failed to join video session:', error);
    }
  }, [groupId, initializeSocket]);

  useEffect(() => {
    if (sessionId) {
      api.get(`/videosession/participants/${sessionId}`)
        .then((response) => {
          if (response.data.success) {
            setParticipants(response.data.participants || []);
          } else {
            setError(response.data.message || 'Failed to fetch participants.');
          }
        })
        .catch((error) => console.error('Error fetching participants:', error));
    }
  }, [sessionId]);

  const endCall = async () => {
    try {
      if (!sessionId) return;
  
      // Notify the server to end the session
      await api.post('/videosession/end', { sessionId });
  
      // Reset states
      setInCall(false);
      setSessionId(null);
      setParticipants([]);
      setMessages([]);
      
      // Notify other users in the room
      if (socketRef.current) {
        socketRef.current.emit('endCall', { roomId: sessionId });
        socketRef.current.disconnect();
      }
  
      // Clean up peer connections
      peersRef.current.forEach(({ peer }) => peer.destroy());
      setPeers([]);
  
      // Stop the media stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
    } catch (error) {
      console.error('Failed to end video session:', error);
    }
  };
  
  // Fetch active session on mount
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const { data } = await api.get(`/videosession/get-session?groupId=${groupId}`);
        if (data.sessionId) {
          setInCall(true);
          setSessionId(data.sessionId);
          joinCall();
        }
      } catch (error) {
        console.error('Error checking active session:', error);
      }
    };
    checkActiveSession();
  }, [groupId, joinCall]);

  // Join session when `sessionId` changes
  useEffect(() => {
    if (sessionId) {
      api.post('/videosession/join-session', { sessionId }).catch((err) => {
        console.error('Failed to join session:', err);
        setError(err.response?.data?.message || 'Failed to join session.');
      });
    }
  }, [sessionId]);

 

  // Peer management
  const createPeer = (userToSignal, callerID, stream) => {
    const peer = new Peer({ initiator: true, trickle: false, stream });
    peer.on('signal', (signal) => {
      socketRef.current.emit('sendingSignal', { userToSignal, callerID, signal });
    });
    return peer;
  };

  const addPeer = (incomingSignal, callerID, stream) => {
    const peer = new Peer({ initiator: false, trickle: false, stream });
    peer.on('signal', (signal) => {
      socketRef.current.emit('returningSignal', { signal, callerID });
    });
    peer.signal(incomingSignal);
    return peer;
  };

  // Toggle audio, video, and screen sharing
  const toggleAudio = () => {
    stream.getAudioTracks()[0].enabled = !audioEnabled;
    setAudioEnabled(!audioEnabled);
  };

  const toggleVideo = () => {
    stream.getVideoTracks()[0].enabled = !videoEnabled;
    setVideoEnabled(!videoEnabled);
  };

  const toggleScreenSharing = async () => {
    try {
      const screenStream = screenSharing
        ? await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        : await navigator.mediaDevices.getDisplayMedia({ video: true });

      setStream(screenStream);
      userVideo.current.srcObject = screenStream;
      peersRef.current.forEach(({ peer }) =>
        peer.replaceTrack(stream.getVideoTracks()[0], screenStream.getVideoTracks()[0], stream)
      );

      screenStream.getVideoTracks()[0].onended = () => setScreenSharing(false);
      setScreenSharing(!screenSharing);
    } catch (err) {
      console.error('Screen sharing failed:', err);
    }
  };
    
  // useEffect to Fetch Messages
  useEffect(() => {
    if (sessionId) {
      const fetchMessages = async () => {
        try {
          const response = await api.get(`/videosession/messages/${sessionId}`);
          if (response.data.success) {
            // Set the chat messages to the state if successful
            setMessages(response.data.chatMessages);
          } else {
            console.error("Failed to load messages:", response.data.message);
          }
        } catch (error) {
          // Catch any errors from the API request
          console.error("Error fetching messages:", error);
        }
      };
  
      fetchMessages();
    }
  }, [sessionId]); // Run effect when sessionId changes
  
  // sendMessage Function
const sendMessage = async () => {
  if (!message.trim()) return; // Prevent sending empty messages

  const newMessage = {
    sessionId, // Matches the backend sessionId parameter
    message: message.trim(), // Message content
  };

  try {
    // Send the message to the backend
    const response = await api.post('/videosession/send-message', newMessage, {
     
    });

    if (response.data.success) {
      // Update the local state to display the message
      setMessages((prevMessages) => [
        ...prevMessages,
        
          { sender: currentUser, content: message.trim(), timestamp: new Date() },
        ]);
  

      // Emit the message to other users in the room via Socket.IO
      socketRef.current.emit('sendMessage', {
        sessionId,
        userId: currentUser._id,
        message: message.trim(),
      });

      setMessage(''); // Clear the input field
    } else {
      console.error('Failed to send message:', response.data.message);
    }
  } catch (error) {
    console.error('Failed to send message:', error.response?.data || error.message);
  }
};

  return (
    <div className="video-chat-container">
          {/* Error Display */}
    {error && (
      <div className="error-banner">
        <p>{error}</p>
        <button onClick={() => setError('')} title="Dismiss Error">
          Dismiss
        </button>
      </div>
    )}
      <div className="controls">
        {inCall ? (
          <>
            <button onClick={endCall} title="End Call">
  <FaPhoneSlash />
</button>

            
            <button
              onClick={toggleAudio}
              title={audioEnabled ? 'Mute Audio' : 'Unmute Audio'}
            >
              {audioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
            </button>
            <button
              onClick={toggleVideo}
              title={videoEnabled ? 'Disable Video' : 'Enable Video'}
            >
              {videoEnabled ? <FaVideo /> : <FaVideoSlash />}
            </button>
            <button
              onClick={toggleScreenSharing}
              title={screenSharing ? 'Stop Screen Share' : 'Share Screen'}
            >
              <FaDesktop />
            </button>
            <button
              onClick={() => navigator.mediaDevices.enumerateDevices()}
              title="Switch Camera"
            >
              <FaSync />
            </button>
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              title={showParticipants ? 'Hide Participants' : 'Show Participants'}
            >
              <FaUsers />
            </button>
            <button
              onClick={() => setShowChat(!showChat)}
              title={showChat ? 'Hide Chat' : 'Show Chat'}
            >
              <FaCommentDots />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={startCall}
              disabled={inCall}
              title={inCall ? 'Session already active' : 'Start Call'}
            >
              <FaPhone />
            </button>
            <button onClick={joinCall} title="Join Call">
              <FaPhone />
            </button>
          </>
        )}
      </div>
  
      {inCall && (
        <div className="video-area">
          <video muted ref={userVideo} autoPlay playsInline className="user-video" />
          
          {peers.map((peer, index) => (
            <Video key={index} peer={peer} />
          ))}
        </div>
      )}
  
      {showParticipants && inCall && <UserList participants={participants} />}
      {showChat && inCall && <ChatBox messages={messages} message={message} setMessage={setMessage} sendMessage={sendMessage} />}
  
      
    </div>
  );
  
};

const Video = ({ peer }) => {
  const ref = useRef();
  useEffect(() => {
    peer.on('stream', (stream) => {
      ref.current.srcObject = stream;
    });
  }, [peer]);
  return <video playsInline autoPlay ref={ref} className="user-video" />;
};

const ChatBox = ({ messages, message, setMessage, sendMessage }) => (
  <div className="chat-area">
       <div className="chat-messages">
       {messages.map((msg, index) => (
  <div
    key={index}
    className={`message ${
      msg.userId?.name === 'You' ? 'my-message' : ''
    }`}
  >
    {/* Safely access userId and fall back to 'Unknown' */}
    <span className="message-sender">
      {msg.userId?.name || 'Unknown'}
    </span>
    <p className="message-text">{msg.message || ''}</p>
  </div>
))}

    </div>
    <input
      type="text"
      value={message}
      onChange={(e) => setMessage(e.target.value)}
      placeholder="Type a message"
      aria-label="Type a message"
    />
    <button onClick={sendMessage} title="Send Message">
      <FaRegPaperPlane />
    </button>
  </div>
);

const UserList = ({ participants }) =>( 
    <div className="user-list">
      <h4>Participants</h4>
      
      {participants && participants.length > 0 ? (
        <ul>
          {participants.map((participant, index) => (
            <li key={index}>
              <strong>Name:</strong> {participant.userId?.name || 'Unknown'}
              
            </li>
          ))}
        </ul>
      ) : (
        <p>No participants</p>
      )}
    </div>
  );


  

export default VideoChat;