function errorHandler(error, req, res, next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal server error";

  // Handle Multer errors
  if (error.code === "LIMIT_FILE_SIZE") {
    statusCode = 400;
    message = "File size exceeds the 5MB limit";
  } else if (error.name === "MulterError") {
    statusCode = 400;
    message = error.message;
  }

  // Handle MongoDB duplicate key error (E11000)
  if (error.code === 11000) {
    statusCode = 409;
    const field = Object.keys(error.keyPattern || {})[0] || "record";
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (error.name === "CastError") {
    statusCode = 400;
    message = `Invalid ID format for ${error.path || "resource"}`;
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
