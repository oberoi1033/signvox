import React, { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import axios from "axios";

const videoConstraints = {
  width: 640,
  height: 480,
  facingMode: "user",
};

const GESTURE_EMOJIS = {
  hello: "👋",
  thanks: "🙏",
  yes: "✅",
  no: "❌",
  please: "🤲",
  sorry: "😔",
  help: "🆘",
  water: "💧",
  food: "🍽️",
  good: "👍",
};

export default function App() {
  const webcamRef = useRef(null);
  const intervalRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [history, setHistory] = useState([]);
  const [noHand, setNoHand] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [pulse, setPulse] = useState(false);

  const speak = (text) => {
    if (!text) return;
    setSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const capture = useCallback(async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    try {
      const res = await axios.post("http://localhost:5000/predict", {
        image: imageSrc,
      });

      if (res.data.prediction) {
        setPrediction(res.data.prediction);
        setConfidence(res.data.confidence);
        setNoHand(false);
        setPulse(true);
        setTimeout(() => setPulse(false), 400);

        setHistory((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.word === res.data.prediction) return prev;
          const newEntry = {
            word: res.data.prediction,
            confidence: res.data.confidence,
            time: new Date().toLocaleTimeString(),
          };
          return [...prev.slice(-9), newEntry];
        });
      } else {
        setNoHand(true);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const toggleDetection = () => {
    if (isRunning) {
      clearInterval(intervalRef.current);
      setIsRunning(false);
      setPrediction(null);
      setConfidence(0);
      setNoHand(false);
    } else {
      intervalRef.current = setInterval(capture, 800);
      setIsRunning(true);
    }
  };

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  const emoji = prediction ? (GESTURE_EMOJIS[prediction] || "🤟") : "🤟";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      fontFamily: "'Syne', sans-serif",
      color: "#f0ede8",
      overflow: "hidden",
      position: "relative",
    }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .glow-border {
          box-shadow: 0 0 0 1px rgba(99,255,180,0.15), 0 0 30px rgba(99,255,180,0.05);
        }

        .cam-active {
          box-shadow: 0 0 0 2px #63ffb4, 0 0 40px rgba(99,255,180,0.2);
        }

        .pulse-anim {
          animation: pulseScale 0.4s ease;
        }

        @keyframes pulseScale {
          0% { transform: scale(1); }
          50% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .history-item {
          animation: fadeIn 0.3s ease;
        }

        .btn-start {
          background: linear-gradient(135deg, #63ffb4, #00c9ff);
          color: #0a0a0f;
          border: none;
          padding: 14px 36px;
          border-radius: 50px;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1rem;
          cursor: pointer;
          letter-spacing: 0.05em;
          transition: all 0.2s ease;
          text-transform: uppercase;
        }

        .btn-start:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(99,255,180,0.3);
        }

        .btn-stop {
          background: transparent;
          color: #ff6b6b;
          border: 2px solid #ff6b6b;
          padding: 14px 36px;
          border-radius: 50px;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1rem;
          cursor: pointer;
          letter-spacing: 0.05em;
          transition: all 0.2s ease;
          text-transform: uppercase;
        }

        .btn-stop:hover {
          background: #ff6b6b;
          color: #0a0a0f;
          transform: translateY(-2px);
        }

        .btn-speak {
          background: transparent;
          border: 1px solid rgba(99,255,180,0.3);
          color: #63ffb4;
          padding: 8px 20px;
          border-radius: 50px;
          font-family: 'Space Mono', monospace;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-speak:hover {
          background: rgba(99,255,180,0.1);
        }

        .confidence-bar {
          height: 4px;
          border-radius: 2px;
          background: rgba(255,255,255,0.08);
          overflow: hidden;
          margin-top: 8px;
        }

        .confidence-fill {
          height: 100%;
          border-radius: 2px;
          background: linear-gradient(90deg, #63ffb4, #00c9ff);
          transition: width 0.4s ease;
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(99,255,180,0.2); border-radius: 2px; }
      `}</style>

      {/* Background decoration */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "radial-gradient(ellipse at 20% 50%, rgba(99,255,180,0.03) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(0,201,255,0.03) 0%, transparent 60%)",
        pointerEvents: "none",
      }} />

      {/* Header */}
      <header style={{
        padding: "24px 48px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: 36, height: 36,
            background: "linear-gradient(135deg, #63ffb4, #00c9ff)",
            borderRadius: "10px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "18px",
          }}>🤟</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.1rem", letterSpacing: "0.05em" }}>SIGNVOX</div>
            <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", fontFamily: "'Space Mono', monospace", letterSpacing: "0.1em" }}>ISL TRANSLATOR</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: isRunning ? "#63ffb4" : "rgba(255,255,255,0.2)",
            boxShadow: isRunning ? "0 0 8px #63ffb4" : "none",
            transition: "all 0.3s",
          }} />
          <span style={{ fontSize: "0.75rem", fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.4)" }}>
            {isRunning ? "LIVE" : "IDLE"}
          </span>
        </div>
      </header>

      {/* Main content */}
      <main style={{
        display: "grid",
        gridTemplateColumns: "1fr 380px",
        gap: "24px",
        padding: "32px 48px",
        maxWidth: "1200px",
        margin: "0 auto",
      }}>

        {/* Left — Webcam */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Camera feed */}
          <div style={{
            position: "relative",
            borderRadius: "20px",
            overflow: "hidden",
            background: "#111118",
            border: "1px solid rgba(255,255,255,0.06)",
          }} className={isRunning ? "cam-active" : "glow-border"}>

            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              style={{ width: "100%", display: "block" }}
            />

            {/* Overlay when not running */}
            {!isRunning && (
              <div style={{
                position: "absolute", inset: 0,
                background: "rgba(10,10,15,0.7)",
                display: "flex", alignItems: "center", justifyContent: "center",
                backdropFilter: "blur(2px)",
              }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "12px" }}>📷</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Space Mono', monospace", fontSize: "0.8rem" }}>Press START to begin detection</div>
                </div>
              </div>
            )}

            {/* No hand indicator */}
            {isRunning && noHand && (
              <div style={{
                position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
                background: "rgba(255,107,107,0.15)",
                border: "1px solid rgba(255,107,107,0.3)",
                borderRadius: "50px",
                padding: "6px 16px",
                fontSize: "0.75rem",
                fontFamily: "'Space Mono', monospace",
                color: "#ff6b6b",
              }}>
                No hand detected
              </div>
            )}

            {/* Live badge */}
            {isRunning && (
              <div style={{
                position: "absolute", top: 16, left: 16,
                display: "flex", alignItems: "center", gap: "6px",
                background: "rgba(10,10,15,0.8)",
                border: "1px solid rgba(99,255,180,0.3)",
                borderRadius: "50px",
                padding: "4px 12px",
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#63ffb4", boxShadow: "0 0 6px #63ffb4" }} />
                <span style={{ fontSize: "0.7rem", fontFamily: "'Space Mono', monospace", color: "#63ffb4" }}>DETECTING</span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              onClick={toggleDetection}
              className={isRunning ? "btn-stop" : "btn-start"}
            >
              {isRunning ? "⏹ Stop Detection" : "▶ Start Detection"}
            </button>
          </div>
        </div>

        {/* Right — Prediction + History */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Prediction card */}
          <div style={{
            background: "#111118",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "20px",
            padding: "28px",
          }} className="glow-border">
            <div style={{ fontSize: "0.7rem", fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em", marginBottom: "20px" }}>
              DETECTED SIGN
            </div>

            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: "4rem", marginBottom: "8px" }}>{emoji}</div>
              <div
                className={pulse ? "pulse-anim" : ""}
                style={{
                  fontSize: "2.8rem",
                  fontWeight: 800,
                  letterSpacing: "0.05em",
                  background: prediction ? "linear-gradient(135deg, #63ffb4, #00c9ff)" : "rgba(255,255,255,0.15)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  textTransform: "uppercase",
                  minHeight: "3.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {prediction || "—"}
              </div>

              {confidence > 0 && (
                <div style={{ marginTop: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.3)" }}>
                    <span>CONFIDENCE</span>
                    <span style={{ color: "#63ffb4" }}>{confidence}%</span>
                  </div>
                  <div className="confidence-bar">
                    <div className="confidence-fill" style={{ width: `${confidence}%` }} />
                  </div>
                </div>
              )}
            </div>

            {prediction && (
              <button
                onClick={() => speak(prediction)}
                className="btn-speak"
                style={{ width: "100%", marginTop: "8px" }}
                disabled={speaking}
              >
                {speaking ? "🔊 Speaking..." : "🔊 Speak"}
              </button>
            )}
          </div>

          {/* History */}
          <div style={{
            background: "#111118",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "20px",
            padding: "24px",
            flex: 1,
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: "16px",
            }}>
              <div style={{ fontSize: "0.7rem", fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em" }}>
                HISTORY
              </div>
              {history.length > 0 && (
                <button
                  onClick={() => setHistory([])}
                  style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: "0.7rem", cursor: "pointer", fontFamily: "'Space Mono', monospace" }}
                >
                  CLEAR
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "rgba(255,255,255,0.15)", fontSize: "0.8rem", fontFamily: "'Space Mono', monospace" }}>
                No signs detected yet
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "300px", overflowY: "auto" }}>
                {[...history].reverse().map((item, i) => (
                  <div
                    key={i}
                    className="history-item"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      background: i === 0 ? "rgba(99,255,180,0.05)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${i === 0 ? "rgba(99,255,180,0.15)" : "rgba(255,255,255,0.04)"}`,
                      borderRadius: "10px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "1.2rem" }}>{GESTURE_EMOJIS[item.word] || "🤟"}</span>
                      <span style={{ fontWeight: 700, textTransform: "uppercase", fontSize: "0.9rem", letterSpacing: "0.05em" }}>{item.word}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.65rem", fontFamily: "'Space Mono', monospace", color: "#63ffb4" }}>{item.confidence}%</div>
                      <div style={{ fontSize: "0.6rem", fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.2)" }}>{item.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sentence builder */}
            {history.length > 0 && (
              <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize: "0.65rem", fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.2)", marginBottom: "8px", letterSpacing: "0.1em" }}>SENTENCE</div>
                <div style={{
                  fontSize: "0.9rem", fontWeight: 600,
                  color: "rgba(255,255,255,0.7)",
                  lineHeight: 1.6,
                }}>
                  {history.map(h => h.word).join(" ")}
                </div>
                <button
                  onClick={() => speak(history.map(h => h.word).join(" "))}
                  className="btn-speak"
                  style={{ marginTop: "10px", width: "100%" }}
                  disabled={speaking}
                >
                  🔊 Speak Sentence
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}