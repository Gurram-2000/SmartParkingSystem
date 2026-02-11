const ParkingService = require('../services/parkingService');
const ResponseFormatter = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Parking Controller
 * Handles HTTP requests for parking operations
 */
class ParkingController {
  /**
   * Check-in a vehicle
   * POST /api/parking/check-in
   */
  static async checkIn(req, res, next) {
    try {
      const { licensePlate, vehicleType, entryPoint, ownerName } = req.validatedBody;

      logger.info('Check-in request received', { licensePlate, vehicleType });

      const result = await ParkingService.checkInVehicle(
        licensePlate,
        vehicleType,
        entryPoint,
        ownerName
      );

      return ResponseFormatter.success(
        res,
        result,
        'Vehicle checked in successfully',
        200
      );

    } catch (error) {
      logger.error('Check-in error', { error: error.message });

      if (error.statusCode === 409) {
        return ResponseFormatter.conflict(res, error.message);
      }

      if (error.statusCode === 400) {
        return ResponseFormatter.badRequest(res, error.message);
      }

      return ResponseFormatter.serverError(res, 'Check-in failed', error.message);
    }
  }

  /**
   * Check-out a vehicle
   * POST /api/parking/check-out
   */
  static async checkOut(req, res, next) {
    try {
      const { licensePlate } = req.validatedBody;

      logger.info('Check-out request received', { licensePlate });

      const result = await ParkingService.checkOutVehicle(licensePlate);

      return ResponseFormatter.success(
        res,
        result,
        'Vehicle checked out successfully',
        200
      );

    } catch (error) {
      logger.error('Check-out error', { error: error.message });

      if (error.statusCode === 404) {
        return ResponseFormatter.notFound(res, error.message);
      }

      if (error.statusCode === 409) {
        return ResponseFormatter.conflict(res, error.message);
      }

      return ResponseFormatter.serverError(res, 'Check-out failed', error.message);
    }
  }

  /**
   * Get parking lot status
   * GET /api/parking/status
   */
  static async getParkingStatus(req, res, next) {
    try {
      logger.info('Parking status request received');

      const status = await ParkingService.getParkingStatus();

      return ResponseFormatter.success(
        res,
        status,
        'Parking status retrieved successfully',
        200
      );

    } catch (error) {
      logger.error('Error getting parking status', { error: error.message });
      return ResponseFormatter.serverError(res, 'Failed to retrieve parking status', error.message);
    }
  }

  /**
   * Get vehicle status
   * GET /api/parking/vehicle/:licensePlate
   */
  static async getVehicleStatus(req, res, next) {
    try {
      const { licensePlate } = req.params;

      logger.info('Vehicle status request received', { licensePlate });

      const status = await ParkingService.getVehicleStatus(licensePlate);

      return ResponseFormatter.success(
        res,
        status,
        'Vehicle status retrieved successfully',
        200
      );

    } catch (error) {
      logger.error('Error getting vehicle status', { error: error.message });

      if (error.statusCode === 404) {
        return ResponseFormatter.notFound(res, error.message);
      }

      return ResponseFormatter.serverError(res, 'Failed to retrieve vehicle status', error.message);
    }
  }

  /**
   * Get parking history
   * GET /api/parking/history
   */
  static async getParkingHistory(req, res, next) {
    try {
      const { status, vehicleType } = req.query;

      logger.info('Parking history request received', { status, vehicleType });

      const history = await ParkingService.getParkingHistory({
        status,
        vehicleType
      });

      return ResponseFormatter.success(
        res,
        history,
        'Parking history retrieved successfully',
        200
      );

    } catch (error) {
      logger.error('Error getting parking history', { error: error.message });
      return ResponseFormatter.serverError(res, 'Failed to retrieve parking history', error.message);
    }
  }

  /**
   * Health check endpoint
   * GET /api/parking/health
   */
  static async healthCheck(req, res, next) {
    return ResponseFormatter.success(
      res,
      { status: 'OK', timestamp: new Date().toISOString() },
      'Service is running',
      200
    );
  }
}

module.exports = ParkingController;
