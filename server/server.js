const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "WhatsApp Clone API is running 🚀",
  });
});

// ========================================
// HTTP SERVER
// ========================================

const server = http.createServer(app);

// ========================================
// SOCKET.IO
// ========================================

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Store currently online users
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ========================================
  // USER ONLINE
  // ========================================

  socket.on("userOnline", (userId) => {
  const id = String(userId);

  socket.userId = id;

  onlineUsers.set(id, socket.id);

  console.log("User online:", id);

  // Send current online users to this user
  socket.emit("onlineUsers", {
    users: Array.from(onlineUsers.keys()),
  });

  // Tell everyone else this user is online
  socket.broadcast.emit("userStatus", {
    userId: id,
    status: "online",
  });
});

  // ========================================
  // JOIN CHAT
  // ========================================

  socket.on("joinChat", (chatId) => {
    socket.join(chatId);

    console.log(
      `Socket ${socket.id} joined chat: ${chatId}`
    );
  });

  // ========================================
  // TYPING
  // ========================================

  socket.on("typing", (data) => {
    socket.broadcast.emit("typing", {
      userId: data.userId,
      chatId: data.chatId,
    });
  });

  // ========================================
  // STOP TYPING
  // ========================================

  socket.on("stopTyping", (data) => {
    socket.broadcast.emit("stopTyping", {
      userId: data.userId,
      chatId: data.chatId,
    });
  });

  // ========================================
  // SEND MESSAGE
  // ========================================

  socket.on("sendMessage", (message) => {
    io.to(message.chat).emit(
      "receiveMessage",
      message
    );
  });

  // ========================================
  // USER DISCONNECT
  // ========================================

  socket.on("disconnect", () => {
    console.log(
      "User disconnected:",
      socket.id
    );

    if (socket.userId) {
      const userId = String(socket.userId);

      // Only remove this user if this socket
      // is their current active socket
      if (onlineUsers.get(userId) === socket.id) {
        onlineUsers.delete(userId);

        console.log(
          "User offline:",
          userId
        );

        io.emit("userStatus", {
          userId,
          status: "offline",
        });
      }
    }
  });
});

// ========================================
// START SERVER
// ========================================

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
});