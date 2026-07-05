import React, { useState } from "react";
import ISLTranslator from "./ISLTranslator";
import AirWriter from "./AirWriter";

export default function App() {
  const [page, setPage] = useState("translator");

  return (
    <div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .nav-btn {
          padding: 8px 20px; border-radius: 50px;
          font-family: 'Space Mono', monospace; font-size: 0.72rem;
          cursor: pointer; transition: all 0.2s ease;
          border: 1px solid rgba(255,255,255,0.1);
          background: transparent; color: rgba(255,255,255,0.4);
          letter-spacing: 0.05em;
        }
        .nav-btn.active {
          background: rgba(99,255,180,0.1);
          border-color: rgba(99,255,180,0.4);
          color: #63ffb4;
        }
        .nav-btn:hover { border-color: rgba(99,255,180,0.3); color: #63ffb4; }
      `}</style>

      {/* Top nav */}
      <div style={{
        position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
        display: "flex", gap: "8px", zIndex: 1000,
        background: "rgba(10,10,15,0.9)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "50px", padding: "6px",
      }}>
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
      </div>

      {/* Pages */}
      {page === "translator" ? <ISLTranslator /> : <AirWriter />}
    </div>
  );
}