const cors = require('cors');
const config = require('../config');

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    if (origin === config.clientUrl) {
      return callback(null, true);
    }
    
    // For development, allow all origins
    if (config.nodeEnv === 'development') {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200
};

module.exports = cors(corsOptions);