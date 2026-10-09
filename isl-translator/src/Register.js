import React, { useState } from "react";
import axios from "axios";

export default function Register({ onSuccess, onSwitchToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:5001/api/auth/register", {
        name,
        email,
        password,
      });

      if (response.data.success) {
        // Store JWT token and user info in localStorage
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        if (onSuccess) {
          onSuccess(response.data.user, response.data.token);
        }
      }
    } catch (err) {
      console.error("Registration failed:", err);
      setError(
        err.response?.data?.message || "Failed to register account with auth service."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0f",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "'Syne', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "rgba(17, 17, 26, 0.85)",
          backdropFilter: "blur(16px)",
          borderRadius: "20px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "36px 32px",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              fontSize: "2rem",
              marginBottom: "6px",
              filter: "drop-shadow(0 0 12px rgba(99, 255, 180, 0.4))",
            }}
          >
            ✨
          </div>
          <h2
            style={{
              fontSize: "1.6rem",
              fontWeight: "700",
              letterSpacing: "-0.02em",
              color: "#ffffff",
              marginBottom: "6px",
            }}
          >
            Create <span style={{ color: "#63ffb4" }}>Account</span>
          </h2>
          <p
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "0.75rem",
              color: "rgba(255, 255, 255, 0.45)",
            }}
          >
            Join SignVox to sync your real-time translations
          </p>
        </div>

        {error && (
          <div
            style={{
              background: "rgba(255, 75, 75, 0.12)",
              border: "1px solid rgba(255, 75, 75, 0.3)",
              color: "#ff6b6b",
              borderRadius: "10px",
              padding: "10px 14px",
              fontSize: "0.8rem",
              fontFamily: "'Space Mono', monospace",
              marginBottom: "20px",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label
              style={{
                display: "block",
                fontFamily: "'Space Mono', monospace",
                fontSize: "0.7rem",
                color: "rgba(255, 255, 255, 0.6)",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Smith"
              style={{
                width: "100%",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "10px",
                padding: "12px 14px",
                color: "#ffffff",
                fontSize: "0.9rem",
                fontFamily: "'Space Mono', monospace",
                outline: "none",
                transition: "border-color 0.2s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#63ffb4")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255, 255, 255, 0.12)")}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontFamily: "'Space Mono', monospace",
                fontSize: "0.7rem",
                color: "rgba(255, 255, 255, 0.6)",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              style={{
                width: "100%",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "10px",
                padding: "12px 14px",
                color: "#ffffff",
                fontSize: "0.9rem",
                fontFamily: "'Space Mono', monospace",
                outline: "none",
                transition: "border-color 0.2s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#63ffb4")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255, 255, 255, 0.12)")}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontFamily: "'Space Mono', monospace",
                fontSize: "0.7rem",
                color: "rgba(255, 255, 255, 0.6)",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Password (min. 6 characters)
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: "100%",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "10px",
                padding: "12px 14px",
                color: "#ffffff",
                fontSize: "0.9rem",
                fontFamily: "'Space Mono', monospace",
                outline: "none",
                transition: "border-color 0.2s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#63ffb4")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255, 255, 255, 0.12)")}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "8px",
              background: "#63ffb4",
              color: "#0a0a0f",
              fontWeight: "700",
              fontFamily: "'Space Mono', monospace",
              fontSize: "0.85rem",
              padding: "12px",
              borderRadius: "10px",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "transform 0.15s ease, opacity 0.2s ease",
              opacity: loading ? 0.7 : 1,
              letterSpacing: "0.05em",
            }}
          >
            {loading ? "Creating Account..." : "Register Now →"}
          </button>
        </form>

        <div
          style={{
            marginTop: "24px",
            textAlign: "center",
            fontFamily: "'Space Mono', monospace",
            fontSize: "0.75rem",
            color: "rgba(255, 255, 255, 0.5)",
          }}
        >
          Already have an account?{" "}
          <button
            onClick={onSwitchToLogin}
            style={{
              background: "none",
              border: "none",
              color: "#63ffb4",
              cursor: "pointer",
              textDecoration: "underline",
              fontFamily: "'Space Mono', monospace",
              fontSize: "0.75rem",
            }}
          >
            Sign in here
          </button>
        </div>
      </div>
    </div>
  );
}
