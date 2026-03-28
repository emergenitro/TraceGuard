/**
 * In-memory store for scan state, reports, and infringements.
 * For production replace with a real database (Postgres, Redis, etc.)
 */
import { randomUUID } from "crypto";

const scans = new Map();
const reports = new Map();
const infringements = new Map();

// ── Scan ──────────────────────────────────────────────────────────────────────

export function createScan(assetType, assetName, assetData) {
  const id = randomUUID();
  const scan = {
    id,
    assetName,
    assetType,
    progressPercent: 0,
    status: "queued",
    startedAt: new Date().toISOString(),
    logs: [],
    nodes: generateNodes(),
    telemetry: {
      detectionConfidence: 0,
      visualMatching: 0,
      highPriorityRisk: false,
    },
    stream: [],
    _assetData: assetData,
    _email: assetData.email ?? null,
  };
  scans.set(id, scan);
  return id;
}

export function getScan(id) {
  return scans.get(id) ?? null;
}

export function getScanEmail(id) {
  return scans.get(id)?._email ?? null;
}

export function updateScan(id, updates) {
  const scan = scans.get(id);
  if (!scan) return;
  // Deep-merge telemetry if provided
  if (updates.telemetry) {
    updates.telemetry = { ...scan.telemetry, ...updates.telemetry };
  }
  Object.assign(scan, updates);
}

export function addLog(id, level, message) {
  const scan = scans.get(id);
  if (!scan) return;
  scan.logs.push({
    timestamp: new Date().toISOString(),
    level, // "INFO" | "SCAN" | "ALERT" | "DATA"
    message,
  });
}

export function addStreamItem(id, item) {
  const scan = scans.get(id);
  if (!scan) return;
  scan.stream.push(item);
}

// ── Report ────────────────────────────────────────────────────────────────────

export function createReport(scanId, infringementList) {
  for (const inf of infringementList) {
    infringements.set(inf.id, inf);
  }
  const report = {
    scanId,
    totalMatches: infringementList.length,
    infringements: infringementList,
  };
  reports.set(scanId, report);
  return report;
}

export function getReport(scanId) {
  return reports.get(scanId) ?? null;
}

// ── Infringement ──────────────────────────────────────────────────────────────

export function getInfringement(id) {
  return infringements.get(id) ?? null;
}

export function updateInfringement(id, updates) {
  const inf = infringements.get(id);
  if (!inf) return false;
  Object.assign(inf, updates);
  return true;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateNodes() {
  const regions = [
    "US-EAST",
    "US-WEST",
    "EU-WEST",
    "AP-SOUTH",
    "AP-EAST",
    "SA-EAST",
  ];
  return regions.map((region) => ({
    region,
    status: Math.random() > 0.3 ? "active" : "idle",
  }));
}
