import { randomUUID, createHash, randomBytes } from "crypto";
import pool from "./db.js";

// ── Row mappers ───────────────────────────────────────────────────────────────

function rowToScan(row) {
  return {
    id: row.id,
    assetName: row.asset_name,
    assetType: row.asset_type,
    progressPercent: row.progress_percent,
    status: row.status,
    startedAt: row.started_at instanceof Date
      ? row.started_at.toISOString()
      : row.started_at,
    logs: row.logs,
    nodes: row.nodes,
    telemetry: row.telemetry,
    stream: row.stream,
    _assetData: row.asset_data,
    _email: row.email,
  };
}

function rowToInfringement(row) {
  return {
    id: row.id,
    domain: row.domain,
    matchPercent: row.match_percent,
    severity: row.severity,
    tags: row.tags,
    sourceType: row.source_type,
    status: row.status,
    systemNote: row.system_note,
    screenshotUrl: row.screenshot_url,
    link: row.link,
    _productTitle: row.product_title,
  };
}

// ── Scan ──────────────────────────────────────────────────────────────────────

export async function createScan(assetType, assetName, assetData, userId) {
  const id = randomUUID();
  const nodes = generateNodes();
  const telemetry = { detectionConfidence: 0, visualMatching: 0, highPriorityRisk: false };

  await pool.query(
    `INSERT INTO scans
       (id, user_id, asset_name, asset_type, progress_percent, status, started_at, logs, nodes, telemetry, stream, asset_data, email)
     VALUES ($1, $2, $3, $4, 0, 'queued', NOW(), '[]', $5, $6, '[]', $7, $8)`,
    [
      id,
      userId ?? null,
      assetName,
      assetType,
      JSON.stringify(nodes),
      JSON.stringify(telemetry),
      JSON.stringify(assetData),
      assetData.email ?? null,
    ]
  );
  return id;
}

export async function getScan(id, userId) {
  const { rows } = userId
    ? await pool.query("SELECT * FROM scans WHERE id = $1 AND user_id = $2", [id, userId])
    : await pool.query("SELECT * FROM scans WHERE id = $1", [id]);
  return rows[0] ? rowToScan(rows[0]) : null;
}

export async function getScanEmail(id) {
  const { rows } = await pool.query("SELECT email FROM scans WHERE id = $1", [id]);
  return rows[0]?.email ?? null;
}

export async function updateScan(id, updates) {
  const setClauses = [];
  const values = [];
  let i = 1;

  if (updates.status !== undefined) {
    setClauses.push(`status = $${i++}`);
    values.push(updates.status);
  }
  if (updates.progressPercent !== undefined) {
    setClauses.push(`progress_percent = $${i++}`);
    values.push(updates.progressPercent);
  }
  if (updates.telemetry !== undefined) {
    // Shallow-merge into existing telemetry (mirrors original Object.assign behaviour)
    setClauses.push(`telemetry = telemetry || $${i++}::jsonb`);
    values.push(JSON.stringify(updates.telemetry));
  }

  if (setClauses.length === 0) return;
  values.push(id);
  await pool.query(
    `UPDATE scans SET ${setClauses.join(", ")} WHERE id = $${i}`,
    values
  );
}

export async function addLog(id, level, message) {
  const entry = JSON.stringify([{ timestamp: new Date().toISOString(), level, message }]);
  await pool.query(
    "UPDATE scans SET logs = logs || $1::jsonb WHERE id = $2",
    [entry, id]
  );
}

export async function addStreamItem(id, item) {
  await pool.query(
    "UPDATE scans SET stream = stream || $1::jsonb WHERE id = $2",
    [JSON.stringify([item]), id]
  );
}

// ── Report ────────────────────────────────────────────────────────────────────

export async function createReport(scanId, infringementList) {
  if (infringementList.length > 0) {
    const placeholders = infringementList
      .map((_, idx) => {
        const b = idx * 12;
        return `($${b+1},$${b+2},$${b+3},$${b+4},$${b+5},$${b+6},$${b+7},$${b+8},$${b+9},$${b+10},$${b+11},$${b+12})`;
      })
      .join(", ");

    const values = infringementList.flatMap((inf) => [
      inf.id,
      scanId,
      inf.domain,
      inf.matchPercent,
      inf.severity,
      JSON.stringify(inf.tags),
      inf.sourceType,
      inf.status,
      inf.systemNote,
      inf.screenshotUrl ?? null,
      inf._link ?? null,
      inf._productTitle ?? null,
    ]);

    await pool.query(
      `INSERT INTO infringements
         (id, scan_id, domain, match_percent, severity, tags, source_type, status, system_note, screenshot_url, link, product_title)
       VALUES ${placeholders}`,
      values
    );
  }

  return { scanId, totalMatches: infringementList.length, infringements: infringementList };
}

export async function getReport(scanId, userId) {
  const { rows: scanRows } = await pool.query(
    "SELECT status, user_id FROM scans WHERE id = $1",
    [scanId]
  );
  if (!scanRows[0] || scanRows[0].status !== "complete") return null;
  if (userId && scanRows[0].user_id !== userId) return null;

  const { rows } = await pool.query(
    "SELECT * FROM infringements WHERE scan_id = $1",
    [scanId]
  );
  const infringementList = rows.map(rowToInfringement);
  return { scanId, totalMatches: infringementList.length, infringements: infringementList };
}

