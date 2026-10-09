import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

export default function History({ onNavigateToLogin }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  const fetchHistory = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.get("http://localhost:5001/api/history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setHistory(response.data.data || []);
      }
    } catch (err) {
      console.error("Fetch history error:", err);
      if (err.response?.status === 401) {
        // Expired or invalid token
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setError("Your session has expired. Please log in again.");
      } else {
        setError(
          err.response?.data?.message || "Failed to load translation history from server."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0f",
        color: "#ffffff",
        padding: "80px 24px 40px 24px",
        fontFamily: "'Syne', sans-serif",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {/* Header section */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: "32px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            paddingBottom: "20px",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontFamily: "'Space Mono', monospace",
                fontSize: "0.72rem",
                color: "#63ffb4",
                background: "rgba(99, 255, 180, 0.1)",
                border: "1px solid rgba(99, 255, 180, 0.2)",
                padding: "4px 10px",
                borderRadius: "50px",
                marginBottom: "12px",
                letterSpacing: "0.05em",
              }}
            >
              <span>●</span> CLOUD SYNCED
            </div>
            <h1
              style={{
                fontSize: "2rem",
                fontWeight: "800",
                letterSpacing: "-0.02em",
                color: "#ffffff",
              }}
            >
              Translation <span style={{ color: "#63ffb4" }}>History</span>
            </h1>
            <p
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "0.8rem",
                color: "rgba(255, 255, 255, 0.45)",
                marginTop: "4px",
              }}
            >
              All captured Indian Sign Language translations saved to your account
            </p>
          </div>

          {token && (
            <button
              onClick={fetchHistory}
              disabled={loading}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#63ffb4",
                fontFamily: "'Space Mono', monospace",
                fontSize: "0.75rem",
                padding: "8px 16px",
                borderRadius: "8px",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {loading ? "Refreshing..." : "↻ Refresh"}
            </button>
          )}
        </div>

        {/* Not Logged In State */}
        {!token && (
          <div
            style={{
              background: "rgba(17, 17, 26, 0.85)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "16px",
              padding: "48px 24px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>🔒</div>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "700",
                marginBottom: "8px",
              }}
            >
              Sign In Required
            </h3>
            <p
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "0.8rem",
                color: "rgba(255, 255, 255, 0.5)",
                maxWidth: "400px",
                margin: "0 auto 24px auto",
              }}
            >
              You need to be logged in to sync and view your real-time sign language translation history.
            </p>
            <button
              onClick={onNavigateToLogin}
              style={{
                background: "#63ffb4",
                color: "#0a0a0f",
                fontWeight: "700",
                fontFamily: "'Space Mono', monospace",
                fontSize: "0.8rem",
                padding: "10px 24px",
                borderRadius: "50px",
                border: "none",
                cursor: "pointer",
              }}
            >
              Go to Login →
            </button>
          </div>
        )}

        {/* Error Alert */}
        {token && error && (
          <div
            style={{
              background: "rgba(255, 75, 75, 0.12)",
              border: "1px solid rgba(255, 75, 75, 0.3)",
              color: "#ff6b6b",
              borderRadius: "12px",
              padding: "14px 18px",
              fontSize: "0.85rem",
              fontFamily: "'Space Mono', monospace",
              marginBottom: "24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>⚠️ {error}</span>
            <button
              onClick={fetchHistory}
              style={{
                background: "rgba(255, 75, 75, 0.2)",
                border: "1px solid rgba(255, 75, 75, 0.4)",
                color: "#ffffff",
                padding: "4px 10px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "0.75rem",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {token && loading && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 0",
              fontFamily: "'Space Mono', monospace",
              fontSize: "0.85rem",
              color: "rgba(255, 255, 255, 0.5)",
            }}
          >
            <div
              style={{
                display: "inline-block",
                width: "24px",
                height: "24px",
                border: "2px solid rgba(99, 255, 180, 0.2)",
                borderTopColor: "#63ffb4",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                marginBottom: "12px",
              }}
            />
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <div>Fetching your translation logs...</div>
          </div>
        )}

        {/* Empty History State */}
        {token && !loading && !error && history.length === 0 && (
          <div
            style={{
              background: "rgba(17, 17, 26, 0.6)",
              border: "1px dashed rgba(255, 255, 255, 0.12)",
              borderRadius: "16px",
              padding: "48px 24px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🤟</div>
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: "700",
                color: "#ffffff",
                marginBottom: "6px",
              }}
            >
              No translations yet
            </h3>
            <p
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "0.75rem",
                color: "rgba(255, 255, 255, 0.4)",
              }}
            >
              Perform gestures in the ISL Translator tab while logged in to build your history log.
            </p>
          </div>
        )}

        {/* History List */}
        {token && !loading && history.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {history.map((item, index) => (
              <div
                key={item._id || index}
                style={{
                  background: "rgba(17, 17, 26, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "14px",
                  padding: "16px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "border-color 0.2s ease, transform 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(99, 255, 180, 0.3)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: "rgba(99, 255, 180, 0.1)",
                      border: "1px solid rgba(99, 255, 180, 0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1rem",
                      color: "#63ffb4",
                      fontFamily: "'Space Mono', monospace",
                      fontWeight: "700",
                    }}
                  >
                    #{history.length - index}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "1.1rem",
                        fontWeight: "700",
                        letterSpacing: "-0.01em",
                        color: "#ffffff",
                        textTransform: "capitalize",
                      }}
                    >
                      {item.translatedText}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: "0.7rem",
                        color: "rgba(255, 255, 255, 0.4)",
                        marginTop: "2px",
                      }}
                    >
                      {formatDate(item.timestamp || item.createdAt)}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "0.7rem",
                    color: "#63ffb4",
                    background: "rgba(99, 255, 180, 0.08)",
                    border: "1px solid rgba(99, 255, 180, 0.2)",
                    padding: "4px 10px",
                    borderRadius: "20px",
                  }}
                >
                  ✓ SAVED
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
