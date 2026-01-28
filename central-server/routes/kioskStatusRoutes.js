const express = require("express");
const router = express.Router();

// Add this line 👇
const kiosks = {}; // stores all kiosk statuses

// 🟢 Each kiosk reports its own hardware status
router.post("/status", (req, res) => {
  const { kioskId, weightStatus, scannerStatus, realsenseStatus } = req.body;
  if (!kioskId) return res.status(400).json({ error: "kioskId is required" });

  kiosks[kioskId] = { weightStatus, scannerStatus, realsenseStatus, lastUpdated: new Date().toISOString() };

  res.json({ message: `Status updated for ${kioskId}` });
});

// 🟢 Admin gets all kiosks' statuses
router.get("/all-status", (req, res) => {
  res.json(kiosks);
});

// 🟢 Admin gets one kiosk's status
router.get("/:kioskId", (req, res) => {
  const { kioskId } = req.params;
  const status = kiosks[kioskId];
  if (!status) return res.status(404).json({ error: "Kiosk not found" });
  res.json(status);
});

// 🟢 Update kiosk status (your previous route)
router.post("/update", (req, res) => {
  const { kioskId,kiosk_location,kiosk_name, weightStatus, scannerStatus, realsenseStatus,  } = req.body;
  if (!kioskId) return res.status(400).json({ error: "kioskId required" });

  kiosks[kioskId] = {
    kiosk_name,
    kiosk_location,
    weightStatus,
    scannerStatus,
    realsenseStatus,
    lastUpdated: new Date().toISOString(),
  };

  // Emit via Socket.IO if available
  if (req.app.get("io")) {
    req.app.get("io").emit("scale_status", { kiosk_id: kioskId, status: weightStatus });
    req.app.get("io").emit("scanner_status", { kiosk_id: kioskId, status: scannerStatus });
    req.app.get("io").emit("realsense_status", { kiosk_id: kioskId, status: realsenseStatus });
  }

  res.json({ message: "Status updated", data: kiosks[kioskId] });
});

module.exports = router;
