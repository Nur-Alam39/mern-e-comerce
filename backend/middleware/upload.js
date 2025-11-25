const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Use absolute uploads directory relative to this file so server works regardless of cwd
const uploadDir = path.join(__dirname, '..', 'uploads');
// Ensure uploads directory exists
try {
  fs.mkdirSync(uploadDir, { recursive: true });
} catch (e) {
  // ignore
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // accept images only
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter });
module.exports = upload;
