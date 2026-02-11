// Constants for the parking system
module.exports = {
  VEHICLE_TYPES: {
    MOTORCYCLE: 'motorcycle',
    CAR: 'car',
    BUS: 'bus'
  },

  VEHICLE_TYPE_SIZES: {
    motorcycle: 1,
    car: 2,
    bus: 3
  },

  PARKING_STATUS: {
    AVAILABLE: 'available',
    OCCUPIED: 'occupied',
    RESERVED: 'reserved',
    MAINTENANCE: 'maintenance'
  },

  TRANSACTION_STATUS: {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },

  ERROR_CODES: {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    SERVER_ERROR: 'SERVER_ERROR',
    UNAVAILABLE: 'UNAVAILABLE'
  },

  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    CONFLICT: 409,
    SERVER_ERROR: 500
  },

  PARKING_PRICING: {
    motorcycle: 1,    // $1 per 15 minutes
    car: 2,          // $2 per 15 minutes
    bus: 3           // $3 per 15 minutes
  },

  TIME_UNIT: 15 // minutes
};
