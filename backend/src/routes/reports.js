import { Router } from "express";
import { getReport, getInfringement, updateInfringement } from "../store.js";

const router = Router();

router.get("/:scanId", async (req, res) => {
  const report = await getReport(req.params.scanId, req.userId);
  if (!report) {
    return res.status(404).json({ error: "Report not found. Scan may still be running." });
  }

  const sanitised = {
    ...report,
    infringements: report.infringements.map(({ _productTitle, ...pub }) => pub),
  };

  res.json(sanitised);
});

router.post("/:scanId/export", async (req, res) => {
  const report = await getReport(req.params.scanId, req.userId);
  if (!report) {
    return res.status(404).json({ error: "Report not found" });
  }
  res.json({
    downloadUrl: `/api/reports/${req.params.scanId}/download`,
  });
});

router.get("/:scanId/download", async (req, res) => {
  const report = await getReport(req.params.scanId, req.userId);
  if (!report) {
    return res.status(404).json({ error: "Report not found" });
  }
  const sanitised = {
    ...report,
    infringements: report.infringements.map(({ _productTitle, ...pub }) => pub),
    exportedAt: new Date().toISOString(),
  };
  res.setHeader("Content-Type", "application/json");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="ip-report-${req.params.scanId}.json"`
  );
  res.json(sanitised);
});

router.post("/:scanId/mark-reviewed", async (req, res) => {
  const report = await getReport(req.params.scanId, req.userId);
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
