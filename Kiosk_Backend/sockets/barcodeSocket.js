// sockets/barcodeSocket.js
const readline = require('readline');
const { getCargoByVCTNumber } = require('../services/cargoService');
const { io } = require('../server');

function listenToBarcodeInput() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('📦 Waiting for barcode scans...');

  rl.on('line', async (barcode) => {
    const vctNumber = barcode.trim();
    console.log(`📥 Scanned: ${vctNumber}`);

    try {
      const cargoData = await getCargoByVCTNumber(vctNumber);
      if (cargoData) {
        io.emit('cargo_data', {
          vct_number: vctNumber,
          data: cargoData
        });
      } else {
        io.emit('cargo_data', {
          vct_number: vctNumber,
          error: 'Cargo not found'
        });
      }
    } catch (error) {
      console.error('❌ Error processing barcode:', error.message);
      io.emit('cargo_data', {
        error: 'Server error while fetching cargo'
      });
    }
  });
}

module.exports = { listenToBarcodeInput };
