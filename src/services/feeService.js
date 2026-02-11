const { PARKING_PRICING, TIME_UNIT } = require('../utils/constants');

/**
 * Fee Calculation Service
 * Calculates parking fees based on vehicle type and duration
 */
class FeeService {
  /**
   * Calculate parking fee
   * @param {Date} entryTime - Entry timestamp
   * @param {Date} exitTime - Exit timestamp
   * @param {string} vehicleType - Type of vehicle
   * @returns {Object} - Fee calculation details
   */
  static calculateFee(entryTime, exitTime, vehicleType) {
    if (!entryTime || !exitTime) {
      throw new Error('Entry and exit times are required');
    }

    if (!(entryTime instanceof Date) || !(exitTime instanceof Date)) {
      throw new Error('Entry and exit times must be Date objects');
    }

    if (exitTime <= entryTime) {
      throw new Error('Exit time must be after entry time');
    }

    // Calculate duration in minutes
    const durationMs = exitTime.getTime() - entryTime.getTime();
    const durationMinutes = Math.ceil(durationMs / (1000 * 60));

    // Calculate number of time units (15-minute intervals)
    // Round up to nearest unit
    const units = Math.ceil(durationMinutes / TIME_UNIT);

    // Get rate for vehicle type
    const ratePerUnit = PARKING_PRICING[vehicleType] || PARKING_PRICING.car;

    // Calculate total fee
    const totalFee = units * ratePerUnit;

    return {
      durationMinutes,
      durationFormatted: this.formatDuration(durationMinutes),
      units,
      ratePerUnit,
      totalFee: parseFloat(totalFee.toFixed(2)),
      currency: 'USD'
    };
  }

  /**
   * Format duration in human-readable format
   * @param {number} minutes - Duration in minutes
   * @returns {string} - Formatted duration
   */
  static formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    const parts = [];
    if (hours > 0) {
      parts.push(`${hours}h`);
    }
    if (mins > 0) {
      parts.push(`${mins}m`);
    }

    return parts.length > 0 ? parts.join(' ') : '0m';
  }

  /**
   * Estimate fee for current parking duration
   * @param {Date} entryTime - Entry timestamp
   * @param {string} vehicleType - Type of vehicle
   * @returns {Object} - Estimated fee
   */
  static estimateFee(entryTime, vehicleType) {
    const now = new Date();
    return this.calculateFee(entryTime, now, vehicleType);
  }
}

module.exports = FeeService;