// ── Infringement ──────────────────────────────────────────────────────────────

export async function getInfringement(id) {
  const { rows } = await pool.query(
    "SELECT * FROM infringements WHERE id = $1",
    [id]
  );
  return rows[0] ? rowToInfringement(rows[0]) : null;
}

export async function getInfringementWithOwner(id) {
  const { rows } = await pool.query(
    `SELECT i.*, s.user_id AS scan_user_id
     FROM infringements i
     JOIN scans s ON s.id = i.scan_id
     WHERE i.id = $1`,
    [id]
  );
  if (!rows[0]) return null;
  return { ...rowToInfringement(rows[0]), scanUserId: rows[0].scan_user_id };
}

export async function updateInfringement(id, updates) {
  const setClauses = [];
  const values = [];
  let i = 1;

  if (updates.status !== undefined) {
    setClauses.push(`status = $${i++}`);
    values.push(updates.status);
  }

  if (setClauses.length === 0) return false;
  values.push(id);
  const result = await pool.query(
    `UPDATE infringements SET ${setClauses.join(", ")} WHERE id = $${i}`,
    values
  );
  return result.rowCount > 0;
}

export async function getStats() {
  const { rows } = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM scans) AS total_scans,
      (SELECT COUNT(*) FROM infringements WHERE status = 'UNACTIONED') AS active_alerts
  `);
  return {
    totalScans: parseInt(rows[0].total_scans, 10),
    activeAlerts: parseInt(rows[0].active_alerts, 10),
  };
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function createUser(email) {
  const id = randomUUID();
  const { rows } = await pool.query(
    "INSERT INTO users (id, email) VALUES ($1, $2) RETURNING *",
    [id, email]
  );
  return { id: rows[0].id, email: rows[0].email };
}

export async function getUserByEmail(email) {
  const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  return rows[0] ? { id: rows[0].id, email: rows[0].email } : null;
}

export async function getUserById(id) {
  const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  return rows[0] ? { id: rows[0].id, email: rows[0].email } : null;
}

// ── OTPs ──────────────────────────────────────────────────────────────────────

export async function upsertOtp(email, otp) {
  const salt = randomBytes(16).toString("hex");
  const hashedOtp = createHash("sha256").update(otp + salt).digest("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await pool.query(
    `INSERT INTO otps (email, hashed_otp, salt, expires_at, created_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (email) DO UPDATE
       SET hashed_otp = $2, salt = $3, expires_at = $4, created_at = NOW()`,
    [email, hashedOtp, salt, expiresAt]
  );
}

export async function verifyAndConsumeOtp(email, otp) {
  const { rows } = await pool.query("SELECT * FROM otps WHERE email = $1", [email]);
  if (!rows[0]) return false;
  const { hashed_otp, salt, expires_at } = rows[0];
  if (new Date() > new Date(expires_at)) {
    await pool.query("DELETE FROM otps WHERE email = $1", [email]);
    return false;
  }
  const hash = createHash("sha256").update(otp + salt).digest("hex");
  if (hash !== hashed_otp) return false;
  await pool.query("DELETE FROM otps WHERE email = $1", [email]);
  return true;
}

export async function getOtpCreatedAt(email) {
  const { rows } = await pool.query("SELECT created_at FROM otps WHERE email = $1", [email]);
  return rows[0] ? new Date(rows[0].created_at) : null;
}

// ── Refresh tokens ────────────────────────────────────────────────────────────

export async function createRefreshToken(userId) {
  const token = randomBytes(40).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await pool.query(
    "INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)",
    [token, userId, expiresAt]
  );
  return token;
}

export async function getRefreshToken(token) {
  const { rows } = await pool.query(
    "SELECT * FROM refresh_tokens WHERE token = $1",
    [token]
  );
  return rows[0] ?? null;
}

export async function deleteRefreshToken(token) {
  await pool.query("DELETE FROM refresh_tokens WHERE token = $1", [token]);
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function getUserScans(userId) {
  const { rows } = await pool.query(
    `SELECT s.id, s.asset_name, s.asset_type, s.status, s.started_at, s.progress_percent,
            COUNT(i.id) FILTER (WHERE i.status = 'UNACTIONED') AS alert_count,
            COUNT(i.id) AS total_infringements
     FROM scans s
     LEFT JOIN infringements i ON i.scan_id = s.id
     WHERE s.user_id = $1
     GROUP BY s.id
     ORDER BY s.started_at DESC`,
    [userId]
  );
  return rows.map((r) => ({
    id: r.id,
    assetName: r.asset_name,
    assetType: r.asset_type,
    status: r.status,
    startedAt: r.started_at instanceof Date ? r.started_at.toISOString() : r.started_at,
    progressPercent: r.progress_percent,
    alertCount: parseInt(r.alert_count, 10),
    totalInfringements: parseInt(r.total_infringements, 10),
  }));
}

export async function getUserAlertCount(userId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*) AS count
     FROM infringements i
     JOIN scans s ON s.id = i.scan_id
     WHERE s.user_id = $1 AND i.status = 'UNACTIONED'`,
    [userId]
  );
  return parseInt(rows[0].count, 10);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateNodes() {
  const regions = ["US-EAST", "US-WEST", "EU-WEST", "AP-SOUTH", "AP-EAST", "SA-EAST"];
  return regions.map((region) => ({
    region,
    status: Math.random() > 0.3 ? "active" : "idle",
  }));
}
