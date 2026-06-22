const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { isAuthenticated } = require('../middleware/auth');


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    
    
    cb(null, file.originalname);
  }
});


const upload = multer({ storage: storage });

module.exports = function(db) {

  // Upload page
  router.get('/upload', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    let uploads = [];

    try {
      uploads = db.prepare('SELECT * FROM uploads WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    } catch (err) {
      console.error('[Upload] Error loading uploads:', err.message);
    }

    res.render('upload', {
      title: 'Upload Files - SecureTrust Bank',
      uploads: uploads,
      user: req.session,
      success: null,
      error: null
    });
  });

  // Handle file upload
  router.post('/upload', isAuthenticated, upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.render('upload', {
        title: 'Upload Files - SecureTrust Bank',
        uploads: [],
        user: req.session,
        success: null,
        error: 'No file selected.'
      });
    }

    const userId = req.session.userId;

    try {
      // Track upload in database
      db.prepare(`INSERT INTO uploads (user_id, filename, original_name, file_path, mime_type, size)
        VALUES (?, ?, ?, ?, ?, ?)`)
        .run(userId, req.file.filename, req.file.originalname, req.file.path, req.file.mimetype, req.file.size);

      const uploads = db.prepare('SELECT * FROM uploads WHERE user_id = ? ORDER BY created_at DESC').all(userId);

      res.render('upload', {
        title: 'Upload Files - SecureTrust Bank',
        uploads: uploads,
        user: req.session,
        success: `File "${req.file.originalname}" uploaded successfully.`,
        error: null
      });
    } catch (err) {
      res.render('upload', {
        title: 'Upload Files - SecureTrust Bank',
        uploads: [],
        user: req.session,
        success: null,
        error: `Error: ${err.message}`
      });
    }
  });

  // Download uploaded file
  router.get('/uploads/:filename', (req, res) => {
    
    
    const filePath = path.join(__dirname, '..', 'uploads', req.params.filename);
    res.sendFile(filePath);
  });

  // List all uploads
  router.get('/api/uploads', (req, res) => {
    try {
      const uploads = db.prepare('SELECT up.*, u.username FROM uploads up JOIN users u ON up.user_id = u.id ORDER BY up.created_at DESC').all();
      res.json(uploads);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
