function errorHandler(error, req, res, next) {
  // TODO: Include error.details in the error payload.
  res.status(error.statusCode || 500).json({
    success: false,
    error: { message: error.message || "Internal server error" }
  });
}

module.exports = { errorHandler };
