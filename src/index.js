require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./database/connection');
const runMigrations = require('./database/migrations');
const parkingRoutes = require('./routes/parkingRoutes');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Middleware
 */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

/**
 * Routes
 */
app.use('/api/parking', parkingRoutes);

/**
 * Root endpoint
 */
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Smart Parking System API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      checkIn: 'POST /api/parking/check-in',
      checkOut: 'POST /api/parking/check-out',
      parkingStatus: 'GET /api/parking/status',
      vehicleStatus: 'GET /api/parking/vehicle/:licensePlate',
      history: 'GET /api/parking/history',
      dailyRevenue: 'GET /api/parking/reports/daily-revenue',
      vehicleStats: 'GET /api/parking/reports/vehicle-stats',
      health: 'GET /api/parking/health'
    }
  });
});

/**
 * Error handling
 */
app.use(errorHandler);

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: 'Endpoint not found',
    error: `${req.method} ${req.path} does not exist`,
    timestamp: new Date().toISOString()
  });
});

/**
 * Database and server initialization
 */
const startServer = async () => {
  try {
    // Test database connection
    const client = await pool.connect();
    logger.info('Database connection successful');
    client.release();

    // Run migrations
    await runMigrations();

    // Start server
    app.listen(PORT, () => {
      logger.info(`Smart Parking System server running on port ${PORT}`);
      console.log(`\n✓ Server running at http://localhost:${PORT}`);
      console.log(`✓ API available at http://localhost:${PORT}/api/parking`);
      console.log(`\n🅿️  Smart Parking System v1.0.0\n`);
    });

  } catch (error) {
    logger.error('Failed to start server', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

/**
 * Graceful shutdown
 */
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
