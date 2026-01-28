const { SerialPort } = require("serialport");

/**
 * Checks if a barcode scanner is connected on a given port.
 */
async function getScannerStatus(portName = "COM9") {
  try {
    const ports = await SerialPort.list();
    const found = ports.find((p) => p.path === portName);

    if (found) {
      return {
        port: portName,
        status: "Online ✅",
        manufacturer: found.manufacturer || "Unknown",
        serialNumber: found.serialNumber || "N/A",
        connected: true,
      };
    } else {
      return {
        port: portName,
        status: "Offline ❌",
        manufacturer: "N/A",
        serialNumber: "N/A",
        connected: false,
      };
    }
  } catch (err) {
    return {
      port: portName,
      status: `Error ⚠️: ${err.message}`,
      manufacturer: "N/A",
      serialNumber: "N/A",
      connected: false,
    };
  }
}

module.exports = { getScannerStatus };
