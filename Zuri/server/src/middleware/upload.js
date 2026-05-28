const multer = require('multer');
const path = require('path');
const fs = require('fs');
const supabaseStorageService = require('../services/supabaseStorage');

const useSupabase = process.env.USE_SUPABASE === 'true' || process.env.NODE_ENV === 'production';

// Ensure uploads directory exists (for local development)
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for memory storage (needed for Supabase)
const memoryStorage = multer.memoryStorage();

// Configure multer for disk storage (local development)
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const basename = path.basename(file.originalname, extension);
    cb(null, `${basename}-${uniqueSuffix}${extension}`);
  }
});

// File filter to allow only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Upload configuration
const upload = multer({
  storage: useSupabase ? memoryStorage : diskStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter
});

// Custom upload handler that uses Supabase Storage when enabled
const handleUpload = async (req, res, next) => {
  if (!useSupabase) {
    // Use original multer middleware for local development
    return upload.single('photo')(req, res, next);
  }

  // Use Supabase Storage for production
  upload.single('photo')(req, res, async (err) => {
    if (err) {
      return handleUploadErrors(err, req, res, next);
    }

    if (!req.file) {
      return next();
    }

    try {
      // Upload to Supabase Storage
      const result = await supabaseStorageService.uploadFile(req.file, 'uploads', 'photos/');
      
      if (!result.success) {
        return res.status(500).json({ error: 'Failed to upload file to storage', details: result.error });
      }

      // Attach Supabase file info to request
      req.file.supabasePath = result.path;
      req.file.supabaseUrl = result.url;
      req.file.filename = result.path; // For backward compatibility

      next();
    } catch (error) {
      console.error('[UPLOAD] Supabase upload error:', error);
      return res.status(500).json({ error: 'Failed to upload file', details: error.message });
    }
  });
};

// Error handling middleware for multer
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
  }

  if (err.message === 'Only image files are allowed!') {
    return res.status(400).json({ error: err.message });
  }

  next(err);
};

module.exports = upload;
module.exports.handleUpload = handleUpload;
module.exports.handleUploadErrors = handleUploadErrors;