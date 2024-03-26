const winston = require('winston');

// Create a logger with a default Console transport
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.colorize()),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

module.exports = logger;
