import { useEffect, useState } from "react";
import API from "../services/api";
import socket from "../services/socket";
;

const Sidebar = ({ onSelectUser }) => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState({});
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await API.get("/users");

        setUsers(response.data);
      } catch (error) {
        console.error(
          error.response?.data?.message || error.message
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);


  useEffect(() => {
    const handleUnreadMessage = (data) => {
      console.log("🔔 SIDEBAR HANDLER CALLED:", data);

      const message = data.message;

      if (!message) return;

      const senderId =
        message.sender?._id || message.sender;

      if (!senderId) return;

      setUnreadCounts((prev) => ({
        ...prev,
        [String(senderId)]:
          (prev[String(senderId)] || 0) + 1,
      }));
    };

    socket.on("unreadMessage", handleUnreadMessage);

    return () => {
      socket.off("unreadMessage", handleUnreadMessage);
    };
  }, []);

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="sidebar">

      {/* Header */}
      <div className="sidebar-header">

        <div className="profile">
          <div className="avatar">A</div>

          <div>
            <h2>ChatsApp</h2>
            <span>My Account</span>
          </div>
        </div>

        <div className="sidebar-actions">
          <button>✏️</button>
          <button>⋮</button>
        </div>

      </div>

      {/* Search */}
      <div className="search-box">
        <span>🔍</span>

        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Users */}
      <div className="chat-list">

        {loading ? (
          <p className="loading-text">
            Loading users...
          </p>
        ) : filteredUsers.length === 0 ? (
          <p className="loading-text">
            No users found
          </p>
        ) : (
          filteredUsers.map((user) => (
            <div
              className="chat-item"
              key={user._id}
              onClick={() => {
                setUnreadCounts((prev) => ({
                  ...prev,
                  [String(user._id)]: 0,
                }));

                onSelectUser(user);
              }}
            >

              <div className="avatar">
                {user.name.charAt(0).toUpperCase()}
              </div>

              <div className="chat-info">

                <div>
                  <h3>{user.name}</h3>

                  <span>
                    {new Date(
                      user.lastSeen
                    ).toLocaleDateString()}
                  </span>
                </div>

                {unreadCounts[String(user._id)] > 0 && (
                  <span className="unread-badge">
                    {unreadCounts[String(user._id)]}
                  </span>
                )}

                <p>{user.status}</p>

              </div>

            </div>
          ))
        )}

      </div>

    </div>
  );
};

export default Sidebar;