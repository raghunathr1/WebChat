const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const Message = require("./models/Message");
const messageRoutes = require("./routes/MessRoutes");

dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PATCH"],
  })
);

app.use(express.json());

// REST API Routes
app.use("/api/messages", messageRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "Real-Time Chat API is running",
  });
});

// HTTP Server
const server = http.createServer(app);

// Socket.io Server
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Store online users
const onlineUsers = new Map();

// Socket.io connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // User joins chat
  socket.on("join_chat", (username) => {
    if (!username) return;

    onlineUsers.set(socket.id, username);

    console.log(`${username} joined the chat`);

    // Send updated online users to everyone
    io.emit("online_users", Array.from(onlineUsers.values()));
  });

  // Typing indicator
  socket.on("typing", (username) => {
    if (!username) return;

    socket.broadcast.emit("user_typing", username);
  });

  // Stop typing
  socket.on("stop_typing", () => {
    socket.broadcast.emit("user_stop_typing");
  });

  // Receive message from client
  socket.on("send_message", async (data) => {
    try {
      const { username, message } = data;

      if (!username || !message || !message.trim()) {
        socket.emit("message_error", {
          message: "Username and message are required",
        });
        return;
      }

      // Save message in MongoDB
      const newMessage = await Message.create({
        username: username.trim(),
        message: message.trim(),
      });

      // Broadcast message to all connected users
      io.emit("receive_message", newMessage);

      // Stop typing after sending message
      socket.broadcast.emit("user_stop_typing");

    } catch (error) {
      console.error("Socket message error:", error);

      socket.emit("message_error", {
        message: "Failed to send message",
      });
    }
  });

  // Message delivered
  socket.on("message_delivered", async (messageId) => {
    try {
      if (!messageId) return;

      await Message.findByIdAndUpdate(messageId, {
        delivered: true,
      });

      io.emit("message_status_updated", {
        messageId,
        delivered: true,
      });
    } catch (error) {
      console.error("Delivered status error:", error);
    }
  });

  // Message read
  socket.on("message_read", async (messageId) => {
    try {
      if (!messageId) return;

      await Message.findByIdAndUpdate(messageId, {
        read: true,
      });

      io.emit("message_status_updated", {
        messageId,
        delivered: true,
        read: true,
      });
    } catch (error) {
      console.error("Read status error:", error);
    }
  });

  // User disconnect
  socket.on("disconnect", () => {
    const username = onlineUsers.get(socket.id);

    console.log(
      username
        ? `${username} disconnected`
        : `User disconnected: ${socket.id}`
    );

    onlineUsers.delete(socket.id);

    // Send updated online users
    io.emit("online_users", Array.from(onlineUsers.values()));
  });
});

const PORT = process.env.PORT || 5000;

// Start server after MongoDB connection
const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(
      "Server could not start because MongoDB connection failed."
    );
  }
};

startServer();