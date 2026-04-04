import { Router } from "express";
import { randomUUID } from "crypto";
import { getInfringementWithOwner, updateInfringement } from "../store.js";

const router = Router();

async function getOwnedInfringement(id, userId, res) {
  const inf = await getInfringementWithOwner(id);
  if (!inf) {
    res.status(404).json({ error: "Infringement not found" });
    return null;
  }
  if (inf.scanUserId !== userId) {
    res.status(404).json({ error: "Infringement not found" });
    return null;
  }
  return inf;
}

router.post("/:id/cease-and-desist", async (req, res) => {
  const inf = await getOwnedInfringement(req.params.id, req.userId, res);
  if (!inf) return;

  await updateInfringement(req.params.id, { status: "CEASE_AND_DESIST_SENT" });
  res.json({ documentId: randomUUID() });
});

router.get("/:id/trace", async (req, res) => {
  const inf = await getOwnedInfringement(req.params.id, req.userId, res);
  if (!inf) return;

  const traceUrl = inf.link ?? `https://web.archive.org/web/*/${inf.domain}`;
  res.json({ traceUrl });
});

export default router;
