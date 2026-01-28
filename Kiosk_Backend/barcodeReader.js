const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const pool = require('./db');

function extractPNR(data) {
  const detailedPattern = /M1[A-Z]+\/[A-Z]+\s+([A-Z0-9]{6,7})\s/;
  let match = data.match(detailedPattern);
  if (match) return match[1];

  const simplePattern = /([A-Z0-9]{6,7})/;
  match = data.match(simplePattern);
  if (match) return match[1];

  return null;
}

async function getPassengerDetails(pnr) {
  const [rows] = await pool.query("SELECT * FROM passenger_boarding WHERE p_pnr = ?", [pnr]);
  return rows;
}

function startBarcodeReader(io) {
  const port = new SerialPort({ path: process.env.COM_PORT, baudRate: parseInt(process.env.BAUD_RATE) });
  const parser = port.pipe(new ReadlineParser());

  parser.on('data', async line => {
    console.log('Barcode Data:', line);
    const pnr = extractPNR(line);

    if (!pnr) {
      io.emit('barcode_data', { error: 'Invalid barcode data' });
      return;
    }

    try {
      const details = await getPassengerDetails(pnr);
      if (details.length) {
        io.emit('barcode_data', {
          barcode_data: line,
          info: { pnr },
          passenger_details: details
        });
      } else {
        io.emit('barcode_data', {
          barcode_data: line,
          info: { pnr },
          error: 'Passenger not found'
        });
      }
    } catch (err) {
      console.error('DB Error:', err);
      io.emit('barcode_data', { error: 'Database error' });
    }
  });

  port.on('error', err => {
    console.error('Serial Port Error:', err.message);
    io.emit('barcode_data', { error: 'Scanner Error: ' + err.message });
  });
}

module.exports = startBarcodeReader;
