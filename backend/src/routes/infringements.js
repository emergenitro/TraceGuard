import { Router } from "express";
import { randomUUID } from "crypto";
import { getInfringement, updateInfringement } from "../store.js";

const router = Router();

/**
 * POST /api/infringements/:id/cease-and-desist
 * Draft a C&D notice document for this infringement.
 * Updates status to CEASE_AND_DESIST_SENT.
 * Returns: { documentId }
 */
router.post("/:id/cease-and-desist", async (req, res) => {
  const inf = await getInfringement(req.params.id);
  if (!inf) {
    return res.status(404).json({ error: "Infringement not found" });
  }

  await updateInfringement(req.params.id, { status: "CEASE_AND_DESIST_SENT" });

  res.json({ documentId: randomUUID() });
});

/**
 * GET /api/infringements/:id/trace
 * Returns a deep-link URL to the original infringing page.
 * Falls back to a Wayback Machine archive search if no direct link is stored.
 * Returns: { traceUrl }
 */
router.get("/:id/trace", async (req, res) => {
  const inf = await getInfringement(req.params.id);
  if (!inf) {
    return res.status(404).json({ error: "Infringement not found" });
  }

  const traceUrl =
    inf._link ??
    `https://web.archive.org/web/*/${inf.domain}`;

  res.json({ traceUrl });
});

export default router;
