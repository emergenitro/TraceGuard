import { randomUUID } from "crypto";
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
    _link: row.link,
    _productTitle: row.product_title,
  };
}

// ── Scan ──────────────────────────────────────────────────────────────────────

export async function createScan(assetType, assetName, assetData) {
  const id = randomUUID();
  const nodes = generateNodes();
  const telemetry = { detectionConfidence: 0, visualMatching: 0, highPriorityRisk: false };

  await pool.query(
    `INSERT INTO scans
       (id, asset_name, asset_type, progress_percent, status, started_at, logs, nodes, telemetry, stream, asset_data, email)
     VALUES ($1, $2, $3, 0, 'queued', NOW(), '[]', $4, $5, '[]', $6, $7)`,
    [
      id,
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

export async function getScan(id) {
  const { rows } = await pool.query("SELECT * FROM scans WHERE id = $1", [id]);
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

export async function getReport(scanId) {
  // A report only exists once the scan is complete
  const { rows: scanRows } = await pool.query(
    "SELECT status FROM scans WHERE id = $1",
    [scanId]
  );
  if (!scanRows[0] || scanRows[0].status !== "complete") return null;

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateNodes() {
  const regions = ["US-EAST", "US-WEST", "EU-WEST", "AP-SOUTH", "AP-EAST", "SA-EAST"];
  return regions.map((region) => ({
    region,
    status: Math.random() > 0.3 ? "active" : "idle",
  }));
}
