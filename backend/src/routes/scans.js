import { Router } from "express";
import { getScan, updateScan } from "../store.js";

const router = Router();

/**
 * GET /api/scans/:id
 * Returns the full ScanStatus object (internal fields stripped).
 */
router.get("/:id", (req, res) => {
  const scan = getScan(req.params.id);
  if (!scan) {
    return res.status(404).json({ error: "Scan not found" });
  }

  // Strip internal-only fields before sending to the client
  const { _assetData, ...publicScan } = scan;
  res.json(publicScan);
});

/**
 * POST /api/scans/:id/pause
 * Pauses an in-progress scan.
 */
router.post("/:id/pause", (req, res) => {
  const scan = getScan(req.params.id);
  if (!scan) return res.status(404).json({ error: "Scan not found" });
  if (scan.status !== "scanning") {
    return res.status(409).json({ error: "Scan is not currently running" });
  }
  updateScan(req.params.id, { status: "paused" });
  res.status(204).send();
});

/**
 * POST /api/scans/:id/resume
 * Resumes a paused scan.
 */
router.post("/:id/resume", (req, res) => {
  const scan = getScan(req.params.id);
  if (!scan) return res.status(404).json({ error: "Scan not found" });
  if (scan.status !== "paused") {
    return res.status(409).json({ error: "Scan is not currently paused" });
  }
  updateScan(req.params.id, { status: "scanning" });
  res.status(204).send();
});

export default router;
