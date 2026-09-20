const express = require("express");

const {
  sendMessage,
  getMessages,
  updateMessageStatus,
} = require("../controllers/messageController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, sendMessage);

router.get(
  "/:chatId",
  protect,
  getMessages
);
router.put(
  "/:messageId/status",
  protect,
  updateMessageStatus
);

module.exports = router;