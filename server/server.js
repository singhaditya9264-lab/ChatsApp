const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const connectDB = require("./config/db");


const Chat = require("./models/Chat");
const Message = require("./models/Message");

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

  pingInterval: 5000,
  pingTimeout: 5000,
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
  // MARK MESSAGES AS READ
  // ========================================

  socket.on("markMessagesRead", async (data) => {
    try {
      const { chatId, userId } = data;

      console.log("📖 MARK MESSAGES READ:", {
        chatId,
        userId,
      });

      if (!chatId || !userId) {
        console.log("❌ Missing chatId or userId");
        return;
      }

      // Mark messages sent by the other user as read
      const result = await Message.updateMany(
        {
          chat: chatId,
          sender: { $ne: userId },
          status: { $ne: "read" },
        },
        {
          $set: {
            status: "read",
          },
        }
      );

      console.log(
        "✅ MESSAGES MARKED READ:",
        result.modifiedCount
      );

      // Notify everyone in this chat that messages were read
      io.to(String(chatId)).emit("messagesRead", {
        chatId: String(chatId),
        userId: String(userId),
      });

    } catch (error) {
      console.error(
        "MARK MESSAGES READ ERROR:",
        error.message
      );
    }
  });

  // TYPING
  socket.on("typing", (data) => {
    console.log("TYPING:", data);
    socket.to(data.chatId).emit("typing", {
      userId: data.userId,
      chatId: data.chatId,
    });
  });

  // STOP TYPING
  socket.on("stopTyping", (data) => {
    console.log("STOP TYPING:", data);
    socket.to(data.chatId).emit("stopTyping", {
      userId: data.userId,
      chatId: data.chatId,
    });
  });

  // ========================================
  // SEND MESSAGE
  // ========================================

  socket.on("sendMessage", async (message) => {
    try {
      const Chat = require("./models/Chat");
      const Message = require("./models/Message");

      const chatData = await Chat.findById(message.chat);

      if (!chatData) {
        console.log("CHAT NOT FOUND");
        return;
      }

      const senderId = String(
        message.sender?._id || message.sender
      );

      const receiverId = chatData.participants.find(
        (id) => String(id) !== senderId
      );

      if (!receiverId) {
        console.log("RECEIVER NOT FOUND");
        return;
      }

      const receiverIdString = String(receiverId);
      console.log("========== RECEIVER DEBUG ==========");
      console.log(
        "CHAT PARTICIPANTS:",
        chatData.participants.map((id) => String(id))
      );
      console.log("SENDER ID:", senderId);
      console.log("RECEIVER ID:", receiverIdString);
      console.log(
        "ONLINE USERS:",
        Array.from(onlineUsers.entries())
      );
      console.log("====================================");
      console.log("========== MESSAGE STATUS CHECK ==========");
      console.log("MESSAGE:", message._id);
      console.log("SENDER:", senderId);
      console.log("RECEIVER:", receiverIdString);

      const receiverSocketId =
        onlineUsers.get(receiverIdString);

      console.log(
        "RECEIVER SOCKET ID:",
        receiverSocketId
      );

      const receiverSocket = receiverSocketId
        ? io.sockets.sockets.get(receiverSocketId)
        : null;

      console.log(
        "RECEIVER SOCKET EXISTS:",
        !!receiverSocket
      );

      // Send message to chat
      io.to(message.chat).emit(
        "receiveMessage",
        message
      );

      if (receiverSocketId) {
        // Receiver is genuinely connected
        await Message.findByIdAndUpdate(
          message._id,
          {
            status: "delivered",
          }
        );

       console.log("🔔 SENDING UNREAD EVENT TO:", receiverSocketId);
        io.to(receiverSocketId).emit("unreadMessage", {
          message,
        });

        const senderSocketId =
          onlineUsers.get(senderId);

        if (senderSocketId) {
          io.to(senderSocketId).emit(
            "messageDelivered",
            {
              messageId: message._id,
            }
          );
        }
      } else {
        // Receiver is offline
        await Message.findByIdAndUpdate(
          message._id,
          {
            status: "sent",
          }
        );

        console.log("❌ RECEIVER OFFLINE");
        console.log("MESSAGE REMAINS SENT");
      }

      console.log("==========================================");

    } catch (error) {
      console.error(
        "SEND MESSAGE SOCKET ERROR:",
        error.message
      );
    }
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