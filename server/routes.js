const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('./db');

const router = express.Router();

const RUN_TO_JESUS = 'RUNTOJESUS';
// Matches the client-side super-admin gate — checked server-side too since
// this one wipes every team's progress (blast radius is the whole event,
// unlike the per-user edit endpoints), see settings.tsx ADMIN_PASSWORD.
const RESET_PASSWORD = 'saeroun0906';

// 새로운시네마의 영화 1/2/3 — 팀당 한 곳당 1회씩, 최대 3회 스캔 가능하지만
// 글자 배정은 조건부: 그 팀의 첫 방문(어느 영화든)만 진짜 U(position 9)를
// 받고, 이후 방문은 전부 와일드카드('*', 포지션 없음). 2026-07-20 진장
// 스펙 확정 — station.letters에 의존하는 일반 스테이션 로직과 분리해서
// 이 3개 id만 별도 분기로 처리한다.
const CINEMA_STATION_IDS = ['CINEMA1', 'CINEMA2', 'CINEMA3'];
const CINEMA_U_LETTER_INDEX = 8; // RUN_TO_JESUS[8] === 'U', 다른 방(노아방)의 U(index 1)와 별개.

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

// 새로운시네마 전용 분기 — station.letters가 없는(조건부) 3개 station_id만
// 여기서 처리하고 나머지는 손대지 않은 기존 경로를 그대로 탄다. 잠금은
// station_id별이 아니라 team_id 전체 CINEMA 범위로 걸어야 한다: 팀이
// CINEMA1/CINEMA2를 거의 동시에 스캔하면 "누가 첫 U인지" 판정 자체가
// 레이스에 걸리기 때문(같은 station_id 재스캔 레이스와는 다른 문제).
async function handleCinemaTagEvent(conn, { person_id, team_id, station_id }) {
  const lockName = `tag_events:cinema:${team_id}`;
  const [lockRows] = await conn.query('SELECT GET_LOCK(?, 5) AS acquired', [lockName]);
  if (!lockRows[0].acquired) return { status: 503, body: { error: 'busy, try again' } };

  try {
    const [stationRows] = await conn.query(
      'SELECT 1 FROM stations WHERE station_id = ? AND is_active = TRUE',
      [station_id],
    );
    if (!stationRows.length) return { status: 404, body: { error: 'unknown or inactive station' } };

    // 이 영화(정확히 이 station_id)를 이미 태그했으면 재스캔은 그냥 무시 —
    // 일반 스테이션과 달리 여기선 중복 삽입이 와일드카드 개수를 틀어지게
    // 만들기 때문에 반드시 막아야 함.
    const [priorThisMovie] = await conn.query(
      'SELECT COUNT(*) AS count FROM tag_events WHERE team_id = ? AND station_id = ?',
      [team_id, station_id],
    );
    if (priorThisMovie[0].count > 0) {
      return { status: 201, body: { station_id, letters: [], newForTeam: false, fragmentLetter: null } };
    }

    const [priorU] = await conn.query(
      `SELECT COUNT(*) AS count FROM tag_events WHERE team_id = ? AND station_id IN (?) AND fragment_letter = 'U'`,
      [team_id, CINEMA_STATION_IDS],
    );
    const fragmentLetter = priorU[0].count === 0 ? 'U' : '*';

    await conn.query(
      'INSERT INTO tag_events (person_id, team_id, station_id, fragment_letter) VALUES (?, ?, ?, ?)',
      [person_id, team_id, station_id, fragmentLetter],
    );

    return {
      status: 201,
      body: {
        station_id,
        letters: fragmentLetter === 'U' ? [CINEMA_U_LETTER_INDEX] : [],
        newForTeam: true,
        fragmentLetter,
      },
    };
  } finally {
    await conn.query('SELECT RELEASE_LOCK(?)', [lockName]);
  }
}

