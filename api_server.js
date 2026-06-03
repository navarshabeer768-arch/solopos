/**
 * SoloPOS Booking Integration API
 * ─────────────────────────────────────────────────────────────────
 * This is the bridge between your salon website (srpmassage.com)
 * and the SoloPOS app.
 *
 * How it works:
 *   1. Customer books on srpmassage.com
 *   2. Website sends booking data to THIS server
 *   3. SoloPOS polls this server every 30 seconds
 *   4. New bookings appear instantly in SoloPOS
 *
 * Free hosting: Railway.app or Render.com (no credit card needed)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.API_KEY || 'solopos-default-key-change-me';

// ── DATABASE SETUP ────────────────────────────────────────────────
const db = new Database(path.join(__dirname, 'bookings.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    external_id TEXT UNIQUE,
    salon_id TEXT DEFAULT 'default',
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_email TEXT,
    service TEXT NOT NULL,
    preferred_date TEXT NOT NULL,
    preferred_time TEXT NOT NULL,
    preferred_staff TEXT DEFAULT 'Any',
    notes TEXT,
    status TEXT DEFAULT 'pending',
    source TEXT DEFAULT 'website',
    created_at INTEGER DEFAULT (strftime('%s','now') * 1000),
    updated_at INTEGER DEFAULT (strftime('%s','now') * 1000),
    confirmed_at INTEGER,
    metadata TEXT
  );

  CREATE TABLE IF NOT EXISTS salons (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    api_key TEXT NOT NULL UNIQUE,
    webhook_url TEXT,
    settings TEXT,
    created_at INTEGER DEFAULT (strftime('%s','now') * 1000)
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    salon_id TEXT DEFAULT 'default',
    name TEXT NOT NULL,
    duration INTEGER DEFAULT 60,
    price REAL DEFAULT 0,
    currency TEXT DEFAULT 'QAR',
    category TEXT,
    active INTEGER DEFAULT 1
  );
`);

// Insert default salon if not exists
const existingSalon = db.prepare('SELECT id FROM salons WHERE id = ?').get('default');
if (!existingSalon) {
  db.prepare('INSERT INTO salons (id, name, api_key) VALUES (?, ?, ?)').run(
    'default',
    process.env.SALON_NAME || 'Dawa Belle',
    API_KEY
  );
}

// ── CORS ──────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*').split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS: ' + origin));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));

app.use(express.json());

// ── AUTH MIDDLEWARE ───────────────────────────────────────────────
function requireAuth(req, res, next) {
  const key = req.headers['x-api-key'] || req.query.api_key;
  if (!key) return res.status(401).json({ error: 'API key required' });
  const salon = db.prepare('SELECT * FROM salons WHERE api_key = ?').get(key);
  if (!salon) return res.status(401).json({ error: 'Invalid API key' });
  req.salon = salon;
  next();
}

// ── HEALTH CHECK ──────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name: 'SoloPOS Booking API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    docs: '/api/docs'
  });
});

app.get('/api/docs', (req, res) => {
  res.json({
    title: 'SoloPOS Booking API Docs',
    baseUrl: req.protocol + '://' + req.get('host'),
    authentication: 'Add X-API-Key header to all requests',
    endpoints: {
      'POST /api/bookings': 'Submit a new booking from your website',
      'GET /api/bookings': 'Get all bookings (for SoloPOS to poll)',
      'GET /api/bookings/pending': 'Get only pending bookings',
      'PUT /api/bookings/:id/status': 'Update booking status from SoloPOS',
      'GET /api/services': 'Get services list (for website booking form)',
      'POST /api/services/sync': 'Sync services from SoloPOS',
      'GET /api/available-slots': 'Get available time slots for a date',
    }
  });
});

// ─────────────────────────────────────────────────────────────────
// PUBLIC ENDPOINTS (no auth — used by the salon website)
// ─────────────────────────────────────────────────────────────────

/**
 * POST /api/bookings
 * Called by srpmassage.com when a customer submits the booking form
 */
