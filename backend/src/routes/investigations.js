import { Router } from "express";
import { createScan } from "../store.js";
import { runScan } from "../services/scanner.js";

const router = Router();

/**
 * POST /api/investigations
 * Body: { assetType, assetName, primaryUrl?, fileName? }
 * Returns: { scanId }
 */
router.post("/", async (req, res) => {
  const { assetType, assetName, primaryUrl, fileName } = req.body ?? {};

  if (!assetName || typeof assetName !== "string" || !assetName.trim()) {
    return res.status(400).json({ error: "assetName is required" });
  }

  const validTypes = ["trademark", "copyright", "product", "patent"];
  if (!validTypes.includes(assetType)) {
    return res
      .status(400)
      .json({ error: `assetType must be one of: ${validTypes.join(", ")}` });
  }

  const assetData = {
    assetType,
    assetName: assetName.trim(),
    primaryUrl: primaryUrl?.trim() || undefined,
    fileName: fileName?.trim() || undefined,
  };

  const scanId = createScan(assetType, assetName.trim(), assetData);

  // Fire-and-forget — the scan runs asynchronously in the background
  runScan(scanId, assetData).catch((err) =>
    console.error(`[investigations] Background scan ${scanId} crashed:`, err)
  );

  res.status(201).json({ scanId });
});

export default router;
