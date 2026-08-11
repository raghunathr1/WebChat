import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";

const SERVER_URL = "https://webchat-1-qcdg.onrender.com";

const socket = io(SERVER_URL, {
  transports: ["websocket", "polling"],
});

function App() {
  const [username, setUsername] = useState("");
  const [inputUsername, setInputUsername] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isJoined, setIsJoined] = useState(false);

  // Online users
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Socket connection
  const [connected, setConnected] = useState(false);

  // Typing indicator
  const [typingUser, setTypingUser] = useState("");

  // --------------------------------------------------
  // Fetch previous messages
  // --------------------------------------------------

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`${SERVER_URL}/api/messages`);

        if (!response.ok) {
          throw new Error("Failed to fetch messages");
        }

        const data = await response.json();

        setMessages(data);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      }
    };

    fetchMessages();
  }, []);

  // --------------------------------------------------
  // Socket.io listeners
  // --------------------------------------------------

  useEffect(() => {
    const handleConnect = () => {
      console.log("Connected:", socket.id);
      setConnected(true);

      // If user is already joined, notify server
      if (username) {
        socket.emit("join_chat", username);
      }
    };

    const handleDisconnect = () => {
      console.log("Disconnected from server");
      setConnected(false);
    };

    // Receive new message
    const handleReceiveMessage = (newMessage) => {
      setMessages((prevMessages) => {
        // Prevent duplicate messages
        const exists = prevMessages.some(
          (msg) => msg._id === newMessage._id
        );

        if (exists) {
          return prevMessages;
        }

        return [...prevMessages, newMessage];
      });

      // Mark received message as delivered
      if (newMessage.username !== username) {
        socket.emit("message_delivered", newMessage._id);
      }
    };

    // Online users
    const handleOnlineUsers = (users) => {
      setOnlineUsers(users);
    };

    // Typing indicator
    const handleUserTyping = (typingUsername) => {
      if (typingUsername !== username) {
        setTypingUser(typingUsername);
      }
    };

    // Stop typing
    const handleUserStopTyping = () => {
      setTypingUser("");
    };

    // Message status updated
    const handleMessageStatusUpdated = (status) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === status.messageId
            ? {
                ...msg,
                delivered:
                  status.delivered ?? msg.delivered,
                read: status.read ?? msg.read,
              }
            : msg
        )
      );
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("receive_message", handleReceiveMessage);
    socket.on("online_users", handleOnlineUsers);
    socket.on("user_typing", handleUserTyping);
    socket.on("user_stop_typing", handleUserStopTyping);
    socket.on(
      "message_status_updated",
      handleMessageStatusUpdated
    );

    // Cleanup
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("receive_message", handleReceiveMessage);
      socket.off("online_users", handleOnlineUsers);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stop_typing", handleUserStopTyping);
      socket.off(
        "message_status_updated",
        handleMessageStatusUpdated
      );
    };
  }, [username]);

  // --------------------------------------------------
  // Mark received messages as read
  // --------------------------------------------------

  useEffect(() => {
    if (!isJoined || !username) {
      return;
    }

    messages.forEach((msg) => {
      if (msg.username !== username && !msg.read) {
        socket.emit("message_read", msg._id);
      }
    });
  }, [messages, username, isJoined]);

  // --------------------------------------------------
  // Join chat
  // --------------------------------------------------

  const joinChat = (e) => {
    e.preventDefault();

    const trimmedUsername = inputUsername.trim();

    if (!trimmedUsername) {
      return;
    }

    setUsername(trimmedUsername);
    setIsJoined(true);

    // Notify server
    socket.emit("join_chat", trimmedUsername);
  };

  // --------------------------------------------------
  // Logout
  // --------------------------------------------------

  const logout = () => {
    socket.emit("stop_typing");

    setUsername("");
    setInputUsername("");
    setIsJoined(false);
    setMessage("");
    setTypingUser("");
  };

  // --------------------------------------------------
  // Send message
  // --------------------------------------------------

  const sendMessage = (e) => {
    e.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage || !username) {
      return;
    }

    socket.emit("send_message", {
      username,
      message: trimmedMessage,
    });

    // Stop typing
    socket.emit("stop_typing");

    setMessage("");
  };

  // --------------------------------------------------
  // Handle typing
  // --------------------------------------------------

  const handleMessageChange = (e) => {
    const value = e.target.value;

    setMessage(value);

    if (!username) {
      return;
    }

    if (value.trim()) {
      socket.emit("typing", username);
    } else {
      socket.emit("stop_typing");
    }
  };

  // --------------------------------------------------
  // Login screen
  // --------------------------------------------------

  if (!isJoined) {
    return (
      <div className="app">
        <div className="login-container">
          <h1>Real-Time Chat</h1>

          <p>
            Enter your username to join the conversation
          </p>

          <form onSubmit={joinChat}>
            <input
              type="text"
              placeholder="Enter username"
              value={inputUsername}
              onChange={(e) =>
                setInputUsername(e.target.value)
              }
              maxLength={30}
              required
            />

            <button type="submit">
              Join Chat
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // Chat screen
  // --------------------------------------------------

  return (
    <div className="app">
      <div className="chat-container">

        {/* Header */}
        <div className="chat-header">
          <div>
            <h1>Web-Chat</h1>

            <div className="online-count">
              <span>
                {connected ? "🟢" : "🔴"}
              </span>{" "}
              {onlineUsers.length} online
            </div>
          </div>

          <div className="user-info">
            <span>{username}</span>

            <button onClick={logout}>
              Logout
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="messages-container">

          {messages.length === 0 ? (
            <p className="empty-message">
              No messages yet. Start chatting!
            </p>
          ) : (
            messages.map((msg) => (
              <div
                className={
                  msg.username === username
                    ? "message own-message"
                    : "message"
                }
                key={msg._id}
              >
                <div className="message-top">

                  <strong>
                    {msg.username}
                  </strong>

                  <span>
                    {new Date(
                      msg.timestamp
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>

                </div>

                <p>{msg.message}</p>

                {/* Message status */}
                {msg.username === username && (
                  <div className="message-status">

                    {msg.read ? (
                      <span className="read-status">
                        ✓✓ Read
                      </span>
                    ) : msg.delivered ? (
                      <span>
                        ✓✓ Delivered
                      </span>
                    ) : (
                      <span>
                        ✓ Sent
                      </span>
                    )}

                  </div>
                )}
              </div>
            ))
          )}

          {/* Typing indicator */}
          {typingUser && (
            <div className="typing-indicator">
              <span>{typingUser}</span>{" "}
              is typing...
            </div>
          )}

        </div>

        {/* Message form */}
        <form
          className="message-form"
          onSubmit={sendMessage}
        >
          <input
            type="text"
            placeholder="Type your message..."
            value={message}
            onChange={handleMessageChange}
          />

          <button type="submit">
            Send
          </button>
        </form>

      </div>
    </div>
  );
}

export default App;