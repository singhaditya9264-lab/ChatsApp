import { useState } from "react";
import Sidebar from "./Sidebar";
import Chat from "./Chat";

const ChatDashboard = () => {
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <div className="dashboard">

      <Sidebar
        onSelectUser={setSelectedUser}
      />

      <Chat user={selectedUser} />

    </div>
  );
};

export default ChatDashboard;