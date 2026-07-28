const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

function toPublicInvoice(row) {
  return {
    id: row.id,
    folderId: row.folderId,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    data: JSON.parse(row.data),
  };
}

// List invoices, optionally filtered by folder: /api/invoices?folderId=xxx
router.get('/', async (req, res, next) => {
  try {
    const { folderId } = req.query;
    let rows;
    if (folderId) {
      const [folderRows] = await pool.query('SELECT id FROM folders WHERE id = ? AND businessId = ?', [folderId, req.businessId]);
      if (!folderRows[0]) return res.status(404).json({ error: 'Folder not found' });
      [rows] = await pool.query('SELECT * FROM invoices WHERE folderId = ? ORDER BY updatedAt DESC', [folderId]);
    } else {
      [rows] = await pool.query('SELECT * FROM invoices WHERE businessId = ? ORDER BY updatedAt DESC', [req.businessId]);
    }
    res.json({ invoices: rows.map(toPublicInvoice) });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { folderId, data, status } = req.body;
    if (!folderId) return res.status(400).json({ error: 'folderId is required' });
    const [folderRows] = await pool.query('SELECT id FROM folders WHERE id = ? AND businessId = ?', [folderId, req.businessId]);
    if (!folderRows[0]) return res.status(404).json({ error: 'Folder not found' });

    const id = uuidv4();
    await pool.query('INSERT INTO invoices (id, businessId, folderId, data, status) VALUES (?, ?, ?, ?, ?)', [
      id, req.businessId, folderId, JSON.stringify(data || {}), status || 'draft',
    ]);

    const [rows] = await pool.query('SELECT * FROM invoices WHERE id = ?', [id]);
    res.status(201).json({ invoice: toPublicInvoice(rows[0]) });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM invoices WHERE id = ? AND businessId = ?', [req.params.id, req.businessId]);
    if (!rows[0]) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ invoice: toPublicInvoice(rows[0]) });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { data, status, folderId } = req.body;
    const [existingRows] = await pool.query('SELECT * FROM invoices WHERE id = ? AND businessId = ?', [req.params.id, req.businessId]);
    const row = existingRows[0];
    if (!row) return res.status(404).json({ error: 'Invoice not found' });

    if (folderId && folderId !== row.folderId) {
      const [folderRows] = await pool.query('SELECT id FROM folders WHERE id = ? AND businessId = ?', [folderId, req.businessId]);
      if (!folderRows[0]) return res.status(404).json({ error: 'Target folder not found' });
    }

    await pool.query('UPDATE invoices SET data = ?, status = ?, folderId = ? WHERE id = ?', [
      JSON.stringify(data !== undefined ? data : JSON.parse(row.data)),
      status || row.status,
      folderId || row.folderId,
      req.params.id,
    ]);

    const [rows] = await pool.query('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
    res.json({ invoice: toPublicInvoice(rows[0]) });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const [existing] = await pool.query('SELECT id FROM invoices WHERE id = ? AND businessId = ?', [req.params.id, req.businessId]);
    if (!existing[0]) return res.status(404).json({ error: 'Invoice not found' });
    await pool.query('DELETE FROM invoices WHERE id = ?', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.post('/:id/duplicate', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM invoices WHERE id = ? AND businessId = ?', [req.params.id, req.businessId]);
    const row = rows[0];
    if (!row) return res.status(404).json({ error: 'Invoice not found' });
    const id = uuidv4();
    const data = JSON.parse(row.data);
    data.invoiceNumber = data.invoiceNumber ? `${data.invoiceNumber}-copy` : '';
    await pool.query('INSERT INTO invoices (id, businessId, folderId, data, status) VALUES (?, ?, ?, ?, ?)', [
      id, req.businessId, row.folderId, JSON.stringify(data), 'draft',
    ]);
    const [newRows] = await pool.query('SELECT * FROM invoices WHERE id = ?', [id]);
    res.status(201).json({ invoice: toPublicInvoice(newRows[0]) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