router.post('/tag-events', async (req, res) => {
  const { person_id, team_id, station_id } = req.body;
  if (!person_id || !team_id || !station_id) {
    return res.status(400).json({ error: 'person_id, team_id, station_id are required' });
  }

  if (CINEMA_STATION_IDS.includes(station_id)) {
    const conn = await pool.getConnection();
    try {
      const result = await handleCinemaTagEvent(conn, { person_id, team_id, station_id });
      return res.status(result.status).json(result.body);
    } finally {
      conn.release();
    }
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

      // 진행중(game_sessions)은 무조건 관리자의 수동 "세션 시작"으로만 켜진다
      // — QR/NFC 태그는 조각(글자) 지급에만 관여하고 세션 상태에는 절대
      // 손대지 않는다. (예전엔 노아방/아벨방이 태그 시점에 자동으로 세션을
      // 시작했지만, 참가자가 QR을 찍자마자 진행중으로 바뀌는 게 의도와
      // 달라 폐지 — is_minigame 컬럼은 남아있지만 이제 아무 데서도 안 읽음.)

      res.status(201).json({ station_id, letters: station.letters, newForTeam, fragmentLetter: station.letters.length ? RUN_TO_JESUS[station.letters[0]] : null });
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
  let stationIds = stationIdRows.map((r) => r.station_id);

  // CINEMA1~3는 station.letters가 비어 있어(조건부 배정) 일반 union 로직이
  // 아무것도 못 얻는다 — 실제 U(position 9) 보유 여부를 tag_events에서 직접
  // 확인하고, 있으면 참가자 화면이 이미 이해하는 "MYSTERYGAME" id를 합성으로
  // 끼워 넣어 기존 클라이언트 로직(모자이크 점등, 카드 완료 표시)이 그대로
  // 먹히게 한다. 와일드카드('*')는 개수만 별도로 반환 — letters/stationIds
  // 어디에도 절대 섞이지 않음(포지션 없는 보너스 조각이라 10칸 집계 제외).
  let wildcardCount = 0;
  if (stationIds.some((id) => CINEMA_STATION_IDS.includes(id))) {
    const [cinemaRows] = await pool.query(
      `SELECT fragment_letter FROM tag_events WHERE team_id = ? AND station_id IN (?)`,
      [req.params.team_id, CINEMA_STATION_IDS],
    );
    wildcardCount = cinemaRows.filter((r) => r.fragment_letter === '*').length;
    if (cinemaRows.some((r) => r.fragment_letter === 'U')) stationIds = [...stationIds, 'MYSTERYGAME'];
  }

  if (!stationIds.length) return res.json({ stationIds: [], letters: [], wildcardCount });

  const [stationRows] = await pool.query(
    `SELECT letters FROM stations WHERE station_id IN (${stationIds.map(() => '?').join(',')})`,
    stationIds,
  );
  const letters = [...new Set(stationRows.flatMap((r) => parseLetters(r).letters))].sort((a, b) => a - b);
  res.json({ stationIds, letters, wildcardCount });
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
// Two independent manual flags a station's staff flips in /admin instead of
// a timer or queue — see STATION_QUEUE_GUIDE.md hand-off chat for why (the
// full queue system in that file's body was cancelled; only these simpler
// toggles shipped):
//   - is_preparing/tip: "준비중🧹" between games (setup time varies too much
//     on-site to time).
//   - is_recruiting/recruit_tip: "도전자 모집중" for versus-format stations,
//     so a team that arrives before an opponent doesn't look like dead air.

router.get('/prep-status', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT station_id, hall_label, is_preparing, tip, is_recruiting, recruit_tip
     FROM station_prep_status WHERE is_preparing = TRUE OR is_recruiting = TRUE`,
  );
  res.json(rows);
});

router.put('/prep-status/:station_id', async (req, res) => {
  const { is_preparing, tip, is_recruiting, recruit_tip, hall_label } = req.body;
  if (is_preparing === undefined && is_recruiting === undefined) {
    return res.status(400).json({ error: 'is_preparing or is_recruiting is required' });
  }
  // '' (not NULL — can't sit in a PRIMARY KEY) means "the whole station, no
  // hall split" — every station except 라합방 only ever uses this.
  const hall = hall_label ?? '';

  // Each toggle only ever sends its own fields — merge onto the existing row
  // so updating one flag never clobbers the other's current value.
  const [existingRows] = await pool.query(
    'SELECT * FROM station_prep_status WHERE station_id = ? AND hall_label = ?',
    [req.params.station_id, hall],
  );
  const existing = existingRows[0];
  const next = {
    is_preparing: is_preparing !== undefined ? is_preparing : (existing?.is_preparing ?? false),
    tip: tip !== undefined ? tip : (existing?.tip ?? null),
    is_recruiting: is_recruiting !== undefined ? is_recruiting : (existing?.is_recruiting ?? false),
    recruit_tip: recruit_tip !== undefined ? recruit_tip : (existing?.recruit_tip ?? null),
  };

  await pool.query(
    `INSERT INTO station_prep_status (station_id, hall_label, is_preparing, tip, is_recruiting, recruit_tip) VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       is_preparing = VALUES(is_preparing), tip = VALUES(tip),
       is_recruiting = VALUES(is_recruiting), recruit_tip = VALUES(recruit_tip)`,
    [req.params.station_id, hall, next.is_preparing, next.tip, next.is_recruiting, next.recruit_tip],
  );
  const [rows] = await pool.query(
    'SELECT station_id, hall_label, is_preparing, tip, is_recruiting, recruit_tip FROM station_prep_status WHERE station_id = ? AND hall_label = ?',
    [req.params.station_id, hall],
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

// 스태프가 방마다 어느 팀이 완료했는지 한눈에 보는 용도(관리자 "참여 현황"
// 탭) — 라합방은 사무엘홀/다니엘홀 둘 다 QR/부여 페이로드가 station_id
// 하나(RAHAB)라 어느 홀에서 완료했는지는 저장돼 있지 않다(둘 중 하나만
// 해도 완료라 그 자체로는 문제 없지만, 홀별로 나눠 보여줄 수는 없음).
router.get('/admin/participation', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT DISTINCT station_id, team_id FROM tag_events WHERE station_id NOT IN (?)',
    [CINEMA_STATION_IDS],
  );
  const byStation = {};
  for (const r of rows) {
    (byStation[r.station_id] ??= []).push(r.team_id);
  }

  // 새로운시네마는 CINEMA1~3 중 어느 것이든 U(진짜 조각)를 받은 팀만 "완료"로 친다.
  const [cinemaRows] = await pool.query(
    `SELECT DISTINCT team_id FROM tag_events WHERE station_id IN (?) AND fragment_letter = 'U'`,
    [CINEMA_STATION_IDS],
  );
  if (cinemaRows.length) {
    byStation.MYSTERYGAME = cinemaRows.map((r) => r.team_id);
  }

  const result = Object.entries(byStation).map(([station_id, teamIds]) => ({
    station_id,
    teamIds: teamIds.sort((a, b) => a - b),
  }));
  res.json(result);
});

// ── broadcast / ending stats ─────────────────────────────────────────────

router.get('/stats/overall', async (req, res) => {
  // 새로운시네마가 CINEMA1~3 세 station_id로 나뉘면서 "활성 스테이션 수"가
  // 더 이상 "필요한 조각 슬롯 수(10)"와 같지 않게 됐다 — 그대로 두면 영화를
  // 2~3개 다 봐야 진행률이 채워지는 것처럼 분모가 부풀려짐. CINEMA는 팀당
  // 딱 1칸(U 확보 여부)만 세고, 나머지 스테이션은 기존 방식 그대로 센다.
  const [nonCinemaRows] = await pool.query(
    `SELECT COUNT(DISTINCT team_id, te.station_id) AS filled
     FROM tag_events te
     JOIN stations s ON s.station_id = te.station_id
     WHERE s.is_active = TRUE AND te.station_id NOT IN (?)`,
    [CINEMA_STATION_IDS],
  );
  const [cinemaRows] = await pool.query(
    `SELECT COUNT(DISTINCT team_id) AS filled FROM tag_events WHERE station_id IN (?) AND fragment_letter = 'U'`,
    [CINEMA_STATION_IDS],
  );

  const filled = nonCinemaRows[0].filled + cinemaRows[0].filled;
  const total = 24 * RUN_TO_JESUS.length;
  res.json({ count: filled, total, ratio: total > 0 ? filled / total : 0 });
});

module.exports = router;
// Also run on a fixed background interval instead of per-request — see server/index.js.
module.exports.autoCompleteExpiredSessions = autoCompleteExpiredSessions;
