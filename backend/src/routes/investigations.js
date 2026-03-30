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
  try {
    const { assetType, assetName, primaryUrl, fileName, email } = req.body ?? {};

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
      email: email?.trim() || undefined,
    };

    const scanId = await createScan(assetType, assetName.trim(), assetData);

    runScan(scanId, assetData).catch((err) =>
      console.error(`[investigations] Background scan ${scanId} crashed:`, err)
    );

    res.status(201).json({ scanId });
  } catch (err) {
    console.error("[investigations] Failed to create scan:", err);
    res.status(500).json({ error: "Failed to start investigation" });
  }
});

export default router;
