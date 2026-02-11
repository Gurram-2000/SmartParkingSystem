// Standard response formatter for all API responses
class ResponseFormatter {
  static success(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      statusCode,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  static error(res, message, error, statusCode = 400, errorCode = null) {
    return res.status(statusCode).json({
      success: false,
      statusCode,
      message,
      error: error || message,
      errorCode,
      timestamp: new Date().toISOString()
    });
  }

  static paginated(res, data, pagination, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      statusCode,
      message,
      data,
      pagination,
      timestamp: new Date().toISOString()
    });
  }

  static created(res, data, message = 'Resource created successfully') {
    return this.success(res, data, message, 201);
  }

  static notFound(res, message = 'Resource not found') {
    return this.error(res, message, message, 404);
  }

  static badRequest(res, message = 'Bad request') {
    return this.error(res, message, message, 400);
  }

  static conflict(res, message = 'Conflict') {
    return this.error(res, message, message, 409);
  }

  static serverError(res, message = 'Internal server error', error = null) {
    return this.error(res, message, error || message, 500);
  }

  static unauthorized(res, message = 'Unauthorized') {
    return this.error(res, message, message, 401);
  }
}

module.exports = ResponseFormatter;
