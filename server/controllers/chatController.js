const Chat = require("../models/Chat");

// Create or get one-to-one chat
const createOrGetChat = async (req, res) => {
  try {
    const { userId } = req.body;

    const currentUserId = req.user;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    if (userId === currentUserId.toString()) {
      return res.status(400).json({
        message: "You cannot chat with yourself",
      });
    }

    // Check existing chat
    let chat = await Chat.findOne({
      participants: {
        $all: [currentUserId, userId],
      },
    }).populate(
      "participants",
      "-password"
    );

    // Create chat if it doesn't exist
    if (!chat) {
      chat = await Chat.create({
        participants: [
          currentUserId,
          userId,
        ],
      });

      chat = await chat.populate(
        "participants",
        "-password"
      );
    }

    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create chat",
      error: error.message,
    });
  }
};

module.exports = {
  createOrGetChat,
};