import { Router } from "express";
import { createScan, getUserById } from "../store.js";
import { runScan } from "../services/scanner.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
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

    const user = await getUserById(req.userId);
    const assetData = {
      assetType,
      assetName: assetName.trim(),
      primaryUrl: primaryUrl?.trim() || undefined,
      fileName: fileName?.trim() || undefined,
      email: user?.email ?? undefined,
    };

    const scanId = await createScan(assetType, assetName.trim(), assetData, req.userId);

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
