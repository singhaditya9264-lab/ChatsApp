const Message = require("../models/Message");
const Chat = require("../models/Chat");

// Send message
const sendMessage = async (req, res) => {
  try {
    const { chatId, text } = req.body;

    const senderId = req.user;

    if (!chatId || !text?.trim()) {
      return res.status(400).json({
        message: "Chat ID and message are required",
      });
    }

    // Check chat
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        message: "Chat not found",
      });
    }

    // Check sender belongs to chat
    const isParticipant = chat.participants.some(
      (participant) =>
        participant.toString() === senderId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        message: "You are not a participant of this chat",
      });
    }

    // Create message
    let message = await Message.create({
      chat: chatId,
      sender: senderId,
      text: text.trim(),
    });

    // Update last message
    chat.lastMessage = message._id;
    await chat.save();

    // Get sender details
    message = await message.populate(
      "sender",
      "name email profilePic"
    );

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({
      message: "Failed to send message",
      error: error.message,
    });
  }
};

// Get messages
const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    const messages = await Message.find({
      chat: chatId,
    })
      .populate(
        "sender",
        "name email profilePic"
      )
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get messages",
      error: error.message,
    });
  }
};

module.exports = {
  sendMessage,
  getMessages,
};