import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log("🟢 SHARED SOCKET CONNECTED:", socket.id);
});

socket.onAny((event, ...args) => {
  console.log("📡 SOCKET EVENT RECEIVED:", event, args);
});

export default socket;