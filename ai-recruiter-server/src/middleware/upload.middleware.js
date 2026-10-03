const path = require("path");
const multer = require("multer");

const uploadDir = path.join(__dirname, "..", "..", "uploads");

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    // TODO: Store the file as `${Date.now()}-${sanitizedOriginalName}`.
    cb(null, file.originalname);
  }
});

const resumeUpload = multer({
  storage
  // TODO: Apply the 5 MB size limit and a fileFilter that only accepts application/pdf.
});

module.exports = { resumeUpload };
