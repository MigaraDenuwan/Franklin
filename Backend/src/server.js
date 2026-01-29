import "dotenv/config";

import http from "http";
import { Server } from "socket.io";

import app from "./app.js";
import { config } from "./config/env.js";

// Create HTTP server using Express app
const httpServer = http.createServer(app);

// ✅ Export io so controllers can import it
export const io = new Server(httpServer, {
  cors: { origin: "*" },
});

// Pass io to notification service
notificationService.setSocketIO(io);

io.on('connection', (socket) => {
    console.log('Client connected for real-time alerts');
});

server.listen(config.port, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${config.port}`);
    console.log(`Accessible on LAN at http://<YOUR_LAN_IP>:${config.port}`);
});
