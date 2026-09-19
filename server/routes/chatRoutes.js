const express = require("express");

const {
  createOrGetChat,
} = require("../controllers/chatController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createOrGetChat);

module.exports = router;