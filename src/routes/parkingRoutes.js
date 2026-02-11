const express = require('express');
const router = express.Router();
const ParkingController = require('../controllers/parkingController');
const ReportController = require('../controllers/reportController');
const { validate, schemas } = require('../middleware/validation');

/**
 * Parking API Routes
 */

// Health check
router.get('/health', ParkingController.healthCheck);

/**
 * Parking Operations
 */

// Check-in vehicle
router.post(
  '/check-in',
  validate(schemas.checkIn),
  ParkingController.checkIn
);

// Check-out vehicle
router.post(
  '/check-out',
  validate(schemas.checkOut),
  ParkingController.checkOut
);

// Get parking status
router.get('/status', ParkingController.getParkingStatus);

// Get vehicle status
router.get('/vehicle/:licensePlate', ParkingController.getVehicleStatus);

// Get parking history
router.get('/history', ParkingController.getParkingHistory);

/**
 * Reports
 */

// Daily revenue report
router.get('/reports/daily-revenue', ReportController.getDailyRevenue);

// Vehicle statistics
router.get('/reports/vehicle-stats', ReportController.getVehicleStatistics);

module.exports = router;
