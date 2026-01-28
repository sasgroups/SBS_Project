import { io } from "socket.io-client";

const API_URL = "http://localhost:5000";
const kioskId = 1; // each kiosk uses its own ID

const socket = io(API_URL, {
  query: { kioskId }
});

socket.on("connect", () => {
  console.log(`✅ Connected as kiosk ${kioskId}, socket:`, socket.id);
});

// Send status every 2s
setInterval(() => {
  const status = {
    camera: Math.random() > 0.2 ? "ok" : "fail",
    scale: Math.random() > 0.1 ? "ok" : "fail",
    barcode: Math.random() > 0.3 ? "ok" : "fail",
  };

  socket.emit("update-device-status", status);
  console.log("📡 Status sent:", status);
}, 2000);
