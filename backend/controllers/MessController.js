const Message = require("../models/Message");

const sendMessage = async (req, res) => {
  try {
    const { username, message } = req.body;

    if (!username || !message) {
      return res.status(400).json({
        message: "Username and message are required",
      });
    }

    const newMessage = await Message.create({
      username,
      message,
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Send message error:", error);

    res.status(500).json({
      message: "Failed to send message",
    });
  }
};

const getMessages = async (req, res) => {
  try {
    const messages = await Message.find().sort({
      timestamp: 1,
    });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Get messages error:", error);

    res.status(500).json({
      message: "Failed to fetch messages",
    });
  }
};

module.exports = {
  sendMessage,
  getMessages,
};