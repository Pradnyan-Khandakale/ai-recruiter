const fs = require("fs");

async function errorHandler(error, req, res, next) {
  // Clean up rejected uploads written to disk during this request
  if (req.file && req.file.path) {
    try {
      await fs.promises.unlink(req.file.path);
    } catch (cleanupErr) {
      if (cleanupErr.code !== "ENOENT") {
        console.error("Failed to clean up uploaded file:", cleanupErr);
      }
    }
  } else if (req.files) {
    const filesToClean = Array.isArray(req.files)
      ? req.files
      : Object.values(req.files).flat();
    for (const file of filesToClean) {
      if (file && file.path) {
        try {
          await fs.promises.unlink(file.path);
        } catch (cleanupErr) {
          if (cleanupErr.code !== "ENOENT") {
            console.error("Failed to clean up uploaded file:", cleanupErr);
          }
        }
      }
    }
  }

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
