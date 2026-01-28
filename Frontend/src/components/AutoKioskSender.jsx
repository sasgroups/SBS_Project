import React, { useEffect } from "react";
import axios from "axios";

const API_BASE_CENTRAL = process.env.REACT_APP_API_URL;         // Central server (:7000)
const API_BASE_KIOSK = process.env.REACT_APP_API_URL_KIOSK;     // Local kiosk backend (:5000)
const API_KEY = process.env.REACT_APP_API_KEY || "YOUR_SECRET_KEY"; // Must match central server .env

export default function AutoKioskSender({ kioskId, kioskName, kioskLocation }) {
  // If kiosk props not passed, fallback to localStorage
  const id = kioskId || localStorage.getItem("kiosk_id");
  const name = kioskName || localStorage.getItem("kiosk_name");
  const location = kioskLocation || localStorage.getItem("kiosk_location");

  const sendKioskStatus = async () => {
    if (!id || !name || !location) return; // Only send if current kiosk info is available

    try {
      // Fetch local hardware statuses from Kiosk Backend
      const [weightRes, scannerRes, realsenseRes] = await Promise.all([
        axios.get(`${API_BASE_KIOSK}/api/weight/status`),
        axios.get(`${API_BASE_KIOSK}/api/scanner-status`),
        axios.get(`${API_BASE_KIOSK}/api/realsense-status`),
      ]);

      const kioskData = {
        kioskId: id,
        kiosk_name: name,
        kiosk_location: location,
        weight: weightRes.data?.weight || 0,
        scaleStatus: weightRes.data?.status || "Unknown",
        scannerStatus: scannerRes.data?.status || "Unknown",
        realsenseStatus: realsenseRes.data?.status || "Unknown",
        timestamp: new Date().toISOString(),
      };

      // Send to Central Server with API key
      await axios.post(`${API_BASE_CENTRAL}/api/kiosk/update`, kioskData, {
        headers: { "x-api-key": API_KEY, "Content-Type": "application/json" },
      });

      console.log(`✅ Sent kiosk status to central: ${id}`);
    } catch (err) {
      console.error("❌ Error sending kiosk status:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    // Send immediately and every 5 seconds
    sendKioskStatus();
    const interval = setInterval(sendKioskStatus, 5000);
    return () => clearInterval(interval);
  }, [id, name, location]); // Only runs if kiosk info changes

  return null;
}
