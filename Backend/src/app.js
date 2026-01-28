import express from "express";
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

import path from "path";

// Static Routes (Streaming)
app.use(
  "/streams",
  express.static(config.streamDir, {
    setHeaders(res) {
      res.setHeader("Access-Control-Allow-Origin", "*");
    },
  }),
);

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
app.use("/api/environment", environmentRoutes);
// Root route
app.get("/", (req, res) => {
  res.send("Franklin Conservation Backend Running (Port 5000)");
});

export default app;