app.post('/api/bookings', (req, res) => {
  const {
    customerName, customerPhone, customerEmail,
    service, preferredDate, preferredTime,
    preferredStaff = 'Any', notes = '',
    source = 'website', salonId = 'default'
  } = req.body;

  // Validate required fields
  if (!customerName || !service || !preferredDate || !preferredTime) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['customerName', 'service', 'preferredDate', 'preferredTime']
    });
  }

  // Check if salon exists
  const salon = db.prepare('SELECT * FROM salons WHERE id = ?').get(salonId);
  if (!salon) return res.status(404).json({ error: 'Salon not found' });

  // Generate unique external ID
  const externalId = 'BK-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();

  // Get salon settings for auto-confirm
  const settings = salon.settings ? JSON.parse(salon.settings) : {};
  const autoConfirm = settings.autoConfirm || false;
  const status = autoConfirm ? 'confirmed' : 'pending';

  try {
    const result = db.prepare(`
      INSERT INTO bookings
        (external_id, salon_id, customer_name, customer_phone, customer_email,
         service, preferred_date, preferred_time, preferred_staff, notes, status, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      externalId, salonId, customerName, customerPhone || null, customerEmail || null,
      service, preferredDate, preferredTime, preferredStaff, notes, status, source
    );

    res.status(201).json({
      success: true,
      bookingId: externalId,
      status,
      message: autoConfirm
        ? 'Your appointment is confirmed!'
        : 'Booking request received! We will confirm shortly.',
    });
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

/**
 * GET /api/services
 * Called by srpmassage.com to show the services list in the booking form
 */
app.get('/api/services', (req, res) => {
  const salonId = req.query.salon_id || 'default';
  const services = db.prepare('SELECT * FROM services WHERE salon_id = ? AND active = 1').all(salonId);
  res.json({ services });
});

/**
 * GET /api/available-slots
 * Called by srpmassage.com to show available times for a date
 */
app.get('/api/available-slots', (req, res) => {
  const { date, salonId = 'default' } = req.query;
  if (!date) return res.status(400).json({ error: 'date required' });

  const salon = db.prepare('SELECT * FROM salons WHERE id = ?').get(salonId);
  const settings = salon?.settings ? JSON.parse(salon.settings) : {};
  const openHour = parseInt((settings.openTime || '09:00').split(':')[0]);
  const closeHour = parseInt((settings.closeTime || '19:00').split(':')[0]);

  // Get already booked slots
  const booked = db.prepare(
    "SELECT preferred_time FROM bookings WHERE preferred_date = ? AND salon_id = ? AND status != 'rejected' AND status != 'cancelled'"
  ).all(date, salonId).map(b => b.preferred_time);

  // Generate all slots
  const allSlots = [];
  for (let h = openHour; h < closeHour; h++) {
    allSlots.push(`${h}:00`, `${h}:30`);
  }

  const slots = allSlots.map(t => ({
    time: t,
    available: !booked.includes(t)
  }));

  res.json({ date, slots });
});

// ─────────────────────────────────────────────────────────────────
// AUTHENTICATED ENDPOINTS (used by SoloPOS app)
// ─────────────────────────────────────────────────────────────────

/**
 * GET /api/bookings
 * SoloPOS polls this every 30 seconds to get new bookings
 */
app.get('/api/bookings', requireAuth, (req, res) => {
  const { status, since, limit = 100 } = req.query;

  let query = 'SELECT * FROM bookings WHERE salon_id = ?';
  const params = [req.salon.id];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (since) {
    query += ' AND created_at > ?';
    params.push(parseInt(since));
  }

  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(parseInt(limit));

  const bookings = db.prepare(query).all(...params);
  res.json({
    bookings,
    count: bookings.length,
    timestamp: Date.now()
  });
});

/**
 * GET /api/bookings/pending
 * Get only unreviewed bookings
 */
app.get('/api/bookings/pending', requireAuth, (req, res) => {
  const bookings = db.prepare(
    'SELECT * FROM bookings WHERE salon_id = ? AND status = ? ORDER BY created_at ASC'
  ).all(req.salon.id, 'pending');
  res.json({ bookings, count: bookings.length });
});

/**
 * PUT /api/bookings/:id/status
 * SoloPOS confirms or rejects a booking
 */
app.put('/api/bookings/:id/status', requireAuth, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status', valid: validStatuses });
  }

  const booking = db.prepare(
    'SELECT * FROM bookings WHERE (id = ? OR external_id = ?) AND salon_id = ?'
  ).get(req.params.id, req.params.id, req.salon.id);

  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  db.prepare(`
    UPDATE bookings SET status = ?, updated_at = ?,
    confirmed_at = CASE WHEN ? = 'confirmed' THEN ? ELSE confirmed_at END
    WHERE id = ?
  `).run(status, Date.now(), status, Date.now(), booking.id);

  res.json({ success: true, bookingId: booking.external_id, status });
});

/**
 * POST /api/services/sync
 * SoloPOS pushes its services list so the website booking form stays in sync
 */
app.post('/api/services/sync', requireAuth, (req, res) => {
  const { services } = req.body;
  if (!Array.isArray(services)) return res.status(400).json({ error: 'services array required' });

  // Delete existing and re-insert
  db.prepare('DELETE FROM services WHERE salon_id = ?').run(req.salon.id);

  const insert = db.prepare(`
    INSERT INTO services (salon_id, name, duration, price, currency, category, active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((svcs) => {
    for (const s of svcs) {
      insert.run(req.salon.id, s.name, s.duration || 60, s.price || 0,
        s.currency || 'QAR', s.category || 'General', s.active !== false ? 1 : 0);
    }
  });

  insertMany(services);
  res.json({ success: true, synced: services.length });
});

/**
 * PUT /api/settings
 * Update salon settings (working hours, auto-confirm, etc.)
 */
app.put('/api/settings', requireAuth, (req, res) => {
  const settings = JSON.stringify(req.body);
  db.prepare('UPDATE salons SET settings = ? WHERE id = ?').run(settings, req.salon.id);
  res.json({ success: true });
});

/**
 * GET /api/stats
 * Quick stats for SoloPOS dashboard
 */
app.get('/api/stats', requireAuth, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const stats = {
    total: db.prepare('SELECT COUNT(*) as c FROM bookings WHERE salon_id = ?').get(req.salon.id).c,
    pending: db.prepare("SELECT COUNT(*) as c FROM bookings WHERE salon_id = ? AND status = 'pending'").get(req.salon.id).c,
    confirmed: db.prepare("SELECT COUNT(*) as c FROM bookings WHERE salon_id = ? AND status = 'confirmed'").get(req.salon.id).c,
    today: db.prepare("SELECT COUNT(*) as c FROM bookings WHERE salon_id = ? AND preferred_date = ?").get(req.salon.id, today).c,
  };
  res.json(stats);
});

// ── START SERVER ──────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║       SoloPOS Booking API — RUNNING          ║
╠══════════════════════════════════════════════╣
║  URL:     http://localhost:${PORT}              ║
║  API Key: ${API_KEY.slice(0,20)}...         ║
║                                              ║
║  Endpoints:                                  ║
║  POST /api/bookings  ← from website          ║
║  GET  /api/bookings  ← SoloPOS polls this    ║
╚══════════════════════════════════════════════╝
  `);
});

module.exports = app;
