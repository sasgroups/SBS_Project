const db = require('../db'); // this should export mysql2/promise pool

exports.getAllFlights = async () => {
  try {
    const [rows] = await db.execute('SELECT * FROM flights ORDER BY created_at DESC');
    return rows;
  } catch (err) {
    throw err;
  }
};

exports.createFlight = async (flightData) => {
  const query = `
    INSERT INTO flights
    (airline, flight_number,
     max_weight_domestic, max_volume_domestic,
     max_weight_international, max_volume_international)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const values = [
    flightData.airline,
    flightData.flight_number,
    flightData.max_weight_domestic,
    flightData.max_volume_domestic,
    flightData.max_weight_international,
    flightData.max_volume_international
  ];

  try {
    const [result] = await db.execute(query, values);
    return result;
  } catch (err) {
    throw err;
  }
};


