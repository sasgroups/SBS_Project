require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const fileUpload = require("express-fileupload");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

// ---- Services ----
const { setupScaleReader, getCurrentWeight, setSocketInstance, getScaleStatus } = require("./services/scaleService");
const { setupScanner, setScannerSocket } = require("./services/scannerService");
const { getScannerStatus } = require("./services/scannerStatus");
const configRoutes = require("./routes/configRoutes");

// ---- Load kiosk config ----
let kioskConfig = {};
try {
  const data = fs.readFileSync(path.join(__dirname, "kioskConfig.json"));
  kioskConfig = JSON.parse(data);
} catch (err) {
  console.error("❌ Failed to load kiosk config:", err.message);
}

setupScaleReader(process.env.SCALE_PORT, 9600);

// ---- App setup ----
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// ---- Middleware ----
app.use(cors());
app.use(express.json());
app.use(fileUpload());
app.use("/api", configRoutes);

// ---- Socket.IO setup ----
setSocketInstance(io);
setScannerSocket(io);

io.on("connection", (socket) => {
  console.log("🟢 Client connected to Socket.IO");
  socket.on("disconnect", () => console.log("🔴 Client disconnected"));
});

// ==========================================================
// SCANNER INITIALIZATION
// ==========================================================
try {
  setupScanner(process.env.SCANNER_PORT, 9600);
} catch (err) {
  console.error("❌ Scanner initialization failed:", err.message);
}

// ==========================================================
// API ENDPOINTS
// ==========================================================
app.get("/api/weight", (req, res) => res.json({ weight: getCurrentWeight() }));
app.get("/api/weight/status", (req, res) => res.json({ status: getScaleStatus() }));

app.get("/api/scanner-status", async (req, res) => {
  const status = await getScannerStatus(process.env.SCANNER_PORT);
  res.json(status);
});

// ==========================================================
// AUTO SEND KIOSK STATUS TO CENTRAL
// ==========================================================
const API_BASE_CENTRAL = process.env.API_URL;
const API_BASE_KIOSK = process.env.API_BASE_KIOSK;

const API_KEY = process.env.API_KEY;

async function sendKioskStatus() {
  // Reload config fresh each time
  let kioskConfig = {};
  try {
    const data = fs.readFileSync(path.join(__dirname, "kioskConfig.json"));
    kioskConfig = JSON.parse(data);
  } catch (err) {
    console.error("❌ Failed to load kiosk config:", err.message);
    return;
  }

  if (!kioskConfig.kioskId) return;

  try {
    const [weightRes, scaleStatusRes, scannerStatusRes] = await Promise.all([
      axios.get(`${API_BASE_KIOSK}/api/weight`),
      axios.get(`${API_BASE_KIOSK}/api/weight/status`),
      axios.get(`${API_BASE_KIOSK}/api/scanner-status`)
    ]);

    const kioskData = {
      kioskId: kioskConfig.kioskId,
      kiosk_name: kioskConfig.kioskName,
      kiosk_location: kioskConfig.kioskLocation ,
      weight: weightRes.data.weight,
      scaleStatus: scaleStatusRes.data.status,
      scannerStatus: scannerStatusRes.data.status || "Unknown",
      timestamp: new Date().toISOString()
    };

    const response = await axios.post(`${API_BASE_CENTRAL}/api/kiosks/update`, kioskData, {
      headers: { "x-api-key": API_KEY, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("❌ Error sending kiosk status:", err.response?.data || err.message);
  }
}

// ==========================================================
// START SERVER
// ==========================================================
server.listen(process.env.PORT, "0.0.0.0", () => {
  console.log(`🚀 Kiosk Backend running on all interfaces (port ${process.env.PORT})`);
  // Delay first send to ensure server is ready
  setTimeout(sendKioskStatus, 8000);
  setInterval(sendKioskStatus, 5000);
});