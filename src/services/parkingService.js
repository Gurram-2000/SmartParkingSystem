const pool = require('../database/connection');
const FeeService = require('./feeService');
const SpotAllocationService = require('./spotAllocationService');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Core Parking Service
 * Handles check-in, check-out, and parking operations
 */
class ParkingService {
  /**
   * Check-in a vehicle
   * @param {string} licensePlate - Vehicle license plate
   * @param {string} vehicleType - Type of vehicle
   * @param {string} entryPoint - Entry gate/point
   * @param {string} ownerName - Vehicle owner name
   * @returns {Promise<Object>} - Check-in details with allocated spot
   */
  static async checkInVehicle(licensePlate, vehicleType, entryPoint = 'Gate-A', ownerName = null) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if vehicle already exists and is parked
      const existingVehicle = await client.query(
        `SELECT id FROM vehicles WHERE license_plate = $1`,
        [licensePlate]
      );

      let vehicleId;

      if (existingVehicle.rows.length > 0) {
        vehicleId = existingVehicle.rows[0].id;

        // Check if vehicle is already parked
        const activeTransaction = await client.query(
          `SELECT id FROM parking_transactions 
           WHERE vehicle_id = $1 AND status = 'active'`,
          [vehicleId]
        );

        if (activeTransaction.rows.length > 0) {
          await client.query('ROLLBACK');
          const error = new Error('Vehicle is already parked');
          error.statusCode = 409;
          error.error = `Vehicle with license plate ${licensePlate} is already in the parking lot`;
          throw error;
        }
      } else {
        // Create new vehicle
        const newVehicle = await client.query(
          `INSERT INTO vehicles (license_plate, vehicle_type, owner_name) 
           VALUES ($1, $2, $3) RETURNING id`,
          [licensePlate, vehicleType, ownerName]
        );
        vehicleId = newVehicle.rows[0].id;
      }

      // Find available parking spot
      const spotQuery = `
        SELECT id, floor, level, spot_number, vehicle_type
        FROM parking_spots
        WHERE vehicle_type = $1 AND is_occupied = FALSE
        ORDER BY floor ASC, level ASC, spot_number ASC
        LIMIT 1
        FOR UPDATE
      `;

      const spotResult = await client.query(spotQuery, [vehicleType]);

      if (spotResult.rows.length === 0) {
        await client.query('ROLLBACK');
        const error = new Error('No parking spots available for this vehicle type');
        error.statusCode = 409;
        error.error = 'Cannot allocate spot - parking lot full for this vehicle type';
        throw error;
      }

      const spot = spotResult.rows[0];
      const entryTime = new Date();

      // Update spot as occupied
      await client.query(
        `UPDATE parking_spots 
         SET is_occupied = TRUE, current_vehicle_id = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [vehicleId, spot.id]
      );

      // Create transaction record
      const transaction = await client.query(
        `INSERT INTO parking_transactions 
         (id, vehicle_id, spot_id, entry_time, status)
         VALUES ($1, $2, $3, $4, 'active')
         RETURNING id, vehicle_id, spot_id, entry_time, status`,
        [uuidv4(), vehicleId, spot.id, entryTime]
      );

      await client.query('COMMIT');

      logger.info('Vehicle checked in successfully', {
        licensePlate,
        vehicleType,
        spotNumber: spot.spot_number,
        transactionId: transaction.rows[0].id
      });

      return {
        transactionId: transaction.rows[0].id,
        licensePlate,
        spotNumber: spot.spot_number,
        entryTime: entryTime.toISOString(),
        spotDetails: {
          floor: spot.floor,
          level: spot.level,
          spotType: spot.vehicle_type,
          price: spot.vehicle_type === 'motorcycle' ? 1 : spot.vehicle_type === 'car' ? 2 : 3
        }
      };

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Check-in error', {
        error: error.message,
        licensePlate,
        vehicleType
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Check-out a vehicle
   * @param {string} licensePlate - Vehicle license plate
   * @returns {Promise<Object>} - Check-out details with fee
   */
  static async checkOutVehicle(licensePlate) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Find vehicle
      const vehicleResult = await client.query(
        `SELECT id, vehicle_type FROM vehicles WHERE license_plate = $1`,
        [licensePlate]
      );

      if (vehicleResult.rows.length === 0) {
        await client.query('ROLLBACK');
        const error = new Error('Vehicle not found');
        error.statusCode = 404;
        error.error = `Vehicle with license plate ${licensePlate} is not currently parked`;
        throw error;
      }

      const vehicle = vehicleResult.rows[0];

      // Find active transaction
      const transactionResult = await client.query(
        `SELECT id, vehicle_id, spot_id, entry_time, status
         FROM parking_transactions
         WHERE vehicle_id = $1 AND status = 'active'
         FOR UPDATE`,
        [vehicle.id]
      );

      if (transactionResult.rows.length === 0) {
        await client.query('ROLLBACK');
        const error = new Error('No active parking session found');
        error.statusCode = 404;
        error.error = `Vehicle with license plate ${licensePlate} is not currently parked`;
        throw error;
      }

      const transaction = transactionResult.rows[0];
      const exitTime = new Date();

      // Calculate fee
      const feeDetails = FeeService.calculateFee(
        new Date(transaction.entry_time),
        exitTime,
        vehicle.vehicle_type
      );

      // Get spot details
      const spotResult = await client.query(
        `SELECT spot_number FROM parking_spots WHERE id = $1`,
        [transaction.spot_id]
      );

      const spot = spotResult.rows[0];

      // Update transaction
      await client.query(
        `UPDATE parking_transactions
         SET exit_time = $1, parking_fee = $2, status = 'completed', updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [exitTime, feeDetails.totalFee, transaction.id]
      );

