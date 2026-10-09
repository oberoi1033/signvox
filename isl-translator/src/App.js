import React, { useState, useEffect } from "react";
import ISLTranslator from "./ISLTranslator";
import AirWriter from "./AirWriter";
import History from "./History";
import Login from "./Login";
import Register from "./Register";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authPage, setAuthPage] = useState("login"); // "login" | "register"
  const [page, setPage] = useState("translator"); // "translator" | "airwriter" | "history"
  const [loadingInitial, setLoadingInitial] = useState(true);

  useEffect(() => {
    // Check if user is logged in on initial render
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (storedUser && token) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setCurrentUser(null);
      }
    }
    setLoadingInitial(false);
  }, []);

  const handleLoginSuccess = (user, token) => {
    setCurrentUser(user);
    setPage("translator");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser(null);
    setAuthPage("login");
  };

  if (loadingInitial) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0a0a0f",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#63ffb4",
          fontFamily: "'Space Mono', monospace",
        }}
      >
        Loading SignVox...
      </div>
    );
  }

  // -----------------------------------------------------------------
  // 1. Unauthenticated State: Require Login / Register First
  // -----------------------------------------------------------------
  if (!currentUser) {
    return (
      <div>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          .nav-btn {
            padding: 8px 18px; border-radius: 50px;
            font-family: 'Space Mono', monospace; font-size: 0.72rem;
            cursor: pointer; transition: all 0.2s ease;
            border: 1px solid rgba(255,255,255,0.1);
            background: transparent; color: rgba(255,255,255,0.4);
            letter-spacing: 0.05em;
            white-space: nowrap;
          }
          .nav-btn.active {
            background: rgba(99,255,180,0.1);
            border-color: rgba(99,255,180,0.4);
            color: #63ffb4;
          }
          .nav-btn:hover { border-color: rgba(99,255,180,0.3); color: #63ffb4; }
        `}</style>

        {/* Top auth switch bar */}
        <div
          style={{
            position: "fixed",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "8px",
            zIndex: 1000,
            background: "rgba(10,10,15,0.9)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "50px",
            padding: "6px",
          }}
        >
          <button
            className={`nav-btn ${authPage === "login" ? "active" : ""}`}
            onClick={() => setAuthPage("login")}
          >
            👤 Sign In
          </button>
          <button
            className={`nav-btn ${authPage === "register" ? "active" : ""}`}
            onClick={() => setAuthPage("register")}
          >
            ✨ Register
          </button>
        </div>

        {/* Render Login or Register */}
        {authPage === "login" ? (
          <Login
            onSuccess={handleLoginSuccess}
            onSwitchToRegister={() => setAuthPage("register")}
          />
        ) : (
          <Register
            onSuccess={handleLoginSuccess}
            onSwitchToLogin={() => setAuthPage("login")}
          />
        )}
      </div>
    );
  }

  // -----------------------------------------------------------------
  // 2. Authenticated State: User Has Full Access to Services
  // -----------------------------------------------------------------
  return (
    <div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .nav-btn {
          padding: 8px 18px; border-radius: 50px;
          font-family: 'Space Mono', monospace; font-size: 0.72rem;
          cursor: pointer; transition: all 0.2s ease;
          border: 1px solid rgba(255,255,255,0.1);
          background: transparent; color: rgba(255,255,255,0.4);
          letter-spacing: 0.05em;
          white-space: nowrap;
        }
        .nav-btn.active {
          background: rgba(99,255,180,0.1);
          border-color: rgba(99,255,180,0.4);
          color: #63ffb4;
        }
        .nav-btn:hover { border-color: rgba(99,255,180,0.3); color: #63ffb4; }
        .logout-btn {
          border-color: rgba(255,90,90,0.3);
          color: #ff6b6b;
          background: rgba(255,90,90,0.05);
        }
        .logout-btn:hover {
          background: rgba(255,90,90,0.15);
        }
      `}</style>

      {/* Top nav with services and user profile */}
      <div
        style={{
          position: "fixed",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "8px",
          alignItems: "center",
          zIndex: 1000,
          background: "rgba(10,10,15,0.9)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "50px",
          padding: "6px",
          maxWidth: "95vw",
          overflowX: "auto",
        }}
      >
        <button
          className={`nav-btn ${page === "translator" ? "active" : ""}`}
          onClick={() => setPage("translator")}
        >
          🤟 ISL Translator
        </button>
        <button
          className={`nav-btn ${page === "airwriter" ? "active" : ""}`}
          onClick={() => setPage("airwriter")}
        >
          ✍️ Air Writer
        </button>
        <button
          className={`nav-btn ${page === "history" ? "active" : ""}`}
          onClick={() => setPage("history")}
        >
          📜 History
        </button>

        <div style={{ display: "flex", gap: "6px", alignItems: "center", marginLeft: "4px" }}>
          <span
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "0.68rem",
              color: "rgba(255,255,255,0.6)",
              padding: "0 8px",
              background: "rgba(255,255,255,0.04)",
              borderRadius: "20px",
              border: "1px solid rgba(255,255,255,0.06)",
              lineHeight: "26px",
            }}
          >
            👤 {currentUser.name || currentUser.email || "User"}
          </span>
          <button
            className="nav-btn logout-btn"
            onClick={handleLogout}
            title="Log out"
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Authenticated Service Pages */}
      {page === "translator" && <ISLTranslator />}
      {page === "airwriter" && <AirWriter />}
      {page === "history" && <History onNavigateToLogin={() => handleLogout()} />}
    </div>
  );
}