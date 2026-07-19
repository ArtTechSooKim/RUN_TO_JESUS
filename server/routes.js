const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('./db');

const router = express.Router();

const RUN_TO_JESUS = 'RUNTOJESUS';
// Matches the client-side super-admin gate — checked server-side too since
// this one wipes every team's progress (blast radius is the whole event,
// unlike the per-user edit endpoints), see settings.tsx ADMIN_PASSWORD.
const RESET_PASSWORD = 'saeroun0906';

function parseLetters(row) {
  if (!row) return row;
  return { ...row, letters: typeof row.letters === 'string' ? JSON.parse(row.letters) : row.letters };
}

// ── users ────────────────────────────────────────────────────────────────

async function dedupedName(conn, name) {
  const [rows] = await conn.query(
    'SELECT COUNT(*) AS count FROM users WHERE name = ? OR name REGEXP ?',
    [name, `^${name}[0-9]+$`],
  );
  const count = rows[0].count;
  return count === 0 ? name : `${name}${count + 1}`;
}

router.post('/users/login', async (req, res) => {
  const { person_id, name, team_id } = req.body;
  if (!name || !team_id) return res.status(400).json({ error: 'name and team_id are required' });

  const conn = await pool.getConnection();
  try {
    if (person_id) {
      const [existing] = await conn.query('SELECT * FROM users WHERE person_id = ?', [person_id]);
      if (existing.length) return res.json(existing[0]);
    }

    const id = person_id || uuidv4();
    const finalName = await dedupedName(conn, String(name).trim());
    await conn.query('INSERT INTO users (person_id, name, team_id) VALUES (?, ?, ?)', [id, finalName, team_id]);
    res.status(201).json({ person_id: id, name: finalName, team_id });
  } finally {
    conn.release();
  }
});

router.patch('/users/:person_id', async (req, res) => {
  const { name, team_id } = req.body;
  const fields = [];
  const values = [];
  if (name !== undefined) { fields.push('name = ?'); values.push(name); }
  if (team_id !== undefined) { fields.push('team_id = ?'); values.push(team_id); }
  if (!fields.length) return res.status(400).json({ error: 'nothing to update' });

  values.push(req.params.person_id);
  await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE person_id = ?`, values);
  const [rows] = await pool.query('SELECT * FROM users WHERE person_id = ?', [req.params.person_id]);
  if (!rows.length) return res.status(404).json({ error: 'not found' });
  res.json(rows[0]);
});

// ── tag events ───────────────────────────────────────────────────────────

router.post('/tag-events', async (req, res) => {
  const { person_id, team_id, station_id } = req.body;
  if (!person_id || !team_id || !station_id) {
    return res.status(400).json({ error: 'person_id, team_id, station_id are required' });
  }

  // Two teammates can tag the same station within milliseconds of each
  // other; without serializing, both requests would read "not tagged yet"
  // and each insert a full set of letter rows. A named lock (scoped to this
  // one connection) closes that race without a schema change.
  const lockName = `tag_events:${team_id}:${station_id}`;
  const conn = await pool.getConnection();
  try {
    const [lockRows] = await conn.query('SELECT GET_LOCK(?, 5) AS acquired', [lockName]);
    if (!lockRows[0].acquired) return res.status(503).json({ error: 'busy, try again' });

    try {
      const [stationRows] = await conn.query('SELECT * FROM stations WHERE station_id = ? AND is_active = TRUE', [station_id]);
      if (!stationRows.length) return res.status(404).json({ error: 'unknown or inactive station' });
      const station = parseLetters(stationRows[0]);

      const [priorRows] = await conn.query(
        'SELECT COUNT(*) AS count FROM tag_events WHERE team_id = ? AND station_id = ?',
        [team_id, station_id],
      );
      const newForTeam = priorRows[0].count === 0;

      if (station.letters.length) {
        for (const li of station.letters) {
          await conn.query(
            'INSERT INTO tag_events (person_id, team_id, station_id, fragment_letter) VALUES (?, ?, ?, ?)',
            [person_id, team_id, station_id, RUN_TO_JESUS[li]],
          );
        }
      } else {
        await conn.query(
          'INSERT INTO tag_events (person_id, team_id, station_id, fragment_letter) VALUES (?, ?, ?, NULL)',
          [person_id, team_id, station_id],
        );
      }

      // Mini-games (노아방/아벨방/영화관) have no physical room to book, so
      // there's no admin "세션 시작" step for them — the scan itself starts
      // their timed session, same shape as an admin-started one, so the
      // existing session-progress UI (floor map, admin dashboard) just works.
      if (station.is_minigame) {
        const [activeRows] = await conn.query(
          `SELECT id FROM game_sessions WHERE team_id = ? AND station_id = ? AND status = 'in_progress'`,
          [team_id, station_id],
        );
        if (!activeRows.length) {
          await conn.query(
            `INSERT INTO game_sessions (station_id, team_id, expected_end_at)
             VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
            [station_id, team_id, station.duration_minutes],
          );
        }
      }

      res.status(201).json({ station_id, letters: station.letters, newForTeam });
    } finally {
      await conn.query('SELECT RELEASE_LOCK(?)', [lockName]);
    }
  } finally {
    conn.release();
  }
});

