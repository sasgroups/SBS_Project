// services/flightInfoService.js
const AIRLINES_API_KEY = "TMnd1Mr0FBG0f97NMROpCg==PLsvH3rLoVsyByxh";

async function getFlightDetails(scanCode) {
  const fetch = (await import("node-fetch")).default;

  try {
    console.log(`📦 Barcode scanned: ${scanCode}`);

    let origin = "UNK";
    let destination = "UNK";
    let airlineCode = null;

    if (scanCode.startsWith("M1")) {
      const parts = scanCode.split(/\s+/).filter(Boolean);
      const flightPart = parts.find((p) => /^[A-Z]{6}[A-Z0-9]{2,3}$/.test(p));

      if (flightPart) {
        origin = flightPart.substring(0, 3);
        destination = flightPart.substring(3, 6);
        airlineCode = flightPart.substring(6);
      }
    }

    if (origin === "UNK" || destination === "UNK") {
      const AIRPORT_REGEX = /\b[A-Z]{3}\b/g;
      const AIRLINE_REGEX = /\b[A-Z0-9]{2}\d{1,4}\b/g;

      const airports = scanCode.match(AIRPORT_REGEX) || [];
      if (airports.length >= 2) {
        origin = airports[0];
        destination = airports[1];
      }

      const airlineMatch = scanCode.match(AIRLINE_REGEX);
      if (airlineMatch) {
        airlineCode = airlineMatch[0].substring(0, 2);
      }
    }

    console.log(
      `🔎 Parsed: Origin=${origin}, Destination=${destination}, AirlineCode=${airlineCode}`
    );

    let airlineName = "Unknown Airline";
    if (airlineCode) {
      try {
        const airlineRes = await fetch(
          `https://api.api-ninjas.com/v1/airlines?iata=${airlineCode}`,
          { headers: { "X-Api-Key": AIRLINES_API_KEY } }
        );
        const airlineData = await airlineRes.json();
        airlineName =
          airlineData.length > 0 ? airlineData[0].name : "Unknown Airline";
      } catch {
        console.warn(`⚠️ Failed to fetch airline info for ${airlineCode}`);
      }
    }

    async function fetchAirport(iata) {
      if (!iata || iata === "UNK") return { iata, country: "Unknown" };
      try {
        const res = await fetch(
          `https://api.api-ninjas.com/v1/airports?iata=${iata}`,
          { headers: { "X-Api-Key": AIRLINES_API_KEY } }
        );
        const data = await res.json();
        return data.length > 0 ? data[0] : { iata, country: "Unknown" };
      } catch {
        console.warn(`⚠️ Failed to fetch airport info for ${iata}`);
        return { iata, country: "Unknown" };
      }
    }

    const originData = await fetchAirport(origin);
    const destData = await fetchAirport(destination);

    const flightType =
      originData.country !== "Unknown" &&
      destData.country !== "Unknown" &&
      originData.country === destData.country
        ? "Domestic"
        : "International";

    console.log(`✈ Airline: ${airlineName}`);
    console.log(
      `🌍 ${origin} (${originData.country}) → ${destination} (${destData.country}) = ${flightType}`
    );

    return { origin, destination, airlineName, flightType };
  } catch (error) {
    console.error("❌ Error fetching flight details:", error.message);
    return {
      origin: "UNK",
      destination: "UNK",
      airlineName: "Unknown Airline",
      flightType: "Unknown",
    };
  }
}

module.exports = { getFlightDetails };



// // services/flightInfoService.js
// import fetch from "node-fetch";

// const AIRLINES_API_KEY = "TMnd1Mr0FBG0f97NMROpCg==PLsvH3rLoVsyByxh";

// /**
//  * Get flight details from scanned barcode / boarding pass string
//  */
// export async function getFlightDetails(scanCode) {
//   try {
//     console.log(`📦 Barcode scanned: ${scanCode}`);

//     let origin = "UNK";
//     let destination = "UNK";
//     let airlineCode = null;

//     // 1️⃣ Try parsing as BCBP (Boarding Pass)
//     if (scanCode.startsWith("M1")) {
//       const parts = scanCode.split(/\s+/).filter(Boolean);

//       // Match flight segment: ORG (3) + DEST (3) + AL (2–3)
//       const flightPart = parts.find((p) =>
//         /^[A-Z]{6}[A-Z0-9]{2,3}$/.test(p)
//       );

//       if (flightPart) {
//         origin = flightPart.substring(0, 3);
//         destination = flightPart.substring(3, 6);
//         airlineCode = flightPart.substring(6); // 2 or 3 chars
//       }
//     }

//     // 2️⃣ Fallback parsing (generic barcode / non-BCBP)
//     if (origin === "UNK" || destination === "UNK") {
//       const AIRPORT_REGEX = /\b[A-Z]{3}\b/g;
//       const AIRLINE_REGEX = /\b[A-Z0-9]{2}\d{1,4}\b/g;

//       const airports = scanCode.match(AIRPORT_REGEX) || [];
//       if (airports.length >= 2) {
//         origin = airports[0];
//         destination = airports[1];
//       }

//       const airlineMatch = scanCode.match(AIRLINE_REGEX);
//       if (airlineMatch) {
//         airlineCode = airlineMatch[0].substring(0, 2);
//       }
//     }

//     console.log(
//       `🔎 Parsed: Origin=${origin}, Destination=${destination}, AirlineCode=${airlineCode}`
//     );

//     // 3️⃣ Lookup airline
//     let airlineName = "Unknown Airline";
//     if (airlineCode) {
//       try {
//         const airlineRes = await fetch(
//           `https://api.api-ninjas.com/v1/airlines?iata=${airlineCode}`,
//           { headers: { "X-Api-Key": AIRLINES_API_KEY } }
//         );
//         const airlineData = await airlineRes.json();
//         airlineName =
//           airlineData.length > 0 ? airlineData[0].name : "Unknown Airline";
//       } catch {
//         console.warn(`⚠️ Failed to fetch airline info for ${airlineCode}`);
//       }
//     }

//     // 4️⃣ Lookup airports
//     async function fetchAirport(iata) {
//       if (!iata || iata === "UNK") return { iata, country: "Unknown" };
//       try {
//         const res = await fetch(
//           `https://api.api-ninjas.com/v1/airports?iata=${iata}`,
//           { headers: { "X-Api-Key": AIRLINES_API_KEY } }
//         );
//         const data = await res.json();
//         return data.length > 0 ? data[0] : { iata, country: "Unknown" };
//       } catch {
//         console.warn(`⚠️ Failed to fetch airport info for ${iata}`);
//         return { iata, country: "Unknown" };
//       }
//     }

//     const originData = await fetchAirport(origin);
//     const destData = await fetchAirport(destination);

//     const flightType =
//       originData.country !== "Unknown" &&
//       destData.country !== "Unknown" &&
//       originData.country === destData.country
//         ? "Domestic"
//         : "International";

//     console.log(`✈ Airline: ${airlineName}`);
//     console.log(
//       `🌍 ${origin} (${originData.country}) → ${destination} (${destData.country}) = ${flightType}`
//     );

//     return { origin, destination, airlineName, flightType };
//   } catch (error) {
//     console.error("❌ Error fetching flight details:", error.message);
//     return {
//       origin: "UNK",
//       destination: "UNK",
//       airlineName: "Unknown Airline",
//       flightType: "Unknown",
//     };
//   }
// }
