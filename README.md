# ChatsApp

A full-stack real-time messaging application inspired by WhatsApp, built using the **MERN Stack** with **Socket.IO** for real-time communication.

## 🚀 Project Overview

**ChatsApp** is a real-time chat application where users can register, log in, find other users, create conversations, and exchange messages instantly.

The application uses REST APIs for authentication, users, chats, and messages, while **Socket.IO** handles real-time messaging, online/offline status, typing indicators, message delivery, and read receipts.

---

## 🛠️ Tech Stack

### Frontend

* React.js
* Vite
* JavaScript
* CSS
* Axios
* Socket.IO Client

### Backend

* Node.js
* Express.js
* Socket.IO
* JWT
* bcrypt
* CORS
* dotenv

### Database

* MongoDB
* MongoDB Atlas
* Mongoose

---

## ✨ Current Features

### 🔐 Authentication

* User registration
* User login
* JWT authentication
* Password hashing using bcrypt
* Persistent logged-in user

### 👥 Users

* User list
* User selection
* User-to-user conversations

### 💬 Chat

* Create chat conversations
* Load existing conversations
* Send messages
* Receive messages in real time
* Message persistence
* Automatic message loading
* Duplicate message prevention

### 🟢 Online / Offline Status

* Real-time online status
* Real-time offline status
* Shared Socket.IO connection
* User socket tracking

### ✍️ Typing Indicator

* Real-time typing detection
* Typing status displayed in the chat header

### ✓ Message Delivery

* Message delivery status
* WhatsApp-style single tick
* Double tick when delivered

### ✓✓ Read Receipts

* Read message status
* WhatsApp-style read receipts
* Real-time message status updates

### 📜 Chat Experience

* Automatic scroll to latest message
* Sender/receiver message alignment
* WhatsApp-style message ticks
* Persistent messages after refresh

### 🔔 Unread Messages

* Unread message event through Socket.IO
* Unread message counter
* Green unread badge in Sidebar
* Badge resets when a chat is opened

> **Current development:** Preventing the unread counter from increasing when the corresponding chat is already open.

---

## ⚡ Real-Time Architecture

ChatsApp uses a **shared Socket.IO connection**.

The frontend contains:

```text
client/src/services/socket.js
```

Example:

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log("🟢 SHARED SOCKET CONNECTED:", socket.id);
});

socket.onAny((event, ...args) => {
  console.log("📡 SOCKET EVENT RECEIVED:", event, args);
});

export default socket;
```

Both `Chat.jsx` and `Sidebar.jsx` use this shared socket:

```javascript
import socket from "../services/socket";
```

This prevents multiple Socket.IO connections from overwriting the backend's online-user socket mapping.

---

## 📁 Project Structure

```text
ChatsApp/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── ChatDashboard.jsx
│   │   │
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── socket.js
│   │   │
│   │   └── ...
│   │
│   └── package.json
│
├── server/
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── chatController.js
│   │   ├── messageController.js
│   │   └── ...
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Chat.js
│   │   └── Message.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── chatRoutes.js
│   │   └── messageRoutes.js
│   │
│   ├── server.js
│   └── package.json
│
└── README.md
```

---

## 🔌 API Configuration

### Frontend

```text
http://localhost:5173
```

### Backend

```text
http://localhost:5000
```

### Socket.IO

```text
http://localhost:5000
```

---

## 🔄 Application Flow

```text
User
  ↓
Register / Login
  ↓
JWT Authentication
  ↓
User List
  ↓
Select User
  ↓
Create / Load Chat
  ↓
Load Messages
  ↓
Send Message
  ↓
REST API + Socket.IO
  ↓
Receiver Gets Message
  ↓
Delivery Status
  ↓
Read Receipt
```

---

## 🔔 Unread Message Flow

When a user receives a message while not viewing that conversation:

```text
Sender
   ↓
Socket.IO
   ↓
Backend
   ↓
Receiver Socket
   ↓
"unreadMessage"
   ↓
Sidebar
   ↓
Unread Counter
   ↓
Green Badge
```

The current implementation sends:

```javascript
io.to(receiverSocketId).emit("unreadMessage", {
  message,
});
```

The Sidebar receives the event and updates the unread counter for the sender.

---

## 🧪 Development Environment

### Start Backend

```bash
cd server
npm install
npm start
```

Backend:

```text
http://localhost:5000
```

### Start Frontend

```bash
cd client
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

## 🔐 Environment Variables

Create a `.env` file inside the server directory.

Example:

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret
```

Do not commit `.env` to GitHub.

Add:

```text
.env
node_modules/
```

to `.gitignore`.

---

## 📌 Development Status

### Completed

* [x] MERN project setup
* [x] MongoDB Atlas connection
* [x] User registration
* [x] User login
* [x] JWT authentication
* [x] Password hashing
* [x] User list
* [x] Chat creation
* [x] Chat model
* [x] Message model
* [x] Send messages
* [x] Get messages
* [x] Real-time messaging
* [x] Shared Socket.IO connection
* [x] Online/offline status
* [x] Typing indicator
* [x] Message delivery status
* [x] Read receipts
* [x] Auto-scroll
* [x] Sender/receiver alignment
* [x] WhatsApp-style ticks
* [x] Message persistence
* [x] Duplicate message prevention
* [x] Unread message event
* [x] Unread message badge

### Currently Working On

* [ ] Prevent unread count when the chat is already open
* [ ] Improve unread-message synchronization

---

## 🎯 Future Features

Possible future improvements:

* [ ] User profile
* [ ] Profile picture
* [ ] Last seen
* [ ] Search users
* [ ] Search messages
* [ ] Delete messages
* [ ] Edit messages
* [ ] Reply to messages
* [ ] Emoji picker
* [ ] Image/file sharing
* [ ] Voice messages
* [ ] Group chats
* [ ] Group administration
* [ ] Message notifications
* [ ] Dark/light theme
* [ ] Responsive mobile UI
* [ ] Message timestamps
* [ ] Deployment
* [ ] Production Socket.IO configuration

---

## 👨‍💻 Project

**Project Name:** ChatsApp

**Type:** Real-Time Chat Application

**Architecture:** MERN + Socket.IO

**Database:** MongoDB Atlas

**Frontend:** React + Vite

**Backend:** Node.js + Express

**Real-Time Communication:** Socket.IO

---

## 📄 License

This project is developed for learning and portfolio purposes.
