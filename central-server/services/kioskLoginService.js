// services/kioskLoginService.js
const axios = require("axios");

async function updateKioskBackend(kioskDetails) {
  const { id, name, location, ip_address } = kioskDetails;

  // Check if IP address is provided
  if (!ip_address) {
    console.error(`❌ No IP address configured for kiosk ${name} (ID: ${id})`);
    return;
  }

  try {
    // Process the IP address to ensure it has the correct format
    let baseUrl;
    
    // Check if it already has a protocol
    if (ip_address.startsWith('http://') || ip_address.startsWith('https://')) {
      // Has protocol, extract host and add port 8000
      const url = new URL(ip_address);
      baseUrl = `${url.protocol}//${url.hostname}:8000`;
    } else {
      // No protocol, check if it already has a port
      if (ip_address.includes(':')) {
        // Remove any existing port and use port 8000
        const hostname = ip_address.split(':')[0];
        baseUrl = `http://${hostname}:8000`;
      } else {
        // Just IP address, add port 8000
        baseUrl = `http://${ip_address}:8000`;
      }
    }

    console.log(`🔄 Attempting to update kiosk ${name} at ${baseUrl}/api/update-config`);

    // Send kiosk details to the kiosk backend at its IP address with port 8000
    await axios.post(`${baseUrl}/api/update-config`, {
      kioskId: id,
      kioskName: name,
      kioskLocation: location,
    }, {
      timeout: 5000, // 5 second timeout
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log(`✅ Updated kiosk config for ${name} (ID: ${id}) at ${baseUrl}`);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error(`❌ Failed to connect to kiosk ${name} at ${ip_address}:8000: Connection refused`);
    } else if (error.code === 'ETIMEDOUT') {
      console.error(`❌ Timeout connecting to kiosk ${name} at ${ip_address}:8000`);
    } else if (error.response) {
      console.error(`❌ Kiosk ${name} at ${ip_address}:8000 responded with error: ${error.response.status} - ${error.response.statusText}`);
      if (error.response.data) {
        console.error(`Response data:`, error.response.data);
      }
    } else if (error.request) {
      console.error(`❌ No response from kiosk ${name} at ${ip_address}:8000: ${error.message}`);
    } else {
      console.error(`❌ Failed to update kiosk backend for ${name}:`, error.message);
    }
  }
}

module.exports = updateKioskBackend;