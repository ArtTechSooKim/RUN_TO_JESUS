const path = require('path');
const express = require('express');
const cors = require('cors');
const { initSchema } = require('./db');
const apiRoutes = require('./routes');

const app = express();
const PORT = process.env.PORT || 8080;
const DIST_DIR = path.join(__dirname, '..', 'dist');

app.use(express.json());
// The API is always called via its absolute Railway URL (native app builds
// aren't same-origin with anything), and the broadcast page is a separate
// static page too — so this stays permissive rather than allowlisting origins.
app.use(cors());
app.use('/api', apiRoutes);

app.use(express.static(DIST_DIR));

// SPA fallback: any non-API, non-static route serves index.html so
// expo-router's client-side routing (single output mode) still works.
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

// Catches errors thrown/rejected anywhere in apiRoutes (Express 5 forwards
// rejected async handlers here automatically) so a DB hiccup returns a
// plain JSON error instead of Express's default handler leaking a stack
// trace to the client. Must be registered last, after every other app.use.
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'internal server error' });
});

const AUTO_COMPLETE_INTERVAL_MS = 15000;

initSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`RUN TO JESUS server listening on :${PORT}`);
    });
    // Runs on a fixed cadence instead of inline in GET /sessions (which is
    // polled every 5s per client) — decouples DB writes from request volume.
    setInterval(() => {
      apiRoutes.autoCompleteExpiredSessions().catch((err) => console.error('auto-complete sessions failed:', err));
    }, AUTO_COMPLETE_INTERVAL_MS);
  })
  .catch((err) => {
    console.error('Failed to initialize DB schema:', err);
    process.exit(1);
  });
