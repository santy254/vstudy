import React, { createContext, useContext, useState } from 'react';

const VideoChatContext = createContext();

export const useVideoChat = () => useContext(VideoChatContext);

export const VideoChatProvider = ({ children }) => {
  const [videoChatState, setVideoChatState] = useState({
    inCall: false,
    sessionId: null,
    userList: [],
  });

  return (
    <VideoChatContext.Provider value={{ videoChatState, setVideoChatState }}>
      {children}
    </VideoChatContext.Provider>
  );
};
