const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
});

// Mirrors src/constants/stations.ts — kept here as plain data since the
// server doesn't build/run the TS app. Update both places if a station's
// letters/hall/name changes; see station_id for the physical QR/NFC value.
// `is_minigame` stations skip the admin's manual "세션 시작" — POST /tag-events
// auto-starts their timed session the moment a participant scans (see routes.js).
const STATION_SEED = [
  { station_id: 'RAHAB', name: '라합방', hall_name: '사무엘홀 · 다니엘홀', duration_minutes: 25, concurrent_capacity: 2, letters: [0], is_hidden: false, is_minigame: false, is_active: true },
  { station_id: 'NOAHROOM', name: '노아방', hall_name: '플레이그라운드', duration_minutes: 20, concurrent_capacity: 1, letters: [1], is_hidden: false, is_minigame: true, is_active: true },
  { station_id: 'ABELROOM', name: '아벨방', hall_name: '다윗홀', duration_minutes: 20, concurrent_capacity: 1, letters: [2], is_hidden: false, is_minigame: true, is_active: true },
  { station_id: 'JOSEPH', name: '요셉방', hall_name: '요셉홀', duration_minutes: 20, concurrent_capacity: 1, letters: [3], is_hidden: false, is_minigame: false, is_active: true },
  { station_id: 'JACOB', name: '야곱방', hall_name: '이삭홀', duration_minutes: 25, concurrent_capacity: 1, letters: [4], is_hidden: false, is_minigame: false, is_active: true },
  { station_id: 'ABRAHAM', name: '아브라함·사라방', hall_name: '아가페홀', duration_minutes: 20, concurrent_capacity: 1, letters: [5], is_hidden: false, is_minigame: false, is_active: true },
  { station_id: 'SAMSON', name: '삼손방', hall_name: '디모데홀', duration_minutes: 20, concurrent_capacity: 1, letters: [6], is_hidden: false, is_minigame: false, is_active: true },
  { station_id: 'DAVID', name: '에녹방', hall_name: '새로운홀', duration_minutes: 15, concurrent_capacity: 1, letters: [7], is_hidden: false, is_minigame: false, is_active: true },
  // 2026-07-20 CINEMA1~3로 3분리 배포 후 soft-disable — 삭제 대신 is_active만
  // 끔(운영/기록 보존, 재활성화 가능). POST /tag-events가 is_active=TRUE만
  // 받으므로 이 id로의 신규 스캔/부여는 이제 전부 거부됨. 참가자 지도에는
  // 여전히 "새로운 시네마" 카드/타일로 1개만 노출(letters:[8] 유지 — 팀이
  // CINEMA1~3 중 하나로 U를 획득하면 서버가 이 id를 합성 부여해 카드가 켜짐).
  { station_id: 'MYSTERYGAME', name: '새로운 시네마', hall_name: '여호수아홀', duration_minutes: 15, concurrent_capacity: 1, letters: [8], is_hidden: false, is_minigame: true, is_active: false },
  // 새로운시네마 영화 1/2/3 — 팀당 각 1회 스캔 가능, letters는 조건부라 빈
  // 배열([]): 그 팀의 첫 방문이면 U(fragment_letter='U', position 9), 이후
  // 방문은 와일드카드('*', 포지션 없음). 세션/준비중 개념 없음(is_minigame
  // false), 관리자 스테이션 목록에서도 숨김(is_hidden true) — 조각 부여 탭
  // 에서만 선택 가능. 자세한 로직은 routes.js CINEMA_STATION_IDS 참고.
  { station_id: 'CINEMA1', name: '새로운 시네마 · 영화 1', hall_name: '여호수아홀', duration_minutes: 15, concurrent_capacity: 1, letters: [], is_hidden: true, is_minigame: false, is_active: true },
  { station_id: 'CINEMA2', name: '새로운 시네마 · 영화 2', hall_name: '여호수아홀', duration_minutes: 15, concurrent_capacity: 1, letters: [], is_hidden: true, is_minigame: false, is_active: true },
  { station_id: 'CINEMA3', name: '새로운 시네마 · 영화 3', hall_name: '여호수아홀', duration_minutes: 15, concurrent_capacity: 1, letters: [], is_hidden: true, is_minigame: false, is_active: true },
  // 장소 당일 결정, QR 전용(NFC 없음) — venue를 하드코딩하지 않음. 물리적 방/부스가
  // 없어 세션(진행중 타이머) 개념 자체가 없음 — is_minigame도 false로 둠.
  { station_id: 'HIDDENLETTER', name: '숨은글자찾기', hall_name: null, duration_minutes: 10, concurrent_capacity: 1, letters: [9], is_hidden: true, is_minigame: false, is_active: true },
];

