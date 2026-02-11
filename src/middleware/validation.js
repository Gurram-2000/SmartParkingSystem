const Joi = require('joi');
const { VEHICLE_TYPES } = require('../utils/constants');

/**
 * Validation schemas for parking operations
 */
const schemas = {
  checkIn: Joi.object({
    licensePlate: Joi.string()
      .uppercase()
      .pattern(/^[A-Z0-9-]{1,20}$/)
      .required()
      .messages({
        'string.pattern.base': 'License plate must contain only alphanumeric characters and hyphens',
        'any.required': 'License plate is required'
      }),
    vehicleType: Joi.string()
      .valid(...Object.values(VEHICLE_TYPES))
      .required()
      .messages({
        'any.only': `Vehicle type must be one of: ${Object.values(VEHICLE_TYPES).join(', ')}`,
        'any.required': 'Vehicle type is required'
      }),
    entryPoint: Joi.string()
      .max(50)
      .optional(),
    ownerName: Joi.string()
      .max(100)
      .optional()
  }),

  checkOut: Joi.object({
    licensePlate: Joi.string()
      .uppercase()
      .pattern(/^[A-Z0-9-]{1,20}$/)
      .required()
      .messages({
        'string.pattern.base': 'License plate must contain only alphanumeric characters and hyphens',
        'any.required': 'License plate is required'
      })
  }),

  getParkingStatus: Joi.object({
    vehicleType: Joi.string()
      .valid(...Object.values(VEHICLE_TYPES))
      .optional(),
    floor: Joi.number()
      .integer()
      .positive()
      .optional()
  })
};

/**
 * Validation middleware
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Validation error',
        error: details,
        timestamp: new Date().toISOString()
      });
    }

    req.validatedBody = value;
    next();
  };
};

module.exports = {
  validate,
  schemas
};
