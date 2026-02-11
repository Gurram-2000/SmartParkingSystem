const pool = require('../database/connection');
const logger = require('../utils/logger');

/**
 * Spot Allocation Service
 * Handles the algorithm for allocating parking spots to vehicles
 */
class SpotAllocationService {
  /**
   * Find an available spot for a vehicle
   * Uses a greedy algorithm with floor optimization:
   * 1. First, try to find a spot on the lowest floor
   * 2. Within the floor, prioritize spots closest to entry
   * 3. Returns null if no spot available
   * 
   * @param {string} vehicleType - Type of vehicle
   * @param {string} entryPoint - Entry point name
   * @returns {Promise<Object|null>} - Available parking spot or null
   */
  static async findAvailableSpot(vehicleType, entryPoint = 'Gate-A') {
    const query = `
      SELECT 
        id,
        floor,
        level,
        spot_number,
        vehicle_type,
        is_occupied,
        created_at
      FROM parking_spots
      WHERE 
        vehicle_type = $1 
        AND is_occupied = FALSE
      ORDER BY 
        floor ASC,
        level ASC,
        spot_number ASC
      LIMIT 1
    `;

    try {
      const result = await pool.query(query, [vehicleType]);
      
      if (result.rows.length === 0) {
        logger.warn(`No available spots for ${vehicleType}`, {
          vehicleType,
          entryPoint
        });
        return null;
      }

      logger.info(`Spot allocated: ${result.rows[0].spot_number}`, {
        vehicleType,
        spot: result.rows[0]
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Error finding available spot', { error: error.message });
      throw error;
    }
  }

  /**
   * Get parking spot statistics
   * @returns {Promise<Object>} - Statistics about parking spots
   */
  static async getSpotStatistics() {
    const query = `
      SELECT 
        vehicle_type,
        COUNT(*) as total_spots,
        SUM(CASE WHEN is_occupied = TRUE THEN 1 ELSE 0 END) as occupied_spots,
        SUM(CASE WHEN is_occupied = FALSE THEN 1 ELSE 0 END) as available_spots
      FROM parking_spots
      GROUP BY vehicle_type
    `;

    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error getting spot statistics', { error: error.message });
      throw error;
    }
  }

  /**
   * Get overall parking lot status
   * @returns {Promise<Object>} - Overall parking status
   */
  static async getParkingLotStatus() {
    const query = `
      SELECT 
        COUNT(*) as total_spots,
        SUM(CASE WHEN is_occupied = TRUE THEN 1 ELSE 0 END) as occupied_spots,
        SUM(CASE WHEN is_occupied = FALSE THEN 1 ELSE 0 END) as available_spots
      FROM parking_spots
    `;

    try {
      const result = await pool.query(query);
      const data = result.rows[0];
      
      return {
        totalSpots: parseInt(data.total_spots),
        occupiedSpots: parseInt(data.occupied_spots),
        availableSpots: parseInt(data.available_spots),
        occupancyRate: data.total_spots > 0 
          ? Math.round((parseInt(data.occupied_spots) / parseInt(data.total_spots)) * 100)
          : 0
      };
    } catch (error) {
      logger.error('Error getting parking lot status', { error: error.message });
      throw error;
    }
  }

  /**
   * Get detailed status by vehicle type
   * @returns {Promise<Object>} - Status broken down by vehicle type
   */
  static async getStatusByVehicleType() {
    const stats = await this.getSpotStatistics();
    const result = {};

    stats.forEach(stat => {
      result[stat.vehicle_type] = {
        total: parseInt(stat.total_spots),
        occupied: parseInt(stat.occupied_spots),
        available: parseInt(stat.available_spots),
        occupancyRate: stat.total_spots > 0 
          ? Math.round((parseInt(stat.occupied_spots) / parseInt(stat.total_spots)) * 100)
          : 0
      };
    });

    return result;
  }

  /**
   * Check if parking lot is at capacity
   * @returns {Promise<boolean>} - True if full
   */
  static async isAtCapacity() {
    const status = await this.getParkingLotStatus();
    return status.availableSpots === 0;
  }

  /**
   * Get nearest available spots on a floor
   * @param {number} floor - Floor number
   * @param {string} vehicleType - Vehicle type
   * @returns {Promise<Array>} - Array of available spots
   */
  static async getAvailableSpotsByFloor(floor, vehicleType) {
    const query = `
      SELECT 
        id,
        floor,
        level,
        spot_number,
        vehicle_type
      FROM parking_spots
      WHERE 
        floor = $1 
        AND vehicle_type = $2
        AND is_occupied = FALSE
      ORDER BY level ASC, spot_number ASC
    `;

    try {
      const result = await pool.query(query, [floor, vehicleType]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting available spots by floor', { error: error.message });
      throw error;
    }
  }
}

module.exports = SpotAllocationService;
