const ParkingService = require('../services/parkingService');
const ResponseFormatter = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Report Controller
 * Handles report generation and analytics
 */
class ReportController {
  /**
   * Get daily revenue report
   * GET /api/reports/daily-revenue
   */
  static async getDailyRevenue(req, res, next) {
    try {
      const { date } = req.query;

      logger.info('Daily revenue report requested', { date });

      const history = await ParkingService.getParkingHistory({ status: 'completed' });

      const report = {
        date: date || new Date().toISOString().split('T')[0],
        totalTransactions: history.length,
        totalRevenue: history.reduce((sum, t) => sum + (t.parking_fee || 0), 0),
        averageFee: history.length > 0 
          ? (history.reduce((sum, t) => sum + (t.parking_fee || 0), 0) / history.length).toFixed(2)
          : 0,
        transactionsByVehicleType: {
          motorcycle: history.filter(t => t.vehicle_type === 'motorcycle').length,
          car: history.filter(t => t.vehicle_type === 'car').length,
          bus: history.filter(t => t.vehicle_type === 'bus').length
        }
      };

      return ResponseFormatter.success(
        res,
        report,
        'Daily revenue report retrieved successfully',
        200
      );

    } catch (error) {
      logger.error('Error generating daily revenue report', { error: error.message });
      return ResponseFormatter.serverError(res, 'Failed to generate report', error.message);
    }
  }

  /**
   * Get vehicle type statistics
   * GET /api/reports/vehicle-stats
   */
  static async getVehicleStatistics(req, res, next) {
    try {
      logger.info('Vehicle statistics report requested');

      const history = await ParkingService.getParkingHistory({});

      const stats = {
        totalVehicles: new Set(history.map(t => t.license_plate)).size,
        byType: {
          motorcycle: {
            count: history.filter(t => t.vehicle_type === 'motorcycle').length,
            totalFees: history
              .filter(t => t.vehicle_type === 'motorcycle')
              .reduce((sum, t) => sum + (t.parking_fee || 0), 0)
          },
          car: {
            count: history.filter(t => t.vehicle_type === 'car').length,
            totalFees: history
              .filter(t => t.vehicle_type === 'car')
              .reduce((sum, t) => sum + (t.parking_fee || 0), 0)
          },
          bus: {
            count: history.filter(t => t.vehicle_type === 'bus').length,
            totalFees: history
              .filter(t => t.vehicle_type === 'bus')
              .reduce((sum, t) => sum + (t.parking_fee || 0), 0)
          }
        }
      };

      return ResponseFormatter.success(
        res,
        stats,
        'Vehicle statistics retrieved successfully',
        200
      );

    } catch (error) {
      logger.error('Error generating vehicle statistics', { error: error.message });
      return ResponseFormatter.serverError(res, 'Failed to generate report', error.message);
    }
  }
}

module.exports = ReportController;
