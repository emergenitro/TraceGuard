import { Router } from "express";
import { getScan, updateScan } from "../store.js";

const router = Router();

router.get("/:id", async (req, res) => {
  const scan = await getScan(req.params.id, req.userId);
  if (!scan) {
    return res.status(404).json({ error: "Scan not found" });
  }

  const { _assetData, ...publicScan } = scan;
  res.json(publicScan);
});

router.post("/:id/pause", async (req, res) => {
  const scan = await getScan(req.params.id, req.userId);
  if (!scan) return res.status(404).json({ error: "Scan not found" });
  if (scan.status !== "scanning") {
    return res.status(409).json({ error: "Scan is not currently running" });
  }
  await updateScan(req.params.id, { status: "paused" });
  res.status(204).send();
});

router.post("/:id/resume", async (req, res) => {
  const scan = await getScan(req.params.id, req.userId);
  if (!scan) return res.status(404).json({ error: "Scan not found" });
  if (scan.status !== "paused") {
    return res.status(409).json({ error: "Scan is not currently paused" });
  }
  await updateScan(req.params.id, { status: "scanning" });
  res.status(204).send();
});

export default router;
