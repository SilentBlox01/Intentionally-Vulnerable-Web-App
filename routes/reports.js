const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { isAuthenticated } = require('../middleware/auth');
const { buildWhereClause, condition } = require('../utils/queryBuilder');
const config = require('../config');

module.exports = function(db) {

  // Reports page
  router.get('/reports', isAuthenticated, (req, res) => {
    res.render('reports', {
      title: 'Reports & Analytics - SecureTrust Bank',
      user: req.session
    });
  });

  // Helper: build transaction filter conditions from query params
  function buildTransactionFilters(query) {
    const conditions = [];
    if (query.userId) conditions.push(condition('t.user_id', query.userId));
    if (query.from) conditions.push(condition('t.created_at', query.from, '>='));
    if (query.to) conditions.push(condition('t.created_at', query.to + ' 23:59:59', '<='));
    return buildWhereClause(conditions);
  }

  // Analytics API for charts
  router.get('/api/reports/analytics', isAuthenticated, (req, res) => {
    try {
      const { whereClause, params } = buildTransactionFilters(req.query);

      const summary = db.prepare(`
        SELECT
          COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END), 0) as totalIncome,
          COALESCE(SUM(CASE WHEN type IN ('withdrawal', 'transfer') THEN amount ELSE 0 END), 0) as totalExpenses,
          COUNT(*) as totalTransactions
        FROM transactions t
        ${whereClause}
      `).get(...params);

      const monthlyTrend = db.prepare(`
        SELECT strftime('%Y-%m', t.created_at) as month,
          COALESCE(SUM(CASE WHEN t.type = 'deposit' THEN t.amount ELSE 0 END), 0) as income,
          COALESCE(SUM(CASE WHEN t.type IN ('withdrawal', 'transfer') THEN t.amount ELSE 0 END), 0) as expenses
        FROM transactions t
        ${whereClause}
        GROUP BY strftime('%Y-%m', t.created_at)
        ORDER BY month ASC
      `).all(...params);

      const categoryBreakdown = db.prepare(`
        SELECT t.description,
          SUM(t.amount) as total,
          t.type
        FROM transactions t
        ${whereClause}
        GROUP BY t.description
        ORDER BY total DESC
        LIMIT 10
      `).all(...params);

      const typeBreakdown = db.prepare(`
        SELECT type,
          COUNT(*) as count,
          SUM(amount) as total
        FROM transactions t
        ${whereClause}
        GROUP BY type
      `).all(...params);

      const transactions = db.prepare(`
        SELECT t.*, u.username, u.full_name, u.account_number
        FROM transactions t
        JOIN users u ON t.user_id = u.id
        ${whereClause}
        ORDER BY t.created_at DESC
        LIMIT ?
      `).all(...params, config.MAX_API_RESULTS);

      res.json({
        summary: summary,
        monthlyTrend: monthlyTrend,
        categoryBreakdown: categoryBreakdown,
        typeBreakdown: typeBreakdown,
        transactions: transactions
      });
    } catch (err) {
      console.error('[Reports] Analytics error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Export transactions as Excel
  router.get('/reports/export/excel', isAuthenticated, async (req, res) => {
    try {
      const { whereClause, params } = buildTransactionFilters(req.query);

      const transactions = db.prepare(`
        SELECT t.id, u.username, u.full_name, u.account_number,
          t.type, t.amount, t.description, t.recipient_account, t.status, t.created_at
        FROM transactions t
        JOIN users u ON t.user_id = u.id
        ${whereClause}
        ORDER BY t.created_at DESC
      `).all(...params);

      const summary = db.prepare(`
        SELECT
          COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END), 0) as totalIncome,
          COALESCE(SUM(CASE WHEN type IN ('withdrawal', 'transfer') THEN amount ELSE 0 END), 0) as totalExpenses,
          COUNT(*) as totalTransactions
        FROM transactions t
        ${whereClause}
      `).get(...params);

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'SecureTrust Bank';
      workbook.created = new Date();

      // Summary sheet
      const summarySheet = workbook.addWorksheet('Summary', {
        properties: { tabColor: { argb: '003087' } }
      });

      summarySheet.columns = [
        { header: 'Metric', key: 'metric', width: 30 },
        { header: 'Value', key: 'value', width: 25 }
      ];

      summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
      summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '003087' } };

      summarySheet.addRow({ metric: 'Report Generated', value: new Date().toLocaleString() });
      summarySheet.addRow({ metric: 'Total Income', value: summary.totalIncome });
      summarySheet.addRow({ metric: 'Total Expenses', value: summary.totalExpenses });
      summarySheet.addRow({ metric: 'Net Savings', value: summary.totalIncome - summary.totalExpenses });
      summarySheet.addRow({ metric: 'Total Transactions', value: summary.totalTransactions });

      // Transactions sheet
      const txSheet = workbook.addWorksheet('Transactions', {
        properties: { tabColor: { argb: '0070ba' } }
      });

      txSheet.columns = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'Date', key: 'created_at', width: 20 },
        { header: 'User', key: 'username', width: 15 },
        { header: 'Full Name', key: 'full_name', width: 25 },
        { header: 'Account #', key: 'account_number', width: 20 },
        { header: 'Type', key: 'type', width: 14 },
        { header: 'Amount', key: 'amount', width: 15 },
        { header: 'Description', key: 'description', width: 30 },
        { header: 'Recipient', key: 'recipient_account', width: 22 },
        { header: 'Status', key: 'status', width: 14 }
      ];

      txSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
      txSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '003087' } };

      transactions.forEach(tx => {
        const row = txSheet.addRow(tx);
        const amountCell = row.getCell('amount');
        amountCell.numFmt = '$#,##0.00';
        if (tx.type === 'deposit') {
          amountCell.font = { color: { argb: '0D8A53' } };
        } else {
          amountCell.font = { color: { argb: 'C22A30' } };
        }
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=securetrust_report_${Date.now()}.xlsx`);

      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      console.error('[Reports] Excel export error:', err.message);
      res.status(500).render('error', { title: 'Error', message: `Excel export error: ${err.message}`, user: req.session });
    }
  });

  // Generate PDF report (improved)
  router.get('/reports/generate/:userId?', isAuthenticated, (req, res) => {
    const targetUserId = req.params.userId || req.session.userId;

    try {
      const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(targetUserId);

      if (!targetUser) {
        return res.status(404).render('error', { title: 'Error', message: 'User not found.', user: req.session });
      }

      const transactions = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC').all(targetUserId);

      const totalIncome = transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = transactions.filter(t => t.type !== 'deposit').reduce((sum, t) => sum + t.amount, 0);

      const doc = new PDFDocument({ margin: 50, size: 'A4' });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=statement_${targetUser.username}_${Date.now()}.pdf`);

      doc.pipe(res);

      // Header
      doc.rect(0, 0, 595.28, 90).fill('#003087');
      doc.fontSize(22).font('Helvetica-Bold').fillColor('#ffffff').text('SecureTrust Bank', 50, 25);
      doc.fontSize(10).font('Helvetica').fillColor('#c7d2e0').text('Confidential Financial Statement', 50, 52);

      doc.fillColor('#000000');
      doc.moveDown(3);

      // Customer info section
      doc.fontSize(14).font('Helvetica-Bold').text('Customer Information');
      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#003087');
      doc.moveDown(0.5);

      doc.fontSize(9).font('Helvetica');
      const infoY = doc.y;
      doc.text(`Name: ${targetUser.full_name}`, 50, infoY);
      doc.text(`Username: ${targetUser.username}`, 300, infoY);
      doc.text(`Email: ${targetUser.email}`, 50, infoY + 16);
      doc.text(`Phone: ${targetUser.phone}`, 300, infoY + 16);
      doc.text(`Address: ${targetUser.address}`, 50, infoY + 32);
      doc.text(`Account: ${targetUser.account_number}`, 300, infoY + 32);
      doc.text(`Role: ${targetUser.role}`, 50, infoY + 48);
      doc.text(`Balance: $${targetUser.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 300, infoY + 48);

      doc.y = infoY + 72;

      // Summary section
      doc.fontSize(14).font('Helvetica-Bold').text('Financial Summary');
      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#003087');
      doc.moveDown(0.5);

      const sumY = doc.y;
      doc.fontSize(9).font('Helvetica');

      doc.rect(50, sumY, 155, 50).fillAndStroke('#e6f7ef', '#0d8a53');
      doc.fillColor('#0d8a53').fontSize(8).text('TOTAL INCOME', 58, sumY + 8);
      doc.fillColor('#1b2a3d').fontSize(14).font('Helvetica-Bold').text(`$${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 58, sumY + 22);

      doc.rect(215, sumY, 155, 50).fillAndStroke('#fdeaeb', '#c22a30');
      doc.fillColor('#c22a30').fontSize(8).font('Helvetica').text('TOTAL EXPENSES', 223, sumY + 8);
      doc.fillColor('#1b2a3d').fontSize(14).font('Helvetica-Bold').text(`$${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 223, sumY + 22);

      doc.rect(380, sumY, 155, 50).fillAndStroke('#e6f1fa', '#0070ba');
      doc.fillColor('#0070ba').fontSize(8).font('Helvetica').text('NET SAVINGS', 388, sumY + 8);
      doc.fillColor('#1b2a3d').fontSize(14).font('Helvetica-Bold').text(`$${(totalIncome - totalExpenses).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 388, sumY + 22);

      doc.y = sumY + 68;

      // Transactions table
      doc.fillColor('#000000');
      doc.fontSize(14).font('Helvetica-Bold').text('Transaction History');
      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#003087');
      doc.moveDown(0.5);

      if (transactions.length > 0) {
        const tableTop = doc.y;
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#8e9bb5');
        doc.text('DATE', 50, tableTop, { width: 85 });
        doc.text('TYPE', 140, tableTop, { width: 65 });
        doc.text('AMOUNT', 210, tableTop, { width: 80 });
        doc.text('DESCRIPTION', 295, tableTop, { width: 160 });
        doc.text('STATUS', 460, tableTop, { width: 75 });
        doc.moveDown();

        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e0e5ec');
        doc.moveDown(0.3);

        doc.font('Helvetica').fontSize(8).fillColor('#1b2a3d');
        transactions.forEach(tx => {
          if (doc.y > 720) {
            doc.addPage();
            doc.y = 50;
          }

          const y = doc.y;
          doc.text(tx.created_at || 'N/A', 50, y, { width: 85 });
          doc.text(tx.type || 'N/A', 140, y, { width: 65 });

          if (tx.type === 'deposit') {
            doc.fillColor('#0d8a53').text(`+$${(tx.amount || 0).toFixed(2)}`, 210, y, { width: 80 });
          } else {
            doc.fillColor('#c22a30').text(`-$${(tx.amount || 0).toFixed(2)}`, 210, y, { width: 80 });
          }

          doc.fillColor('#1b2a3d').text(tx.description || 'N/A', 295, y, { width: 160 });
          doc.text(tx.status || 'N/A', 460, y, { width: 75 });

          doc.y = y + 14;
          doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#eef1f5');
          doc.moveDown(0.2);
        });
      } else {
        doc.fontSize(9).fillColor('#8e9bb5').text('No transactions found for this period.');
      }

      // Footer
      doc.moveDown(2);
      doc.fontSize(7).fillColor('#8e9bb5')
        .text(`Generated on ${new Date().toLocaleString('en-US')} | SecureTrust Bank - Confidential`, 50, doc.y, { align: 'center', width: 495 });

      doc.end();
    } catch (err) {
      console.error('[Reports] PDF generation error:', err.message);
      res.status(500).render('error', { title: 'Error', message: `PDF error: ${err.message}`, user: req.session });
    }
  });

  // API: Export all transactions as JSON
  router.get('/api/reports/transactions', (req, res) => {
    const userId = req.query.userId;
    let query = 'SELECT t.*, u.username, u.full_name, u.account_number FROM transactions t JOIN users u ON t.user_id = u.id';
    const params = [];

    if (userId) {
      query += ' WHERE t.user_id = ?';
      params.push(userId);
    }

    query += ' ORDER BY t.created_at DESC LIMIT ?';
    params.push(config.MAX_API_RESULTS);

    try {
      const transactions = db.prepare(query).all(...params);
      res.json(transactions);
    } catch (err) {
      console.error('[Reports] JSON export error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
