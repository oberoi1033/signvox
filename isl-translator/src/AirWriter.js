import React, { useRef, useState, useEffect, useCallback } from "react";

const NEON_COLORS = [
  { name: "Green",  value: "#39ff14", glow: "rgba(57,255,20,0.6)" },
  { name: "Pink",   value: "#ff2d78", glow: "rgba(255,45,120,0.6)" },
  { name: "Cyan",   value: "#00f5ff", glow: "rgba(0,245,255,0.6)" },
  { name: "Yellow", value: "#fff01f", glow: "rgba(255,240,31,0.6)" },
  { name: "Purple", value: "#bf5fff", glow: "rgba(191,95,255,0.6)" },
  { name: "Orange", value: "#ff6700", glow: "rgba(255,103,0,0.6)" },
];

const BRUSH_SIZES = [3, 6, 10, 16];
const ERASER_SIZE = 40; // radius of eraser

const FINGER_TIPS = [4, 8, 12, 16, 20];
const FINGER_PIPS = [3, 6, 10, 14, 18];

function isFingerUp(landmarks, i) {
  const tip = landmarks[FINGER_TIPS[i]];
  const pip = landmarks[FINGER_PIPS[i]];
  if (i === 0) return Math.abs(tip.x - landmarks[0].x) > Math.abs(pip.x - landmarks[0].x);
  return tip.y < pip.y;
}

function getGesture(landmarks) {
  if (!landmarks || landmarks.length < 21) return "idle";
  const [, index, middle, ring, pinky] = [0,1,2,3,4].map(i => isFingerUp(landmarks, i));
  if (!index && !middle && !ring && !pinky) return "erase"; // fist
  if (index && !middle && !ring && !pinky) return "draw";   // index only
  if (index && middle && !ring && !pinky) return "lift";    // peace sign
  return "idle";
}

function lerp(a, b, t) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// Get wrist/fist center = average of all landmark positions
function getFistCenter(landmarks, W, H) {
  const xs = landmarks.map(l => (1 - l.x) * W);
  const ys = landmarks.map(l => l.y * H);
  return {
    x: xs.reduce((a, b) => a + b, 0) / xs.length,
    y: ys.reduce((a, b) => a + b, 0) / ys.length,
  };
}

