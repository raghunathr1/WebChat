import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";

const socket = io("http://localhost:5000");

function App() {
  const [username, setUsername] = useState("");
  const [inputUsername, setInputUsername] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isJoined, setIsJoined] = useState(false);
  const [connected, setConnected] = useState(false);

  // Fetch previous messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/messages"
        );

        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      }
    };

    fetchMessages();
  }, []);

  // Socket.io
  useEffect(() => {
    const handleConnect = () => {
      console.log("Connected:", socket.id);
      setConnected(true);
    };

    const handleDisconnect = () => {
      console.log("Disconnected");
      setConnected(false);
    };

    const handleReceiveMessage = (newMessage) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        newMessage,
      ]);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("receive_message", handleReceiveMessage);
    };
  }, []);

  // Join chat
  const joinChat = (e) => {
    e.preventDefault();

    const trimmedUsername = inputUsername.trim();

    if (!trimmedUsername) {
      return;
    }

    setUsername(trimmedUsername);
    setIsJoined(true);
  };

  // Logout
  const logout = () => {
    setUsername("");
    setInputUsername("");
    setIsJoined(false);
    setMessage("");
  };

  // Send message
  const sendMessage = (e) => {
    e.preventDefault();

    if (!message.trim()) {
      return;
    }

    socket.emit("send_message", {
      username,
      message: message.trim(),
    });

    setMessage("");
  };

  // Login screen
  if (!isJoined) {
    return (
      <div className="app">
        <div className="login-container">
          <div className="login-icon">💬</div>

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
            />

            <button type="submit">
              Join Chat
            </button>
          </form>

          <div className="connection-status">
            <span
              className={
                connected ? "status-dot online" : "status-dot"
              }
            ></span>

            {connected ? "Connected" : "Connecting..."}
          </div>
        </div>
      </div>
    );
  }

  // Chat screen
  return (
    <div className="app">
      <div className="chat-container">

        {/* Header */}
        <div className="chat-header">
          <div>
            <h1>💬 Real-Time Chat</h1>

            <div className="user-status">
              <span className="status-dot online"></span>
              Online
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
              </div>
            ))
          )}
        </div>

        {/* Message input */}
        <form
          className="message-form"
          onSubmit={sendMessage}
        >
          <input
            type="text"
            placeholder="Type your message..."
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
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