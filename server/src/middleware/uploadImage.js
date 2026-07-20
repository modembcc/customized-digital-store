const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const UPLOAD_DIR = path.join(__dirname, '../../uploads');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename(req, file, cb) {
    cb(null, `${crypto.randomUUID()}${path.extname(file.originalname)}`);
  },
});

function fileFilter(req, file, cb) {
  // Reject silently rather than error — the controller treats a missing
  // req.file as "no valid image was uploaded" and responds 400 either way.
  cb(null, file.mimetype.startsWith('image/'));
}

// Only one file, under the "image" field — a second file for that field
// (or any other field) is rejected by multer as a MulterError, which
// errorHandler maps to a 400.
const uploadImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
}).single('image');

module.exports = uploadImage;
module.exports.UPLOAD_DIR = UPLOAD_DIR;
