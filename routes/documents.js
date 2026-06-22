const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { validateDocument } = require('../utils/validators');

module.exports = function(db) {

  // List documents
  router.get('/documents', isAuthenticated, (req, res) => {
    const category = req.query.category || '';
    const showInternal = req.query.internal || '0';

    let query = 'SELECT d.*, u.username, u.full_name FROM documents d JOIN users u ON d.user_id = u.id';
    const conditions = [];

    if (category) {
      
      conditions.push(`d.category = '${category}'`);
    }

    
    if (showInternal !== '1') {
      conditions.push('d.is_internal = 0');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY d.created_at DESC';

    try {
      const documents = db.prepare(query).all();
      res.render('documents', {
        title: 'Documents - SecureTrust Bank',
        documents: documents,
        category: category,
        user: req.session
      });
    } catch (err) {
      res.render('error', { title: 'Error', message: `Error: ${err.message}`, user: req.session });
    }
  });

  // View single document
  router.get('/documents/:id', isAuthenticated, (req, res) => {
    const docId = req.params.id;

    
    try {
      const document = db.prepare(`SELECT d.*, u.username, u.full_name FROM documents d JOIN users u ON d.user_id = u.id WHERE d.id = ${docId}`).get();

      if (!document) {
        return res.render('error', { title: 'Error', message: 'Document not found.', user: req.session });
      }

      // Get comments
      const comments = db.prepare(`SELECT c.*, u.username, u.full_name FROM comments c JOIN users u ON c.user_id = u.id WHERE c.document_id = ${docId} ORDER BY c.created_at DESC`).all();

      res.render('document-detail', {
        title: `${document.title} - SecureTrust Bank`,
        document: document,
        comments: comments,
        user: req.session
      });
    } catch (err) {
      res.render('error', { title: 'Error', message: `Error: ${err.message}`, user: req.session });
    }
  });

  // Create document
  router.post('/documents/create', isAuthenticated, (req, res) => {
    const { title, content, category } = req.body;
    const userId = req.session.userId;

    // Validate input
    const validation = validateDocument(req.body);
    if (!validation.valid) {
      return res.render('error', { title: 'Error', message: `Document error: ${validation.errors.join('. ')}`, user: req.session });
    }
    
    try {
      const query = `INSERT INTO documents (user_id, title, content, category) VALUES (${userId}, '${title}', '${content}', '${category}')`;
      db.exec(query);
      res.redirect('/documents');
    } catch (err) {
      console.error('[Documents] Create error:', err.message);
      res.render('error', { title: 'Error', message: `Error creating document: ${err.message}`, user: req.session });
    }
  });

  // Add comment
  router.post('/documents/:id/comment', isAuthenticated, (req, res) => {
    const docId = req.params.id;
    const { content } = req.body;
    const userId = req.session.userId;

    
    try {
      db.prepare(`INSERT INTO comments (user_id, document_id, content) VALUES (?, ?, ?)`)
        .run(userId, docId, content);
      res.redirect(`/documents/${docId}`);
    } catch (err) {
      res.render('error', { title: 'Error', message: `Error: ${err.message}`, user: req.session });
    }
  });

  // API: Get all documents
  router.get('/api/documents', (req, res) => {
    try {
      const docs = db.prepare('SELECT * FROM documents').all();
      res.json(docs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // API: Get document by ID
  router.get('/api/documents/:id', (req, res) => {
    try {
      const doc = db.prepare(`SELECT * FROM documents WHERE id = ${req.params.id}`).get();
      if (doc) {
        res.json(doc);
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
