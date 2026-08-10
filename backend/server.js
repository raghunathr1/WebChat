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
app.use(cors());
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

// Socket.io connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Receive message from client
  socket.on("send_message", async (data) => {
    try {
      const { username, message } = data;

      if (!username || !message) {
        return;
      }

      // Save message in MongoDB
      const newMessage = await Message.create({
        username,
        message,
      });

      // Send message to all connected users
      io.emit("receive_message", newMessage);

    } catch (error) {
      console.error("Socket message error:", error);

      socket.emit("message_error", {
        message: "Failed to send message",
      });
    }
  });

  // User disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
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