async function initSchema() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        person_id  VARCHAR(36) PRIMARY KEY,
        name       VARCHAR(50) NOT NULL,
        team_id    INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS stations (
        station_id          VARCHAR(20) PRIMARY KEY,
        name                VARCHAR(50) NOT NULL,
        hall_name           VARCHAR(100),
        duration_minutes    INT NOT NULL DEFAULT 20,
        concurrent_capacity INT NOT NULL DEFAULT 1,
        letters             JSON NOT NULL,
        is_active           BOOLEAN DEFAULT TRUE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS tag_events (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        person_id       VARCHAR(36) NOT NULL,
        team_id         INT NOT NULL,
        station_id      VARCHAR(20) NOT NULL,
        fragment_letter VARCHAR(5),
        tagged_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_team_station (team_id, station_id)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS fragment_reveal_log (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        person_id   VARCHAR(36),
        station_id  VARCHAR(20),
        revealed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        source      ENUM('own_tag','team_sync')
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS game_sessions (
        id               INT AUTO_INCREMENT PRIMARY KEY,
        station_id       VARCHAR(20) NOT NULL,
        team_id          INT NOT NULL,
        started_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
        expected_end_at  DATETIME NOT NULL,
        status           ENUM('in_progress','completed','cancelled') DEFAULT 'in_progress',
        ended_at         DATETIME NULL,
        ended_by         ENUM('auto','admin') NULL,
        started_by_name  VARCHAR(50) NULL,
        hall_label       VARCHAR(20) NULL,
        INDEX idx_status (status)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS station_prep_status (
        station_id    VARCHAR(20) NOT NULL,
        hall_label    VARCHAR(20) NOT NULL DEFAULT '',
        is_preparing  BOOLEAN NOT NULL DEFAULT FALSE,
        tip           VARCHAR(100) NULL,
        is_recruiting BOOLEAN NOT NULL DEFAULT FALSE,
        recruit_tip   VARCHAR(100) NULL,
        updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (station_id, hall_label)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS app_state (
        id         INT PRIMARY KEY DEFAULT 1,
        game_state ENUM('progress','ended') NOT NULL DEFAULT 'progress',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Widen the enum for the runner-progress-bar ending flow — safe to
    // re-run every deploy (MODIFY COLUMN with the same definition is a no-op).
    await conn.query(`
      ALTER TABLE app_state
      MODIFY COLUMN game_state ENUM('progress','ended','ending') NOT NULL DEFAULT 'progress'
    `);

    await conn.query(`INSERT IGNORE INTO app_state (id, game_state) VALUES (1, 'progress')`);

    // Login's dedup check (see routes.js dedupedName) scans users.name on every
    // signup; ~300 rows is trivial either way, but the index is free insurance.
    // ADD INDEX has no IF NOT EXISTS in this MySQL version, so swallow the
    // "duplicate key name" error on repeat deploys instead.
    try {
      await conn.query('ALTER TABLE users ADD INDEX idx_name (name)');
    } catch (err) {
      if (err.code !== 'ER_DUP_KEYNAME') throw err;
    }

    // 2026-07 재배치: 숨은글자찾기(지도/목록에서 숨김)와 노아방/아벨방/영화관
    // (태그 시 자동으로 세션을 시작하는 미니게임) 플래그. ADD COLUMN has no
    // IF NOT EXISTS in this MySQL version, so swallow the "duplicate column" error.
    for (const ddl of [
      'ALTER TABLE stations ADD COLUMN is_hidden BOOLEAN NOT NULL DEFAULT FALSE',
      'ALTER TABLE stations ADD COLUMN is_minigame BOOLEAN NOT NULL DEFAULT FALSE',
      // 라합방(사무엘홀/다니엘홀)처럼 한 스테이션을 여러 홀에서 독립적으로 운영할
      // 때, 세션이 어느 홀 소속인지 구분하기 위한 표시 — 그 외 스테이션은 항상 NULL.
      'ALTER TABLE game_sessions ADD COLUMN hall_label VARCHAR(20) NULL',
      // 대결 구도 스테이션에서 상대 팀을 기다리는 중임을 표시하는 두 번째
      // 수동 플래그 — station_prep_status에 준비중과 나란히 저장.
      'ALTER TABLE station_prep_status ADD COLUMN is_recruiting BOOLEAN NOT NULL DEFAULT FALSE',
      'ALTER TABLE station_prep_status ADD COLUMN recruit_tip VARCHAR(100) NULL',
      // 라합방의 사무엘홀/다니엘홀처럼 한 스테이션을 여러 홀에서 독립적으로
      // 운영하는 경우 준비중 상태도 홀별로 따로 켤 수 있도록 — 그 외 스테이션은
      // 항상 빈 문자열 하나만 씀 (PRIMARY KEY에 NULL을 못 넣어 빈 문자열로 대체).
      "ALTER TABLE station_prep_status ADD COLUMN hall_label VARCHAR(20) NOT NULL DEFAULT ''",
    ]) {
      try {
        await conn.query(ddl);
      } catch (err) {
        if (err.code !== 'ER_DUP_FIELDNAME') throw err;
      }
    }

    // Re-run-safe: dropping and re-adding the same composite key is a no-op
    // once it's already in place, since every existing row already satisfies
    // uniqueness on (station_id, hall_label).
    await conn.query(
      'ALTER TABLE station_prep_status DROP PRIMARY KEY, ADD PRIMARY KEY (station_id, hall_label)',
    );

    for (const s of STATION_SEED) {
      await conn.query(
        `INSERT INTO stations (station_id, name, hall_name, duration_minutes, concurrent_capacity, letters, is_active, is_hidden, is_minigame)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           hall_name = VALUES(hall_name),
           duration_minutes = VALUES(duration_minutes),
           concurrent_capacity = VALUES(concurrent_capacity),
           letters = VALUES(letters),
           is_active = VALUES(is_active),
           is_hidden = VALUES(is_hidden),
           is_minigame = VALUES(is_minigame)`,
        [
          s.station_id,
          s.name,
          s.hall_name,
          s.duration_minutes,
          s.concurrent_capacity,
          JSON.stringify(s.letters),
          s.is_active,
          s.is_hidden,
          s.is_minigame,
        ],
      );
    }
  } finally {
    conn.release();
  }
}

module.exports = { pool, initSchema };
