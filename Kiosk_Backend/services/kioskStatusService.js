// services/kioskStatusService.js
const kioskStatuses = {}; // Stores status of all kiosks

function updateKioskStatus(kioskId, data) {
  kioskStatuses[kioskId] = {
    ...data,
    lastUpdated: new Date().toISOString(),
  };
}

function getKioskStatus(kioskId) {
  return kioskStatuses[kioskId] || null;
}

function getAllKioskStatuses() {
  return kioskStatuses;
}

module.exports = {
  updateKioskStatus,
  getKioskStatus,
  getAllKioskStatuses,
};
