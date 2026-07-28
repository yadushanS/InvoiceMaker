const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { toPublicBusiness } = require('./auth');

const router = express.Router();

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `${req.businessId}-${uuidv4()}${ext}`);
  },
});
const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']);
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) return cb(new Error('Only PNG, JPEG, WEBP or SVG logos are allowed'));
    cb(null, true);
  },
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM businesses WHERE id = ?', [req.businessId]);
    if (!rows[0]) return res.status(404).json({ error: 'Business not found' });
    res.json({ business: toPublicBusiness(rows[0]) });
  } catch (err) {
    next(err);
  }
});

router.put('/me', requireAuth, async (req, res, next) => {
  try {
    const fields = ['name', 'address', 'abn', 'phone', 'contactEmail', 'bankAccountHolder', 'bankName', 'bankBsb', 'bankAccountNo'];
    const updates = [];
    const values = [];
    for (const f of fields) {
      if (typeof req.body[f] === 'string') {
        updates.push(`${f} = ?`);
        values.push(req.body[f]);
      }
    }
    if (updates.length === 0) return res.status(400).json({ error: 'No valid fields to update' });
    values.push(req.businessId);
    await pool.query(`UPDATE businesses SET ${updates.join(', ')} WHERE id = ?`, values);
    const [rows] = await pool.query('SELECT * FROM businesses WHERE id = ?', [req.businessId]);
    res.json({ business: toPublicBusiness(rows[0]) });
  } catch (err) {
    next(err);
  }
});

router.post('/me/logo', requireAuth, (req, res, next) => {
  upload.single('logo')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    try {
      const logoUrl = `/uploads/${req.file.filename}`;
      let themeColors = null;

      try {
        themeColors = await extractPalette(req.file.path, req.file.mimetype);
      } catch (e) {
        console.error('Palette extraction failed, using defaults:', e.message);
      }
      if (!themeColors) {
        themeColors = { primary: '#c0392b', dark: '#2b2b2b', light: '#f5f5f5', accentText: '#ffffff' };
      }

      await pool.query('UPDATE businesses SET logoUrl = ?, themeColors = ? WHERE id = ?', [
        logoUrl, JSON.stringify(themeColors), req.businessId,
      ]);

      const [rows] = await pool.query('SELECT * FROM businesses WHERE id = ?', [req.businessId]);
      res.json({ business: toPublicBusiness(rows[0]) });
    } catch (e) {
      next(e);
    }
  });
});

async function extractPalette(filePath, mimetype) {
  if (mimetype === 'image/svg+xml') return null;
  const Vibrant = require('node-vibrant');
  const palette = await Vibrant.from(filePath).getPalette();
  const pick = (swatch) => (swatch ? swatch.hex : null);

  const primary = pick(palette.Vibrant) || pick(palette.DarkVibrant) || pick(palette.Muted) || '#c0392b';
  const dark = pick(palette.DarkVibrant) || pick(palette.DarkMuted) || '#2b2b2b';
  const light = pick(palette.LightMuted) || pick(palette.LightVibrant) || '#f5f5f5';

  return { primary, dark, light, accentText: '#ffffff' };
}

module.exports = router;
