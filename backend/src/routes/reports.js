import { Router } from "express";
import { getReport, getInfringement, updateInfringement } from "../store.js";

const router = Router();

/**
 * GET /api/reports/:scanId
 * Returns the full ReportSummary: { scanId, totalMatches, infringements[] }
 */
router.get("/:scanId", async (req, res) => {
  const report = await getReport(req.params.scanId);
  if (!report) {
    return res.status(404).json({ error: "Report not found. Scan may still be running." });
  }

  // Strip internal fields (_link, _productTitle) from each infringement
  const sanitised = {
    ...report,
    infringements: report.infringements.map(({ _link, _productTitle, ...pub }) => pub),
  };

  res.json(sanitised);
});

/**
 * POST /api/reports/:scanId/export
 * Generates a downloadable report URL.
 */
router.post("/:scanId/export", async (req, res) => {
  const report = await getReport(req.params.scanId);
  if (!report) {
    return res.status(404).json({ error: "Report not found" });
  }
  res.json({
    downloadUrl: `/api/reports/${req.params.scanId}/download`,
  });
});

/**
 * GET /api/reports/:scanId/download
 * Streams the report as JSON.
 */
router.get("/:scanId/download", async (req, res) => {
  const report = await getReport(req.params.scanId);
  if (!report) {
    return res.status(404).json({ error: "Report not found" });
  }
  const sanitised = {
    ...report,
    infringements: report.infringements.map(({ _link, _productTitle, ...pub }) => pub),
    exportedAt: new Date().toISOString(),
  };
  res.setHeader("Content-Type", "application/json");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="ip-report-${req.params.scanId}.json"`
  );
  res.json(sanitised);
});

/**
 * POST /api/reports/:scanId/mark-reviewed
 * Bulk-sets all UNACTIONED infringements to PENDING_REVIEW.
 */
router.post("/:scanId/mark-reviewed", async (req, res) => {
  const report = await getReport(req.params.scanId);
  if (!report) {
    return res.status(404).json({ error: "Report not found" });
  }
  for (const inf of report.infringements) {
    if (inf.status === "UNACTIONED") {
      await updateInfringement(inf.id, { status: "PENDING_REVIEW" });
    }
  }
  res.status(204).send();
});

export default router;
