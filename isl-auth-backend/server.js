require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { MongoMemoryServer } = require("mongodb-memory-server");

const authRoutes = require("./routes/auth");
const historyRoutes = require("./routes/history");

const app = express();
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/signvox";

// -------------------------------------------------------------
// Middleware Setup
// -------------------------------------------------------------
app.use(cors()); // Allow cross-origin requests from React frontend (localhost:3000)
app.use(express.json()); // Parse JSON request bodies

// -------------------------------------------------------------
// Route Registrations
// -------------------------------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/history", historyRoutes);

// Health check endpoint
app.get("/ping", (req, res) => {
  res.json({
    status: "ok",
    service: "isl-auth-backend",
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// -------------------------------------------------------------
// MongoDB Connection & Server Launch
// -------------------------------------------------------------
async function startServer() {
  let uri = MONGO_URI;
  try {
    // Attempt connecting to real MongoDB first (2.5s timeout)
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2500 });
    console.log(`[MongoDB] Connected successfully to database: ${uri}`);
  } catch (err) {
    console.log(`[MongoDB] Local MongoDB not reachable (${err.message}). Starting embedded MongoMemoryServer...`);
    try {
      const mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log(`[MongoDB] Connected to embedded in-memory MongoDB: ${uri}`);
    } catch (memErr) {
      console.error("[MongoDB] Failed to start memory server:", memErr.message);
    }
  }

  app.listen(PORT, () => {
    console.log(`[isl-auth-backend] Server listening on http://localhost:${PORT}`);
  });
}

startServer();

module.exports = app;
