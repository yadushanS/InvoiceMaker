const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const [folders] = await pool.query(
      `SELECT f.*, (SELECT COUNT(*) FROM invoices i WHERE i.folderId = f.id) as invoiceCount
       FROM folders f WHERE f.businessId = ? ORDER BY f.createdAt DESC`,
      [req.businessId]
    );
    res.json({ folders });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Folder name is required' });
    const id = uuidv4();
    await pool.query('INSERT INTO folders (id, businessId, name) VALUES (?, ?, ?)', [id, req.businessId, name.trim()]);
    const [rows] = await pool.query('SELECT * FROM folders WHERE id = ?', [id]);
    res.status(201).json({ folder: rows[0] });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM folders WHERE id = ? AND businessId = ?', [req.params.id, req.businessId]);
    if (!rows[0]) return res.status(404).json({ error: 'Folder not found' });
    res.json({ folder: rows[0] });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Folder name is required' });
    const [existing] = await pool.query('SELECT * FROM folders WHERE id = ? AND businessId = ?', [req.params.id, req.businessId]);
    if (!existing[0]) return res.status(404).json({ error: 'Folder not found' });
    await pool.query('UPDATE folders SET name = ? WHERE id = ?', [name.trim(), req.params.id]);
    const [rows] = await pool.query('SELECT * FROM folders WHERE id = ?', [req.params.id]);
    res.json({ folder: rows[0] });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const [existing] = await pool.query('SELECT id FROM folders WHERE id = ? AND businessId = ?', [req.params.id, req.businessId]);
    if (!existing[0]) return res.status(404).json({ error: 'Folder not found' });
    await pool.query('DELETE FROM folders WHERE id = ?', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
