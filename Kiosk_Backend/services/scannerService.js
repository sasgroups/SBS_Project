// services/scannerService.js
const { SerialPort } = require("serialport");
let getFlightDetails;
(async () => {
  ({ getFlightDetails } = await import("./flightInfoService.js"));
})();

let ioInstance = null;

function setScannerSocket(io) {
  ioInstance = io;
}

async function setupScanner(portName = process.env.SCANNER_PORT , baudRate = 9600) {
  try {
    const ports = await SerialPort.list();
    console.log("Available Serial Ports:", ports.map((p) => p.path));

    // Try to find requested port
    let selectedPort = ports.find((p) => p.path === portName);

    // ✅ If requested port not found, prefer COM9 if available
    if (!selectedPort) {
      const com9 = ports.find((p) => p.path === "COM9");
      if (com9) {
        console.warn(`❌ ${portName} not found. Using COM9 instead.`);
        selectedPort = com9;
      } else {
        console.warn(`❌ ${portName} not found and COM9 not available. Using fallback: ${ports[0]?.path}`);
        if (!ports.length) return console.warn("❌ No serial ports available.");
        selectedPort = ports[0];
      }
    }

    const port = new SerialPort({ path: selectedPort.path, baudRate });
    let buffer = "";

    port.on("open", () => {
      console.log(`✅ Barcode scanner connected on ${selectedPort.path}`);
    });

    port.on("data", async (chunk) => {
      buffer += chunk.toString();

      if (buffer.includes("\r") || buffer.includes("\n") || buffer.length > 20) {
        const barcode = buffer.trim();
        console.log("📦 Barcode scanned:", barcode);

        try {
          // 🔥 Parse boarding pass details
          const details = await getFlightDetails(barcode);

          console.log("✅ Flight details:", details);

          if (ioInstance) {
            ioInstance.emit("barcode_data", { barcode, details }); // send details too
          }
        } catch (err) {
          console.error("❌ Failed to parse barcode:", err.message);
        }

        buffer = "";
      }
    });

    port.on("error", (err) => console.error("❌ Scanner error:", err.message));
    port.on("close", () => console.log("❌ Scanner disconnected"));
  } catch (err) {
    console.error("Failed to initialize scanner:", err.message);
  }
}

module.exports = { setupScanner, setScannerSocket };
