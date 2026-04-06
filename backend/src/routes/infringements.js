import { Router } from "express";
import { randomUUID } from "crypto";
import { getInfringementWithOwner, getInfringementWithScanData, updateInfringement } from "../store.js";

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

function formatAssetType(assetType) {
  const map = {
    trademark: "Trademark",
    copyright: "Copyright",
    patent: "Patent",
    product: "Product",
  };
  return map[assetType?.toLowerCase()] ?? assetType ?? "Intellectual Property";
}

function generateLetter(inf) {
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const assetType = formatAssetType(inf.assetType);
  const keyFeatures = inf.assetData?.keyFeatures ?? [];
  const featuresBlock = keyFeatures.length > 0
    ? keyFeatures.map((f) => `  * ${f}`).join("\n")
    : "  (See official documentation for full feature list)";
  const tagsBlock = (inf.tags ?? []).map((t) => `  * ${t}`).join("\n");
  const infringingLocation = inf.link ? `${inf.domain} (specifically at: ${inf.link})` : inf.domain;
  const productLine = inf._productTitle ? `\nThe infringing content appears under the title "${inf._productTitle}".` : "";
  const senderLine = inf.ownerEmail ? `${inf.ownerEmail}\n(IP Rights Holder / Authorized Representative)` : "(IP Rights Holder / Authorized Representative)";

  const toLine = inf.cdEmail ? `${inf.cdEmail} (Owner/Operator of ${inf.domain})` : `Owner/Operator of ${inf.domain}`;
  const subject = `Cease and Desist Notice – Intellectual Property Infringement by ${inf.domain}`;

  const body = `CEASE AND DESIST NOTICE

Date: ${date}

To: ${toLine}

RE: Infringement of ${assetType} Rights — ${inf.assetName}

Dear Sir or Madam,

We are writing on behalf of the owner of "${inf.assetName}", a protected ${assetType} (hereinafter "the Protected Asset"). It has come to our attention that your platform, located at ${infringingLocation}, is engaged in activity that constitutes infringement of our intellectual property rights.

DESCRIPTION OF PROTECTED ASSET

${inf.assetData?.description ?? `"${inf.assetName}" is a protected ${assetType} with the following distinctive elements:`}

Distinctive elements include:
${featuresBlock}

NATURE OF INFRINGEMENT

Our IP monitoring system has identified a ${inf.matchPercent}% similarity match between content on your platform and our Protected Asset.${inf.systemNote ? ` Specifically: ${inf.systemNote}` : ""}${productLine}

The following protected elements were identified as infringed:
${tagsBlock}

DEMANDS

We hereby demand that you immediately:

1. CEASE AND DESIST from any further use, reproduction, distribution, or display of content that infringes upon our intellectual property rights;
2. REMOVE all infringing content from your platform within 14 days of receipt of this notice;
3. PROVIDE WRITTEN CONFIRMATION of your compliance with these demands.

Failure to comply within 14 days of receipt may result in legal action, including injunctive relief, monetary damages, and recovery of attorney fees and costs. This notice is sent without prejudice to any of our rights or remedies, all of which are expressly reserved.

Sincerely,

${senderLine}`;

  return { subject, body };
}

router.post("/:id/cease-and-desist", async (req, res) => {
  const inf = await getInfringementWithScanData(req.params.id);
  if (!inf) {
    res.status(404).json({ error: "Infringement not found" });
    return;
  }
  if (inf.scanUserId !== req.userId) {
    res.status(404).json({ error: "Infringement not found" });
    return;
  }

  await updateInfringement(req.params.id, { status: "CEASE_AND_DESIST_SENT" });
  const { subject, body } = generateLetter(inf);
  res.json({ documentId: randomUUID(), subject, body, to: inf.cdEmail ?? null });
});

router.get("/:id/trace", async (req, res) => {
  const inf = await getOwnedInfringement(req.params.id, req.userId, res);
  if (!inf) return;

  const traceUrl = inf.link ?? `https://web.archive.org/web/*/${inf.domain}`;
  res.json({ traceUrl });
});

export default router;
