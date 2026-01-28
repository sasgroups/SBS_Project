import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;
const socket = io(API_URL);

const KioskStatusDashboard = () => {
  const [kiosks, setKiosks] = useState({});
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all"); // all / online / offline
console.log("I want this data:", JSON.stringify(kiosks, null, 2));

  // Fetch kiosk statuses
  const fetchStatuses = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/kiosks/all`);
      setKiosks(res.data || {});
    } catch (err) {
      console.error("Error fetching kiosk statuses:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStatuses();
    const interval = setInterval(fetchStatuses, 3000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Corrected Socket.IO real-time updates
  useEffect(() => {
    socket.on("update_dashboard", (data) => {
      console.log("📡 Real-time update received:", data);
      setKiosks(data);
    });

    return () => {
      socket.off("update_dashboard");
    };
  }, []);

  // Summary counts
  const totalKiosks = Object.keys(kiosks).length;
  const onlineKiosks = Object.values(kiosks).filter(
    (k) =>
      k.scaleStatus?.includes("Online") &&
      k.scannerStatus?.includes("Online") &&
      k.realsenseStatus?.includes("Online")
  ).length;
  const offlineKiosks = totalKiosks - onlineKiosks;

  // Filter logic
  const filteredKiosks = Object.entries(kiosks).filter(([_, k]) => {
    if (filter === "all") return true;
    const allOnline =
      k.scaleStatus?.includes("Online") &&
      k.scannerStatus?.includes("Online") &&
      k.realsenseStatus?.includes("Online");
    return filter === "online" ? allOnline : !allOnline;
  });

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        🖥️ Kiosk Status Dashboard
      </h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <SummaryCard
          title="Total Kiosks"
          count={totalKiosks}
          color="bg-gray-500"
          onClick={() => setFilter("all")}
          active={filter === "all"}
        />
        <SummaryCard
          title="Working Kiosks"
          count={onlineKiosks}
          color="bg-green-500"
          onClick={() => setFilter("online")}
          active={filter === "online"}
        />
        <SummaryCard
          title="Non-working Kiosks"
          count={offlineKiosks}
          color="bg-red-500"
          onClick={() => setFilter("offline")}
          active={filter === "offline"}
        />
      </div>

      {/* Kiosk table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow-lg overflow-hidden">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="px-4 py-3 text-left">Kiosk Name</th>
              <th className="px-4 py-3 text-left">Weighing Scale</th>
              <th className="px-4 py-3 text-left">Barcode Scanner</th>
              <th className="px-4 py-3 text-left">3D Camera</th>
              <th className="px-4 py-3 text-left">Location</th>
              <th className="px-4 py-3 text-left">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {filteredKiosks.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-6 text-gray-500">
                  {loading ? "Loading kiosks..." : "No kiosks matching filter"}
                </td>
              </tr>
            ) : (
              filteredKiosks.map(([id, data], idx) => (
                <tr
                  key={id}
                  className={`border-t ${
                    idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                  } hover:bg-gray-100 transition`}
                >
                  <td className="px-4 py-3 font-semibold text-gray-700">
                    {data.kiosk_name || id}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={data.scaleStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={data.scannerStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={data.realsenseStatus} />
                  </td>
                  <td className="px-4 py-3">{data.kiosk_location}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {data.lastUpdated
                      ? new Date(data.lastUpdated).toLocaleTimeString()
                      : "N/A"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Summary card
const SummaryCard = ({ title, count, color, onClick, active }) => (
  <div
    onClick={onClick}
    className={`cursor-pointer p-4 rounded-lg shadow-lg flex flex-col items-center justify-center transition transform hover:scale-105 ${
      active ? "ring-4 ring-offset-2 ring-indigo-500" : ""
    } ${color} text-white`}
  >
    <span className="text-lg font-semibold">{title}</span>
    <span className="text-3xl font-bold mt-2">{count}</span>
  </div>
);

// Status badge
const StatusBadge = ({ status }) => {
  if (!status) status = "Offline ❌";
  const colorClass =
    status.includes("Online") || status.includes("✅")
      ? "bg-green-500"
      : status.includes("Offline") || status.includes("❌")
      ? "bg-red-500"
      : "bg-yellow-500";

  return (
    <span
      className={`inline-block px-3 py-1 text-white text-sm font-semibold rounded-full ${colorClass}`}
    >
      {status}
    </span>
  );
};

export default KioskStatusDashboard;