// Undo a mistaken tag — removes every tag_events row for this team+station
// (a station's letters are recorded as several rows, see POST above). Any
// team member can do this; it's a self-service correction, not an admin tool.
router.delete('/tag-events/:team_id/:station_id', async (req, res) => {
  await pool.query('DELETE FROM tag_events WHERE team_id = ? AND station_id = ?', [
    req.params.team_id,
    req.params.station_id,
  ]);
  res.json({ ok: true });
});

router.get('/teams/:team_id/fragments', async (req, res) => {
  const [stationIdRows] = await pool.query(
    'SELECT DISTINCT station_id FROM tag_events WHERE team_id = ?',
    [req.params.team_id],
  );
  const stationIds = stationIdRows.map((r) => r.station_id);
  if (!stationIds.length) return res.json({ stationIds: [], letters: [] });

  const [stationRows] = await pool.query(
    `SELECT letters FROM stations WHERE station_id IN (${stationIds.map(() => '?').join(',')})`,
    stationIds,
  );
  const letters = [...new Set(stationRows.flatMap((r) => parseLetters(r).letters))].sort((a, b) => a - b);
  res.json({ stationIds, letters });
});

router.post('/fragment-reveal-log', async (req, res) => {
  const { person_id, station_id, source } = req.body;
  try {
    await pool.query(
      'INSERT INTO fragment_reveal_log (person_id, station_id, source) VALUES (?, ?, ?)',
      [person_id ?? null, station_id ?? null, source ?? null],
    );
  } catch {
    // stats-only log — never block the client on this
  }
  res.status(201).json({ ok: true });
});

// ── stations (admin CRUD) ────────────────────────────────────────────────

router.get('/stations', async (req, res) => {
  const onlyActive = req.query.active === 'true';
  const [rows] = await pool.query(
    onlyActive ? 'SELECT * FROM stations WHERE is_active = TRUE' : 'SELECT * FROM stations',
  );
  res.json(rows.map(parseLetters));
});

