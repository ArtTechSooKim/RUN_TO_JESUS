const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
});

// Mirrors src/constants/stations.ts — kept here as plain data since the
// server doesn't build/run the TS app. Update both places if a station's
// letters/hall/name changes; see station_id for the physical QR/NFC value.
const STATION_SEED = [
  { station_id: 'RAHAB', name: '라합방', hall_name: '사무엘홀 · 다니엘홀', duration_minutes: 20, concurrent_capacity: 2, letters: [0, 1, 2] },
  { station_id: 'JOSEPH', name: '요셉방', hall_name: '요셉홀', duration_minutes: 20, concurrent_capacity: 1, letters: [3] },
  { station_id: 'JACOB', name: '블러핑', hall_name: '이삭홀', duration_minutes: 15, concurrent_capacity: 1, letters: [4] },
  { station_id: 'ABRAHAM', name: '아브라함방', hall_name: '아가페홀', duration_minutes: 20, concurrent_capacity: 1, letters: [5] },
  { station_id: 'SAMSON', name: '삼손방', hall_name: '디모데홀', duration_minutes: 15, concurrent_capacity: 1, letters: [6] },
  { station_id: 'DAVID', name: '도미노', hall_name: '새로운홀', duration_minutes: 10, concurrent_capacity: 1, letters: [7, 8, 9] },
  { station_id: 'NOAHROOM', name: '노아방', hall_name: null, duration_minutes: 15, concurrent_capacity: 1, letters: [] },
  { station_id: 'ABELROOM', name: '아벨방', hall_name: null, duration_minutes: 15, concurrent_capacity: 1, letters: [] },
  { station_id: 'MYSTERYGAME', name: '미정게임', hall_name: '여호수아홀 (극장)', duration_minutes: 15, concurrent_capacity: 1, letters: [] },
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
        INDEX idx_status (status)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS app_state (
        id         INT PRIMARY KEY DEFAULT 1,
        game_state ENUM('progress','ended') NOT NULL DEFAULT 'progress',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`INSERT IGNORE INTO app_state (id, game_state) VALUES (1, 'progress')`);

    for (const s of STATION_SEED) {
      await conn.query(
        `INSERT INTO stations (station_id, name, hall_name, duration_minutes, concurrent_capacity, letters, is_active)
         VALUES (?, ?, ?, ?, ?, ?, TRUE)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           hall_name = VALUES(hall_name),
           duration_minutes = VALUES(duration_minutes),
           concurrent_capacity = VALUES(concurrent_capacity),
           letters = VALUES(letters)`,
        [s.station_id, s.name, s.hall_name, s.duration_minutes, s.concurrent_capacity, JSON.stringify(s.letters)],
      );
    }
  } finally {
    conn.release();
  }
}

module.exports = { pool, initSchema };
