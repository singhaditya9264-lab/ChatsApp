import { useState } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import "./App.css";

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [showRegister, setShowRegister] = useState(false);

  // If logged in
  if (user) {
    return <Home user={user} />;
  }

  return (
    <div className="auth-page">
      {showRegister ? (
        <Register onRegister={() => setShowRegister(false)} />
      ) : (
        <Login onLogin={setUser} />
      )}

      <button
        className="switch-auth-btn"
        onClick={() => setShowRegister(!showRegister)}
      >
        {showRegister
          ? "Already have an account? Login"
          : "Don't have an account? Register"}
      </button>
    </div>
  );
}

export default App;