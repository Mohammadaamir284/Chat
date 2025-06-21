import { createContext, useState } from "react";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [notification, setNotification] = useState([]);

  return (
    <ChatContext.Provider value={{ notification, setNotification }}>
      {children}
    </ChatContext.Provider>
  );
};
