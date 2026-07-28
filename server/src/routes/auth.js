const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db');

const router = express.Router();

function toPublicBusiness(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    address: row.address,
    abn: row.abn,
    phone: row.phone,
    contactEmail: row.contactEmail,
    logoUrl: row.logoUrl,
    themeColors: row.themeColors ? JSON.parse(row.themeColors) : null,
    bankAccountHolder: row.bankAccountHolder,
    bankName: row.bankName,
    bankBsb: row.bankBsb,
    bankAccountNo: row.bankAccountNo,
  };
}

function sign(businessId) {
  return jwt.sign({ businessId }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, businessName } = req.body;
    if (!email || !password || !businessName) {
      return res.status(400).json({ error: 'email, password and businessName are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const [existingRows] = await pool.query('SELECT id FROM businesses WHERE email = ?', [normalizedEmail]);
    if (existingRows.length > 0) return res.status(409).json({ error: 'An account with this email already exists' });

    const id = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 10);
    await pool.query('INSERT INTO businesses (id, email, passwordHash, name) VALUES (?, ?, ?, ?)', [
      id, normalizedEmail, passwordHash, businessName.trim(),
    ]);

    const [rows] = await pool.query('SELECT * FROM businesses WHERE id = ?', [id]);
    res.status(201).json({ token: sign(id), business: toPublicBusiness(rows[0]) });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

    const [rows] = await pool.query('SELECT * FROM businesses WHERE email = ?', [email.toLowerCase().trim()]);
    const row = rows[0];
    if (!row || !bcrypt.compareSync(password, row.passwordHash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    res.json({ token: sign(row.id), business: toPublicBusiness(row) });
  } catch (err) {
    next(err);
  }
});

module.exports = { router, toPublicBusiness };
