const db = require('../db');
const flightModel = require('../models/flightModel');
const airportCountries = require('../utils/airportCountryMap');

// Get all flights
exports.getFlights = async (req, res) => {
  try {
    const flights = await flightModel.getAllFlights();
    res.json(flights);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching flights' });
  }
};

// Create a new flight
exports.createFlight = async (req, res) => {
  try {
    const {
      airline,
      flight_number,
      max_weight_domestic,
      max_volume_domestic,
      max_weight_international,
      max_volume_international
    } = req.body;

    const newFlight = {
      airline,
      flight_number,
      max_weight_domestic,
      max_volume_domestic,
      max_weight_international,
      max_volume_international
    };

    await flightModel.createFlight(newFlight);
    res.status(201).json({ message: 'Flight created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating flight' });
  }
};



// Get a flight by flight number and return baggage info from DB
exports.getFlightByNumber = async (req, res) => {
  const { flightNumber } = req.params;

  try {
    const [rows] = await db.execute(
      'SELECT * FROM flights WHERE flight_number = ? LIMIT 1',
      [flightNumber]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Flight not found' });
    }

    const flight = rows[0];

    const baggageLimit = (flight.flight_type === 'International')
      ? {
          maxWeight: flight.max_weight_international,
          maxVolume: flight.max_volume_international,
        }
      : {
          maxWeight: flight.max_weight_domestic,
          maxVolume: flight.max_volume_domestic,
        };

    res.json({
      id: flight.id,
      passengerName: `${flight.first_name} ${flight.last_name}`,
      airline: flight.airline,
      flightNumber: flight.flight_number,
      source: flight.source,
      destination: flight.destination,
      flightType: flight.flight_type,
      createdAt: flight.created_at,
      baggageLimit,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a flight
exports.deleteFlight = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.execute('DELETE FROM flights WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Flight not found' });
    }
    res.json({ message: 'Flight deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting flight' });
  }
};

// Update flight by ID
exports.updateFlight = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const fields = Object.keys(updateData)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = Object.values(updateData);

    const sql = `UPDATE flights SET ${fields} WHERE id = ?`;

    const [result] = await db.execute(sql, [...values, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Flight not found' });
    }

    res.json({ message: 'Flight updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating flight' });
  }
};

exports.getFlightsByAirline = async (req, res) => {
  const { airline } = req.params;
  try {
    const [flights] = await db.execute('SELECT * FROM flights WHERE airline = ?', [airline]);
    res.json(flights);
  } catch (error) {
    console.error('Error fetching flights by airline:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
