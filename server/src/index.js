require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const { initSchema } = require('./db');
const { router: authRouter } = require('./routes/auth');
const businessRouter = require('./routes/business');
const foldersRouter = require('./routes/folders');
const invoicesRouter = require('./routes/invoices');

const app = express();

const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors(corsOrigin ? { origin: corsOrigin.split(',').map((o) => o.trim()) } : {}));
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/business', businessRouter);
app.use('/api/folders', foldersRouter);
app.use('/api/invoices', invoicesRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

const PORT = process.env.PORT || 4000;

initSchema()
  .then(() => {
    app.listen(PORT, () => console.log(`Invoice Maker API listening on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to initialize database schema:', err.message);
    process.exit(1);
  });
