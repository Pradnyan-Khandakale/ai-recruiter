function errorHandler(error, req, res, next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal server error";

  // Handle MongoDB duplicate key error (E11000)
  if (error.code === 11000) {
    statusCode = 409;
    const field = Object.keys(error.keyPattern || {})[0] || "field";
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(error.details ? { details: error.details } : {})
    }
  });
}

module.exports = { errorHandler };