router.post('/stations', async (req, res) => {
  const { station_id, name, hall_name, duration_minutes, concurrent_capacity, letters } = req.body;
  if (!station_id || !name) return res.status(400).json({ error: 'station_id and name are required' });
  await pool.query(
    `INSERT INTO stations (station_id, name, hall_name, duration_minutes, concurrent_capacity, letters)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [station_id, name, hall_name ?? null, duration_minutes ?? 20, concurrent_capacity ?? 1, JSON.stringify(letters ?? [])],
  );
  const [rows] = await pool.query('SELECT * FROM stations WHERE station_id = ?', [station_id]);
  res.status(201).json(parseLetters(rows[0]));
});

router.patch('/stations/:station_id', async (req, res) => {
  const allowed = ['name', 'hall_name', 'duration_minutes', 'concurrent_capacity', 'letters', 'is_active'];
  const fields = [];
  const values = [];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(key === 'letters' ? JSON.stringify(req.body[key]) : req.body[key]);
    }
  }
  if (!fields.length) return res.status(400).json({ error: 'nothing to update' });

  values.push(req.params.station_id);
  await pool.query(`UPDATE stations SET ${fields.join(', ')} WHERE station_id = ?`, values);
  const [rows] = await pool.query('SELECT * FROM stations WHERE station_id = ?', [req.params.station_id]);
  if (!rows.length) return res.status(404).json({ error: 'not found' });
  res.json(parseLetters(rows[0]));
});

router.delete('/stations/:station_id', async (req, res) => {
  await pool.query('UPDATE stations SET is_active = FALSE WHERE station_id = ?', [req.params.station_id]);
  res.json({ ok: true });
});

// ── game sessions ────────────────────────────────────────────────────────

async function autoCompleteExpiredSessions() {
  await pool.query(
    `UPDATE game_sessions
     SET status = 'completed', ended_at = NOW(), ended_by = 'auto'
     WHERE status = 'in_progress' AND expected_end_at <= NOW()`,
  );
}

router.get('/sessions', async (req, res) => {
  // Expiring sessions is handled by a background interval (see server/index.js)
  // rather than inline here — this is polled every 5s by the participant
  // floormap screen, and running an UPDATE on every one of those hits would
  // multiply into dozens of mostly-no-op writes/sec at ~300 concurrent users.
  const { status } = req.query;
  const [rows] = status
    ? await pool.query('SELECT * FROM game_sessions WHERE status = ? ORDER BY started_at DESC', [status])
    : await pool.query('SELECT * FROM game_sessions ORDER BY started_at DESC');
  res.json(rows);
});

router.post('/sessions', async (req, res) => {
  const { station_id, team_id, started_by_name, hall_label } = req.body;
  if (!station_id || !team_id) return res.status(400).json({ error: 'station_id and team_id are required' });

  // A team is one physical group of people — they can't be mid-session at two
  // stations at once. Two admin devices starting the same team at different
  // rooms within the same poll window is a real race, so this is locked
  // per-team (not per-station+team) and checked globally, mirroring the
  // tag_events named-lock pattern above.
  const lockName = `game_sessions:team:${team_id}`;
  const conn = await pool.getConnection();
  try {
    const [lockRows] = await conn.query('SELECT GET_LOCK(?, 5) AS acquired', [lockName]);
    if (!lockRows[0].acquired) return res.status(503).json({ error: 'busy, try again' });

    try {
      const [stationRows] = await conn.query('SELECT duration_minutes FROM stations WHERE station_id = ?', [station_id]);
      if (!stationRows.length) return res.status(404).json({ error: 'unknown station' });

      const [activeRows] = await conn.query(
        `SELECT station_id FROM game_sessions WHERE team_id = ? AND status = 'in_progress'`,
        [team_id],
      );
      if (activeRows.length) {
        return res.status(409).json({ error: 'team already has an active session', station_id: activeRows[0].station_id });
      }

      const [result] = await conn.query(
        `INSERT INTO game_sessions (station_id, team_id, expected_end_at, started_by_name, hall_label)
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE), ?, ?)`,
        [station_id, team_id, stationRows[0].duration_minutes, started_by_name ?? null, hall_label ?? null],
      );
      const [rows] = await conn.query('SELECT * FROM game_sessions WHERE id = ?', [result.insertId]);
      res.status(201).json(rows[0]);
    } finally {
      await conn.query('SELECT RELEASE_LOCK(?)', [lockName]);
    }
  } finally {
    conn.release();
  }
});

router.patch('/sessions/:id', async (req, res) => {
  const { status, ended_by } = req.body;
  if (!['completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: "status must be 'completed' or 'cancelled'" });
  }
  await pool.query(
    'UPDATE game_sessions SET status = ?, ended_at = NOW(), ended_by = ? WHERE id = ?',
    [status, ended_by ?? 'admin', req.params.id],
  );
  const [rows] = await pool.query('SELECT * FROM game_sessions WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'not found' });
  res.json(rows[0]);
});

// ── station prep status ─────────────────────────────────────────────────
// Manual "준비중🧹" indicator a station's staff flips between games instead
// of a timer, since on-site setup time varies too much to predict — see
// STATION_QUEUE_GUIDE.md hand-off chat for the confirmed design (the queue
// system in that file's body was cancelled; only this simpler toggle shipped).

router.get('/prep-status', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT station_id, is_preparing, tip FROM station_prep_status WHERE is_preparing = TRUE',
  );
  res.json(rows);
});

router.put('/prep-status/:station_id', async (req, res) => {
  const { is_preparing, tip } = req.body;
  if (typeof is_preparing !== 'boolean') return res.status(400).json({ error: 'is_preparing (boolean) is required' });
  await pool.query(
    `INSERT INTO station_prep_status (station_id, is_preparing, tip) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE is_preparing = VALUES(is_preparing), tip = VALUES(tip)`,
    [req.params.station_id, is_preparing, tip ?? null],
  );
  const [rows] = await pool.query(
    'SELECT station_id, is_preparing, tip FROM station_prep_status WHERE station_id = ?',
    [req.params.station_id],
  );
  res.json(rows[0]);
});

// ── app state (super admin) ──────────────────────────────────────────────

router.get('/app-state', async (req, res) => {
  const [rows] = await pool.query('SELECT game_state, updated_at FROM app_state WHERE id = 1');
  res.json(rows[0]);
});

router.put('/app-state', async (req, res) => {
  const { game_state } = req.body;
  if (!['progress', 'ended'].includes(game_state)) {
    return res.status(400).json({ error: "game_state must be 'progress' or 'ended'" });
  }
  await pool.query('UPDATE app_state SET game_state = ?, updated_at = NOW() WHERE id = 1', [game_state]);
  res.json({ game_state });
});

// Triggers the runner-progress-bar finish-line animation on broadcast.html.
// One-way (ended -> ending only) — the client animates to 100% itself, this
// endpoint is just the signal. See RUN_TO_JESUS_앱_개발문서.md §ending flow.
router.post('/admin/ending/start', async (req, res) => {
  const [rows] = await pool.query('SELECT game_state FROM app_state WHERE id = 1');
  if (rows[0].game_state !== 'ended') {
    return res.status(400).json({ error: "game_state must be 'ended' before starting the ending" });
  }
  await pool.query(`UPDATE app_state SET game_state = 'ending', updated_at = NOW() WHERE id = 1`);
  res.json({ game_state: 'ending' });
});

// Wipes every team's collected fragments and session history — for repeated
// test runs before the real event. Leaves users/stations alone but resets
// app_state back to 'progress' too, since a leftover 'ended'/'ending' would
// otherwise still lock participant screens after a reset.
router.post('/admin/reset-progress', async (req, res) => {
  if (req.body.password !== RESET_PASSWORD) {
    return res.status(403).json({ error: 'invalid password' });
  }
  const conn = await pool.getConnection();
  try {
    await conn.query('DELETE FROM tag_events');
    await conn.query('DELETE FROM game_sessions');
    await conn.query('DELETE FROM fragment_reveal_log');
    await conn.query(`UPDATE app_state SET game_state = 'progress', updated_at = NOW() WHERE id = 1`);
    res.json({ ok: true });
  } finally {
    conn.release();
  }
});

// Wipes every test login (users table) accumulated from repeat testing
// rounds — 최고관리자("김수") and 본당("본당") are special-cased in
// use-auth.tsx and never touch this table, so there's nothing to preserve
// here. Doesn't touch tag_events/game_sessions — pair with reset-progress
// for a fully clean slate.
router.post('/admin/reset-users', async (req, res) => {
  if (req.body.password !== RESET_PASSWORD) {
    return res.status(403).json({ error: 'invalid password' });
  }
  await pool.query('DELETE FROM users');
  res.json({ ok: true });
});

// ── broadcast / ending stats ─────────────────────────────────────────────

router.get('/stats/overall', async (req, res) => {
  const [teamsAndStations] = await pool.query(
    `SELECT COUNT(DISTINCT team_id, te.station_id) AS filled
     FROM tag_events te
     JOIN stations s ON s.station_id = te.station_id
     WHERE s.is_active = TRUE`,
  );
  const [activeStations] = await pool.query('SELECT COUNT(*) AS count FROM stations WHERE is_active = TRUE');

  const filled = teamsAndStations[0].filled;
  const total = 24 * activeStations[0].count;
  res.json({ count: filled, total, ratio: total > 0 ? filled / total : 0 });
});

module.exports = router;
// Also run on a fixed background interval instead of per-request — see server/index.js.
module.exports.autoCompleteExpiredSessions = autoCompleteExpiredSessions;
