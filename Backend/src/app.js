import express from "express";
import fs from "fs";
import cors from "cors";
import { config } from "./config/env.js";
import streamingRoutes from "./modules/streaming/streaming.routes.js";
import turtlesRoutes from "./modules/turtles/turtles.routes.js";
import nestsRoutes from "./modules/nests/nests.routes.js";
import usersRoutes from "./modules/users/users.routes.js";
import { streamingService } from "./modules/streaming/streaming.service.js";
import shorelineRoutes from "./modules/shoreline/shoreline.routes.js";
import { connectDB } from "./config/db.js";
import detectionsRoutes from "./modules/detections/detections.routes.js";
import healthRoutes from "./modules/turtleHealth/health.routes.js";
import environmentRoutes from "./modules/environment/environment.routes.js";
import hatcheryRoutes from "./modules/hatchery/hatchery.routes.js";
import alertsRoutes from "./modules/alerts/alerts.routes.js";
import profileRoutes from "./modules/users/profile.routes.js";
import cameraRoutes from './modules/cameras/camera.routes.js';
import dataRoutes from "./modules/data/data.routes.js";
import proxyRoutes from "./modules/proxy/proxy.routes.js";

const app = express();

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.method !== "GET") {
    console.log("Body:", JSON.stringify(req.body, null, 2));
  }
  next();
});

// Middleware
app.use(
  cors({
    origin: config.frontendUrl,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Range"],
    exposedHeaders: ["Content-Length", "Content-Range"],
    credentials: true,
  }),
);

app.use(express.json());

// Initialize Database & Services
const init = async () => {
  await connectDB();
  if (config.streamingEnabled) {
    console.log("Streaming is enabled. Starting cameras...");
    streamingService.startAllCameras();
  } else {
    console.log("Streaming is disabled via config.");
  }
};

init();

// Ensure stream directory exists before mounting
if (!fs.existsSync(config.streamDir)) {
  fs.mkdirSync(config.streamDir, { recursive: true });
}

// Static Routes (Streaming)
app.use('/streams', (req, res, next) => {
  // Manual CORS for static files to ensure HLS.js can always access them
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Range, Authorization, Content-Type");
  res.header("Access-Control-Expose-Headers", "Content-Length, Content-Range");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
}, express.static(config.streamDir, {
  setHeaders: (res, filePath) => {
    // Ensure correct MIME types for HLS on Render
    if (filePath.endsWith(".m3u8")) {
      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    } else if (filePath.endsWith(".ts")) {
      res.setHeader("Content-Type", "video/mp2t");
    }
    // Production caching: don't cache manifest, cache segments
    if (filePath.endsWith(".m3u8")) {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    } else {
      res.setHeader("Cache-Control", "public, max-age=3600");
    }
  },
}));

// API Routes
app.use("/api/streaming", streamingRoutes);
app.use("/api/turtles", turtlesRoutes);
app.use("/api/nests", nestsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/detections", detectionsRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/streaming", streamingRoutes);
app.use("/api/turtles", turtlesRoutes);
app.use("/api/nests", nestsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/detections", detectionsRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/shoreline", shorelineRoutes);
app.use("/api/hatchery", hatcheryRoutes);
app.use("/api/alerts", alertsRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/cameras", cameraRoutes);
app.use("/api/data", dataRoutes);
app.use("/api/unified", proxyRoutes); // Proxy for AI Service

// --- COMPATIBILITY ROUTES (Fix for frontend missing /api prefix) ---
app.use("/health", healthRoutes);       // Fix: GET /health/stats
app.use("/hatchery", hatcheryRoutes);   // Fix: GET /hatchery/alerts
app.use("/profile", profileRoutes);     // Fix: GET /profile/me
app.use("/data", dataRoutes);           // Fix: GET /data/:tankId
// ------------------------------------------------------------------

// Health route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});


// Root route
app.get("/", (req, res) => {
  res.send("Franklin Conservation Backend Running (Port 5000)");
});

export default app;