      // Free up the spot
      await client.query(
        `UPDATE parking_spots
         SET is_occupied = FALSE, current_vehicle_id = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [transaction.spot_id]
      );

      await client.query('COMMIT');

      logger.info('Vehicle checked out successfully', {
        licensePlate,
        spotNumber: spot.spot_number,
        fee: feeDetails.totalFee,
        duration: feeDetails.durationFormatted,
        transactionId: transaction.id
      });

      return {
        transactionId: transaction.id,
        licensePlate,
        spotNumber: spot.spot_number,
        entryTime: transaction.entry_time,
        exitTime: exitTime.toISOString(),
        duration: feeDetails.durationFormatted,
        parkingFee: feeDetails.totalFee,
        currency: feeDetails.currency,
        durationMinutes: feeDetails.durationMinutes
      };

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Check-out error', {
        error: error.message,
        licensePlate
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get vehicle parking status
   * @param {string} licensePlate - Vehicle license plate
   * @returns {Promise<Object>} - Vehicle status
   */
  static async getVehicleStatus(licensePlate) {
    try {
      const result = await pool.query(
        `SELECT v.id, v.license_plate, v.vehicle_type, pt.id as transaction_id, 
                pt.entry_time, pt.status, ps.spot_number
         FROM vehicles v
         LEFT JOIN parking_transactions pt ON v.id = pt.vehicle_id AND pt.status = 'active'
         LEFT JOIN parking_spots ps ON pt.spot_id = ps.id
         WHERE v.license_plate = $1`,
        [licensePlate]
      );

      if (result.rows.length === 0) {
        const error = new Error('Vehicle not found');
        error.statusCode = 404;
        error.error = `No vehicle found with license plate ${licensePlate}`;
        throw error;
      }

      const vehicle = result.rows[0];

      if (!vehicle.transaction_id) {
        return {
          licensePlate: vehicle.license_plate,
          parked: false,
          message: 'Vehicle is not currently parked'
        };
      }

      // Calculate current estimated fee
      const feeEstimate = FeeService.estimateFee(
        new Date(vehicle.entry_time),
        vehicle.vehicle_type
      );

      return {
        licensePlate: vehicle.license_plate,
        parked: true,
        spotNumber: vehicle.spot_number,
        entryTime: vehicle.entry_time,
        duration: feeEstimate.durationFormatted,
        durationMinutes: feeEstimate.durationMinutes,
        estimatedFee: feeEstimate.totalFee,
        currency: feeEstimate.currency
      };

    } catch (error) {
      logger.error('Error getting vehicle status', {
        error: error.message,
        licensePlate
      });
      throw error;
    }
  }

  /**
   * Get parking lot status
   * @returns {Promise<Object>} - Overall parking status
   */
  static async getParkingStatus() {
    try {
      const lotStatus = await SpotAllocationService.getParkingLotStatus();
      const typeStatus = await SpotAllocationService.getStatusByVehicleType();

      return {
        ...lotStatus,
        spotsByType: typeStatus
      };
    } catch (error) {
      logger.error('Error getting parking status', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get parking history/transactions
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} - List of transactions
   */
  static async getParkingHistory(filters = {}) {
    try {
      let query = `
        SELECT 
          pt.id, 
          v.license_plate, 
          v.vehicle_type,
          ps.spot_number,
          pt.entry_time, 
          pt.exit_time, 
          pt.parking_fee,
          pt.status,
          pt.created_at
        FROM parking_transactions pt
        JOIN vehicles v ON pt.vehicle_id = v.id
        LEFT JOIN parking_spots ps ON pt.spot_id = ps.id
        WHERE 1=1
      `;

      const params = [];

      if (filters.status) {
        query += ` AND pt.status = $${params.length + 1}`;
        params.push(filters.status);
      }

      if (filters.vehicleType) {
        query += ` AND v.vehicle_type = $${params.length + 1}`;
        params.push(filters.vehicleType);
      }

      query += ` ORDER BY pt.created_at DESC LIMIT 100`;

      const result = await pool.query(query, params);
      return result.rows;

    } catch (error) {
      logger.error('Error getting parking history', {
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = ParkingService;