export default function AirWriter() {
  const videoRef = useRef(null);
  const drawCanvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const handsRef = useRef(null);
  const cameraRef = useRef(null);
  const lastPointRef = useRef(null);
  const smoothedRef = useRef(null);
  const fistSmoothedRef = useRef(null);
  const strokesRef = useRef([]);
  const currentStrokeRef = useRef(null);
  const selectedColorRef = useRef(NEON_COLORS[0]);
  const brushSizeRef = useRef(6);

  const [isRunning, setIsRunning] = useState(false);
  const [selectedColor, setSelectedColor] = useState(NEON_COLORS[0]);
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1]);
  const [gesture, setGesture] = useState("idle");
  const [loading, setLoading] = useState(false);

  useEffect(() => { selectedColorRef.current = selectedColor; }, [selectedColor]);
  useEffect(() => { brushSizeRef.current = brushSize; }, [brushSize]);

  const redrawStrokes = useCallback(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokesRef.current.forEach(stroke => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color.value;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = stroke.color.glow;
      ctx.shadowBlur = stroke.size * 3;
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      stroke.points.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
      ctx.shadowBlur = 0;
    });
  }, []);

  // Erase at position using destination-out composite
  const eraseAt = useCallback((x, y) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, ERASER_SIZE, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fill();
    ctx.restore();
  }, []);

  const onResults = useCallback((results) => {
    const drawCanvas = drawCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!drawCanvas || !overlayCanvas) return;

    const W = drawCanvas.width;
    const H = drawCanvas.height;
    const octx = overlayCanvas.getContext("2d");
    octx.clearRect(0, 0, W, H);

    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      lastPointRef.current = null;
      smoothedRef.current = null;
      fistSmoothedRef.current = null;
      currentStrokeRef.current = null;
      setGesture("idle");
      return;
    }

    const landmarks = results.multiHandLandmarks[0];
    const currentGesture = getGesture(landmarks);
    setGesture(currentGesture);

    // Draw hand skeleton on overlay
    const connections = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [0,9],[9,10],[10,11],[11,12],
      [0,13],[13,14],[14,15],[15,16],
      [0,17],[17,18],[18,19],[19,20],
      [5,9],[9,13],[13,17],
    ];
    const color = selectedColorRef.current;
    const size = brushSizeRef.current;

    connections.forEach(([a, b]) => {
      const la = landmarks[a];
      const lb = landmarks[b];
      octx.beginPath();
      octx.moveTo((1 - la.x) * W, la.y * H);
      octx.lineTo((1 - lb.x) * W, lb.y * H);
      octx.strokeStyle = currentGesture === "draw"
        ? color.value + "55"
        : currentGesture === "erase"
        ? "rgba(255,80,80,0.5)"
        : "rgba(255,255,255,0.2)";
      octx.lineWidth = 1.5;
      octx.stroke();
    });

    landmarks.forEach((lm, idx) => {
      const x = (1 - lm.x) * W;
      const y = lm.y * H;
      const isTip = FINGER_TIPS.includes(idx);
      octx.beginPath();
      octx.arc(x, y, isTip ? 5 : 3, 0, 2 * Math.PI);
      octx.fillStyle = currentGesture === "draw" ? color.value
        : currentGesture === "erase" ? "#ff6060"
        : "rgba(255,255,255,0.5)";
      octx.shadowColor = currentGesture === "draw" ? color.glow : "transparent";
      octx.shadowBlur = isTip ? 8 : 0;
      octx.fill();
      octx.shadowBlur = 0;
    });

    if (currentGesture === "draw") {
      // Smooth index tip
      const tip = landmarks[8];
      const rawX = (1 - tip.x) * W;
      const rawY = tip.y * H;
      const prev = smoothedRef.current || { x: rawX, y: rawY };
      const smoothed = lerp(prev, { x: rawX, y: rawY }, 0.55);
      smoothedRef.current = smoothed;
      fistSmoothedRef.current = null;

      // Neon cursor
      octx.beginPath();
      octx.arc(smoothed.x, smoothed.y, size / 2 + 8, 0, 2 * Math.PI);
      octx.fillStyle = color.value + "20";
      octx.shadowColor = color.glow;
      octx.shadowBlur = 25;
      octx.fill();
      octx.beginPath();
      octx.arc(smoothed.x, smoothed.y, size / 2, 0, 2 * Math.PI);
      octx.fillStyle = color.value;
      octx.shadowBlur = 10;
      octx.fill();
      octx.shadowBlur = 0;

      // Draw on canvas
      if (!currentStrokeRef.current) {
        currentStrokeRef.current = { points: [], color, size };
        strokesRef.current.push(currentStrokeRef.current);
      }
      currentStrokeRef.current.points.push({ x: smoothed.x, y: smoothed.y });

      if (lastPointRef.current) {
        const ctx = drawCanvas.getContext("2d");
        ctx.beginPath();
        ctx.strokeStyle = color.value;
        ctx.lineWidth = size;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowColor = color.glow;
        ctx.shadowBlur = size * 3;
        ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
        ctx.lineTo(smoothed.x, smoothed.y);
        ctx.stroke();
        ctx.shadowBlur = size * 5;
        ctx.lineWidth = size * 0.3;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      lastPointRef.current = { x: smoothed.x, y: smoothed.y };

    } else if (currentGesture === "erase") {
      // Use fist center as eraser position
      const raw = getFistCenter(landmarks, W, H);
      const prevFist = fistSmoothedRef.current || raw;
      const smoothedFist = lerp(prevFist, raw, 0.5);
      fistSmoothedRef.current = smoothedFist;
      smoothedRef.current = null;
      lastPointRef.current = null;
      currentStrokeRef.current = null;

      // Erase at fist position
      eraseAt(smoothedFist.x, smoothedFist.y);

      // Draw eraser circle on overlay
      octx.beginPath();
      octx.arc(smoothedFist.x, smoothedFist.y, ERASER_SIZE, 0, 2 * Math.PI);
      octx.strokeStyle = "rgba(255,100,100,0.8)";
      octx.lineWidth = 2;
      octx.setLineDash([5, 5]);
      octx.shadowColor = "rgba(255,80,80,0.5)";
      octx.shadowBlur = 15;
      octx.stroke();
      octx.setLineDash([]);

      // Inner fill
      octx.beginPath();
      octx.arc(smoothedFist.x, smoothedFist.y, ERASER_SIZE, 0, 2 * Math.PI);
      octx.fillStyle = "rgba(255,80,80,0.08)";
      octx.fill();
      octx.shadowBlur = 0;

      // Eraser label
      octx.font = "bold 11px 'Space Mono', monospace";
      octx.fillStyle = "rgba(255,120,120,0.9)";
      octx.textAlign = "center";
      octx.fillText("✊ ERASER", smoothedFist.x, smoothedFist.y - ERASER_SIZE - 10);

    } else if (currentGesture === "lift") {
      lastPointRef.current = null;
      currentStrokeRef.current = null;
      fistSmoothedRef.current = null;

      // Peace cursor
      const tip = landmarks[8];
      const x = (1 - tip.x) * W;
      const y = tip.y * H;
      octx.beginPath();
      octx.arc(x, y, 14, 0, 2 * Math.PI);
      octx.strokeStyle = "rgba(255,255,255,0.5)";
      octx.lineWidth = 2;
      octx.stroke();

    } else {
      lastPointRef.current = null;
      currentStrokeRef.current = null;
      fistSmoothedRef.current = null;
    }
  }, [eraseAt]);

  const startCamera = useCallback(async () => {
    setLoading(true);
    try {
      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js");
      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");

      const hands = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });
      hands.setOptions({ maxNumHands: 1, modelComplexity: 0, minDetectionConfidence: 0.7, minTrackingConfidence: 0.6 });
      hands.onResults(onResults);
      handsRef.current = hands;

      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => { await hands.send({ image: videoRef.current }); },
        width: 640, height: 480,
      });
      await camera.start();
      cameraRef.current = camera;
      setIsRunning(true);
    } catch (err) {
      console.error(err);
      alert("Failed to load. Check internet connection.");
    }
    setLoading(false);
  }, [onResults]);

  const stopCamera = useCallback(() => {
    cameraRef.current?.stop();
    handsRef.current?.close();
    cameraRef.current = null;
    handsRef.current = null;
    setIsRunning(false);
    setGesture("idle");
    lastPointRef.current = null;
    smoothedRef.current = null;
    fistSmoothedRef.current = null;
    currentStrokeRef.current = null;
    const o = overlayCanvasRef.current;
    if (o) o.getContext("2d").clearRect(0, 0, o.width, o.height);
  }, []);

  const undoLast = () => { strokesRef.current.pop(); redrawStrokes(); };
  const clearAll = () => {
    strokesRef.current = [];
    currentStrokeRef.current = null;
    lastPointRef.current = null;
    const c = drawCanvasRef.current;
    if (c) c.getContext("2d").clearRect(0, 0, c.width, c.height);
  };
  const saveDrawing = () => {
    const c = drawCanvasRef.current;
    if (!c) return;
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = "signvox-art.png";
    a.click();
  };

  useEffect(() => () => stopCamera(), [stopCamera]);

  const sc = {
    idle:  { text: "☝️ Raise index finger to draw", color: "rgba(255,255,255,0.3)" },
    draw:  { text: "✏️ Drawing...", color: selectedColor.value },
    lift:  { text: "✌️ Pen lifted", color: "rgba(255,255,255,0.5)" },
    erase: { text: "✊ Erasing under fist...", color: "#ff6060" },
  }[gesture] || { text: "...", color: "white" };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", fontFamily: "'Syne', sans-serif", color: "#f0ede8" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .color-btn { width: 30px; height: 30px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; transition: all 0.2s; }
        .color-btn.active { border-color: white; transform: scale(1.3); }
        .brush-btn { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; cursor: pointer; padding: 10px; flex: 1; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .brush-btn.active { background: rgba(99,255,180,0.08); border-color: rgba(99,255,180,0.3); }
        .action-btn { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.5); padding: 8px 14px; border-radius: 10px; font-family: 'Space Mono', monospace; font-size: 0.7rem; cursor: pointer; transition: all 0.2s; }
        .action-btn:hover { background: rgba(255,255,255,0.08); color: white; }
      `}</style>

      <header style={{ padding: "18px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: 34, height: 34, background: "linear-gradient(135deg, #63ffb4, #00c9ff)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>🤟</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1rem" }}>SIGNVOX</div>
            <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)", fontFamily: "'Space Mono', monospace" }}>AIR WRITER ✍️</div>
          </div>
        </div>
        <div style={{ padding: "8px 18px", background: "rgba(255,255,255,0.03)", border: `1px solid ${sc.color}33`, borderRadius: "50px", fontFamily: "'Space Mono', monospace", fontSize: "0.72rem", color: sc.color, transition: "all 0.3s" }}>
          {sc.text}
        </div>
      </header>

      <main style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "20px", padding: "20px 40px", maxWidth: "1200px", margin: "0 auto" }}>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{
            position: "relative", borderRadius: "20px", overflow: "hidden",
            background: "#050508",
            border: `1px solid ${gesture === "draw" ? selectedColor.value + "44" : gesture === "erase" ? "#ff606044" : "rgba(255,255,255,0.06)"}`,
            aspectRatio: "4/3",
            boxShadow: gesture === "draw" ? `0 0 50px ${selectedColor.glow}` : gesture === "erase" ? "0 0 30px rgba(255,80,80,0.2)" : "none",
            transition: "all 0.3s",
          }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)", backgroundSize: "50px 50px" }} />
            <video ref={videoRef} style={{ display: "none" }} playsInline />
            <canvas ref={drawCanvasRef} width={640} height={480} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
            <canvas ref={overlayCanvasRef} width={640} height={480} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />

            {!isRunning && strokesRef.current.length === 0 && (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
                <div style={{ fontSize: "3.5rem" }}>✍️</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.75rem", color: "rgba(255,255,255,0.18)", textAlign: "center", lineHeight: 1.8 }}>
                  Click Start Camera<br />
                  ☝️ Index finger = draw<br />
                  ✌️ Two fingers = lift pen<br />
                  ✊ Fist = erase under hand
                </div>
              </div>
            )}

            {loading && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(5,5,8,0.9)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", backdropFilter: "blur(4px)" }}>
                <div style={{ fontSize: "2rem" }}>⚡</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.8rem", color: "#63ffb4" }}>Loading MediaPipe...</div>
              </div>
            )}

            {isRunning && (
              <div style={{ position: "absolute", top: 14, left: 14, padding: "5px 12px", background: "rgba(5,5,8,0.8)", border: `1px solid ${sc.color}44`, borderRadius: "50px", fontFamily: "'Space Mono', monospace", fontSize: "0.65rem", color: sc.color }}>
                {gesture === "draw" ? "● DRAWING" : gesture === "erase" ? "✊ ERASING" : gesture === "lift" ? "✌️ PEN UP" : "○ READY"}
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={undoLast} className="action-btn">↩ Undo</button>
              <button onClick={clearAll} className="action-btn">🗑️ Clear All</button>
              <button onClick={saveDrawing} className="action-btn">💾 Save</button>
            </div>
            <button onClick={isRunning ? stopCamera : startCamera} disabled={loading}
              style={{ padding: "11px 26px", borderRadius: "50px", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer", border: "none", textTransform: "uppercase", letterSpacing: "0.05em", transition: "all 0.2s", background: isRunning ? "transparent" : `linear-gradient(135deg, ${selectedColor.value}, #00c9ff)`, color: isRunning ? "#ff6b6b" : "#0a0a0f", outline: isRunning ? "2px solid #ff6b6b" : "none", opacity: loading ? 0.5 : 1 }}>
              {loading ? "Loading..." : isRunning ? "⏹ Stop" : "▶ Start Camera"}
            </button>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ borderRadius: "14px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", background: "#0d0d14", position: "relative" }}>
            <video autoPlay playsInline muted ref={videoRef} style={{ width: "100%", display: "block", transform: "scaleX(-1)" }} />
            <div style={{ position: "absolute", bottom: 6, left: "50%", transform: "translateX(-50%)", fontFamily: "'Space Mono', monospace", fontSize: "0.55rem", color: "rgba(255,255,255,0.25)", background: "rgba(0,0,0,0.5)", padding: "2px 8px", borderRadius: "50px" }}>CAMERA</div>
          </div>

          <div style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "14px", padding: "16px" }}>
            <div style={{ fontSize: "0.6rem", fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.25)", letterSpacing: "0.15em", marginBottom: "12px" }}>NEON COLOR</div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {NEON_COLORS.map(c => (
                <button key={c.name} className={`color-btn ${selectedColor.name === c.name ? "active" : ""}`}
                  style={{ background: c.value, boxShadow: selectedColor.name === c.name ? `0 0 12px ${c.glow}` : "none" }}
                  onClick={() => setSelectedColor(c)} title={c.name} />
              ))}
            </div>
            <div style={{ marginTop: "10px", padding: "6px 10px", background: selectedColor.value + "0f", border: `1px solid ${selectedColor.value}2a`, borderRadius: "6px", fontFamily: "'Space Mono', monospace", fontSize: "0.65rem", color: selectedColor.value }}>
              {selectedColor.name}
            </div>
          </div>

          <div style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "14px", padding: "16px" }}>
            <div style={{ fontSize: "0.6rem", fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.25)", letterSpacing: "0.15em", marginBottom: "12px" }}>BRUSH SIZE</div>
            <div style={{ display: "flex", gap: "6px" }}>
              {BRUSH_SIZES.map(s => (
                <button key={s} className={`brush-btn ${brushSize === s ? "active" : ""}`} onClick={() => setBrushSize(s)}>
                  <div style={{ width: s, height: s, borderRadius: "50%", background: brushSize === s ? selectedColor.value : "rgba(255,255,255,0.3)", boxShadow: brushSize === s ? `0 0 8px ${selectedColor.glow}` : "none", margin: "auto" }} />
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "14px", padding: "16px" }}>
            <div style={{ fontSize: "0.6rem", fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.25)", letterSpacing: "0.15em", marginBottom: "12px" }}>GESTURES</div>
            {[
              { icon: "☝️", label: "Index finger", action: "Draw", color: selectedColor.value },
              { icon: "✌️", label: "Two fingers",  action: "Lift pen", color: "rgba(255,255,255,0.5)" },
              { icon: "✊", label: "Fist + move",  action: "Erase area", color: "#ff6060" },
            ].map((g, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "1.1rem" }}>{g.icon}</span>
                  <span style={{ fontSize: "0.68rem", fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.35)" }}>{g.label}</span>
                </div>
                <span style={{ fontSize: "0.65rem", fontFamily: "'Space Mono', monospace", color: g.color }}>{g.action}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}