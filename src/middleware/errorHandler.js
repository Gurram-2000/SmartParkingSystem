const logger = require('../utils/logger');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Handle validation errors
  if (err.isJoi) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Validation error',
      error: err.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      })),
      timestamp: new Date().toISOString()
    });
  }

  // Handle database errors
  if (err.code === 'ECONNREFUSED') {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Database connection failed',
      error: 'Unable to connect to database',
      timestamp: new Date().toISOString()
    });
  }

  // Handle not found errors
  if (err.statusCode === 404) {
    return res.status(404).json({
      success: false,
      statusCode: 404,
      message: err.message,
      error: err.error,
      timestamp: new Date().toISOString()
    });
  }

  // Handle conflict errors
  if (err.statusCode === 409) {
    return res.status(409).json({
      success: false,
      statusCode: 409,
      message: err.message,
      error: err.error,
      timestamp: new Date().toISOString()
    });
  }

  // Handle custom application errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
      error: err.error,
      timestamp: new Date().toISOString()
    });
  }

  // Generic server error
  res.status(500).json({
    success: false,
    statusCode: 500,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
};

module.exports = errorHandler;
