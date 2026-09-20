import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import API from "../services/api";

const socket = io("http://localhost:5000");

console.log("SOCKET CREATED:", socket.id);

socket.on("connect", () => {
  console.log("SOCKET CONNECTED:", socket.id);
});

const Chat = ({ user }) => {
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);

  // Current logged-in user
  const currentUser = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const currentUserId =
    currentUser?._id || currentUser?.id;
  console.log("CURRENT USER:", currentUser);
  console.log("CURRENT USER ID:", currentUserId);

  const isUserOnline =
    user?._id &&
    onlineUsers.has(String(user._id));

  // ========================================
  // LOAD CHAT + MESSAGES
  // ========================================

  useEffect(() => {
    if (!user?._id) {
      setChat(null);
      setMessages([]);
      return;
    }

    const loadChat = async () => {
      try {
        setLoading(true);

        // Create or get existing chat
        const chatResponse = await API.post("/chats", {
          userId: user._id,
        });

        const chatData = chatResponse.data;

        setChat(chatData);

        // Load messages
        const messageResponse = await API.get(
          `/messages/${chatData._id}`
        );
        console.log(
          "MESSAGES FROM DATABASE:",
          messageResponse.data.map((message) => ({
            id: message._id,
            text: message.text,
            status: message.status,
          }))
        );

        setMessages(messageResponse.data);
      } catch (error) {
        console.error(
          "Failed to load chat:",
          error.response?.data || error.message
        );

        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    loadChat();
  }, [user?._id]);


  useEffect(() => {
    if (!currentUserId) return;

    // ========================================
    // USER ONLINE
    // ========================================

    const sendUserOnline = () => {
      console.log(
        "SENDING USER ONLINE:",
        currentUserId
      );

      socket.emit(
        "userOnline",
        String(currentUserId)
      );
    };

    // ========================================
    // RECEIVE ONLINE USERS
    // ========================================

    const handleOnlineUsers = (data) => {
      console.log(
        "ONLINE USERS:",
        data.users
      );

      setOnlineUsers(
        new Set(
          data.users.map((id) => String(id))
        )
      );
    };

    // ========================================
    // RECEIVE ONLINE/OFFLINE STATUS
    // ========================================

    const handleUserStatus = (data) => {
      console.log(
        "STATUS RECEIVED:",
        data
      );

      const userId = String(data.userId);

      setOnlineUsers((prev) => {
        const updated = new Set(prev);

        if (data.status === "online") {
          updated.add(userId);
        }

        if (data.status === "offline") {
          updated.delete(userId);
        }

        return updated;
      });
    };

    // ========================================
    // TYPING
    // ========================================

    const handleTyping = (data) => {
      console.log("TYPING RECEIVED:", data);

      if (
        String(data.userId) === String(user?._id) &&
        String(data.chatId) === String(chat?._id)
      ) {
        setIsTyping(true);
      }
    };

    const handleStopTyping = (data) => {
      console.log("STOP TYPING RECEIVED:", data);

      if (
        String(data.userId) === String(user?._id) &&
        String(data.chatId) === String(chat?._id)
      ) {
        setIsTyping(false);
      }
    };

    // LISTENERS FIRST
    socket.on(
      "onlineUsers",
      handleOnlineUsers
    );

    socket.on(
      "userStatus",
      handleUserStatus
    );

    socket.on(
      "typing",
      handleTyping
    );

    socket.on(
      "stopTyping",
      handleStopTyping
    );

    // SEND ONLINE STATUS
    if (socket.connected) {
      sendUserOnline();
    }

    socket.on(
      "connect",
      sendUserOnline
    );

    // CLEANUP
    return () => {
      socket.off(
        "onlineUsers",
        handleOnlineUsers
      );

      socket.off(
        "userStatus",
        handleUserStatus
      );

      socket.off(
        "typing",
        handleTyping
      );

      socket.off(
        "stopTyping",
        handleStopTyping
      );

      socket.off(
        "connect",
        sendUserOnline
      );
    };
  }, [currentUserId]);
  // ========================================
  // JOIN CHAT ROOM
  // ========================================

  useEffect(() => {
    if (!chat?._id) return;

    socket.emit("joinChat", chat._id);

    console.log("Joined chat:", chat._id);
  }, [chat?._id]);

  // ========================================
  // RECEIVE REAL-TIME MESSAGE
  // ========================================

  useEffect(() => {
    const receiveMessage = (message) => {
      if (!message) return;

      // Get chat ID from received message
      const messageChatId =
        message.chat?._id || message.chat;

      // Ignore messages from another chat
      if (
        String(messageChatId) !==
        String(chat?._id)
      ) {
        return;
      }

      setMessages((prev) => {
        // Prevent duplicate message
        const alreadyExists = prev.some(
          (msg) =>
            String(msg._id) === String(message._id)
        );

        if (alreadyExists) {
          return prev;
        }

        return [...prev, message];
      });
    };

    socket.on(
      "receiveMessage",
      receiveMessage
    );

    return () => {
      socket.off(
        "receiveMessage",
        receiveMessage
      );
    };
  }, [chat?._id]);



  // ========================================
  // MESSAGE DELIVERED
  // ========================================

  useEffect(() => {
    const handleMessageDelivered = (data) => {
      console.log("MESSAGE DELIVERED EVENT:", data);

      // Do NOT mark as delivered if receiver is offline
      const receiverIsOnline =
        user?._id &&
        onlineUsers.has(String(user._id));

      console.log(
        "RECEIVER ONLINE:",
        receiverIsOnline
      );

      if (!receiverIsOnline) {
        console.log(
          "❌ Ignoring delivered event because receiver is offline"
        );
        return;
      }

      setMessages((prev) =>
        prev.map((message) =>
          String(message._id) === String(data.messageId)
            ? {
              ...message,
              status: "delivered",
            }
            : message
        )
      );
    };

    socket.on(
      "messageDelivered",
      handleMessageDelivered
    );

    return () => {
      socket.off(
        "messageDelivered",
        handleMessageDelivered
      );
    };
  }, [user?._id, onlineUsers]);



  // ========================================
  // AUTO SCROLL
  // ========================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isTyping]);
  // ========================================
  // SEND MESSAGE
  // ========================================

  const sendMessage = async (e) => {
    e.preventDefault();

    const cleanText = text.trim();

    if (!cleanText || !chat?._id) {
      return;
    }

    // Stop typing indicator
    socket.emit("stopTyping", {
      userId: currentUserId,
      chatId: chat._id,
    });

    try {
      const response = await API.post(
        "/messages",
        {
          chatId: chat._id,
          text: cleanText,
        }
      );

      const newMessage = response.data;

      console.log("========== NEW MESSAGE ==========");
      console.log("MESSAGE ID:", newMessage._id);
      console.log("MESSAGE STATUS FROM API:", newMessage.status);
      console.log("SOCKET CONNECTED:", socket.connected);
      console.log("SOCKET ID:", socket.id);

      // Add immediately to current user's UI
      setMessages((prev) => {
        const alreadyExists = prev.some(
          (msg) =>
            String(msg._id) ===
            String(newMessage._id)
        );

        if (alreadyExists) {
          return prev;
        }

        return [...prev, newMessage];
      });

      // Send through Socket.IO
      socket.emit(
        "sendMessage",
        newMessage
      );

      // Clear input
      setText("");
    } catch (error) {
      console.error(
        "Failed to send message:",
        error.response?.data || error.message
      );
    }
  };

  // ========================================
  // NO USER SELECTED
  // ========================================

  if (!user) {
    return (
      <div className="chat empty-chat">
        <h2>
          Welcome to ChatsApp 👋
        </h2>

        <p>
          Select a user to start chatting
        </p>
      </div>
    );
  }

  // ========================================
  // CHAT UI
  // ========================================

  return (
    <div className="chat">

      {/* ================================
          CHAT HEADER
      ================================= */}

      <div className="chat-header">

        <div className="avatar">
          {user.name
            ?.charAt(0)
            .toUpperCase()}
        </div>

        <div className="chat-user-info">

          <h3>
            {user.name}
          </h3>

          <span
            className={
              isTyping
                ? "typing-status"
                : isUserOnline
                  ? "online-status"
                  : "offline-status"
            }
          >
            {isTyping
              ? "typing..."
              : isUserOnline
                ? "online"
                : "offline"}
          </span>
        </div>

      </div>


      {/* ================================
          MESSAGES
      ================================= */}

      <div className="messages">

        {loading ? (
          <div className="loading-text">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="no-messages">
            Start a conversation with{" "}
            {user.name} 👋
          </div>
        ) : (
          messages.map((message) => {

            const senderId =
              message.sender?._id ||
              message.sender;

            const senderEmail =
              message.sender?.email;

            const isMine =
              String(senderId) === String(currentUserId) ||
              (
                senderEmail &&
                currentUser?.email &&
                senderEmail.toLowerCase() ===
                currentUser.email.toLowerCase()
              );

            return (
              <div
                key={message._id}
                className={`message-row ${isMine
                  ? "sent-row"
                  : "received-row"
                  }`}
              >
                <div
                  className={`message-bubble ${isMine
                    ? "sent-bubble"
                    : "received-bubble"
                    }`}
                >
                  <p>{message.text}</p>

                  <div className="message-meta">
                    <span>
                      {new Date(
                        message.createdAt
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

                    {isMine && (
                      <span className="checks">
                        {message.status === "read"
                          ? "🔵✓✓"
                          : message.status === "delivered"
                            ? "✓✓"
                            : "✓"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* TYPING INDICATOR */}
        {isTyping && (
          <div className="typing-indicator">
            typing...
          </div>
        )}

        <div ref={messagesEndRef} />

      </div>


      {/* ================================
          MESSAGE INPUT
      ================================= */}

      <form
        className="message-input"
        onSubmit={sendMessage}
      >

        <input
          type="text"
          placeholder={`Message ${user.name}`}
          value={text}
          onChange={(e) => {
            const value = e.target.value;

            setText(value);

            console.log("TYPING:", {
              userId: currentUserId,
              chatId: chat?._id,
              text: value,
            });

            if (value.trim() && chat?._id) {
              socket.emit("typing", {
                userId: currentUserId,
                chatId: chat._id,
              });
            } else if (chat?._id) {
              socket.emit("stopTyping", {
                userId: currentUserId,
                chatId: chat._id,
              });
            }
          }}
        />

        <button type="submit">
          ➤
        </button>

      </form>

    </div>
  );
};

export default Chat;