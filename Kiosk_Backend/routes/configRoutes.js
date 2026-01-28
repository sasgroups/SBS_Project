// routes/configRoutes.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const configPath = path.join(__dirname, "../kioskConfig.json");

router.post("/update-config", (req, res) => {
  const { kioskId, kioskName, kioskLocation, assignedConveyor ,ip_address} = req.body;

  if (!kioskId || !kioskName) {
    return res.status(400).json({ message: "Missing kioskId or kioskName" });
  }

  const newConfig = {
    kioskId,
    kioskName,
    kioskLocation,
    assignedConveyor: assignedConveyor || null,
    ip_address:ip_address || null,
    updatedAt: new Date().toISOString()
  };

  try {
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
    res.json({ message: "✅ Config updated successfully", data: newConfig });
  } catch (err) {
    console.error("❌ Error writing config file:", err);
    res.status(500).json({ message: "Error updating config", error: err.message });
  }
});

router.get("/get-config", (req, res) => {
  try {
    if (!fs.existsSync(configPath)) {
      return res.status(404).json({ message: "Config file not found" });
    }

    const configData = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    res.json(configData);
  } catch (err) {
    console.error("❌ Error reading config file:", err);
    res.status(500).json({ message: "Error reading config", error: err.message });
  }
});

module.exports = router;
