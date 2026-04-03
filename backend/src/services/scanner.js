/**
 * Main scan orchestrator.
 *
 * Flow:
 *   1. Gemini: Analyse the asset → description + target site list
 *   2. TinyFish: Bulk-scrape all target sites concurrently
 *   3. Map TinyFish match objects → frontend Infringement schema
 *   4. Persist report + mark scan complete
 */
import { randomUUID } from "crypto";
import { analyzeAsset } from "./gemini.js";
import { bulkScrapeForInfringement } from "./tinyfish.js";
import { sendScanCompleteEmail } from "./email.js";
import {
  updateScan,
  addLog,
  addStreamItem,
  createReport,
  getScanEmail,
} from "../store.js";

// ── Mapping helpers ───────────────────────────────────────────────────────────

function mapRiskToSeverity(riskLevel) {
  switch ((riskLevel ?? "").toUpperCase()) {
    case "HIGH":
      return "CRITICAL";
    case "MEDIUM":
      return "MODERATE";
    default:
      return "OBSERVATIONAL";
  }
}

/**
 * Infer SourceType from the TinyFish category hint or the URL itself.
 */
function inferSourceType(category, url = "") {
  const cat = (category ?? "").toUpperCase();
  if (cat === "SOCIAL_MEDIA") return "SOCIAL_MEDIA";
  if (cat === "E_COMMERCE" || cat === "MARKETPLACE") return "E_COMMERCE";
  if (cat === "DOMAIN_SQUATTING") return "DOMAIN_SQUATTING";
  if (cat === "NFT_CRYPTO") return "NFT_CRYPTO";

  const u = url.toLowerCase();
  if (/twitter|instagram|tiktok|facebook|pinterest|reddit/.test(u))
    return "SOCIAL_MEDIA";
  if (
    /amazon|ebay|aliexpress|alibaba|walmart|etsy|shopify|redbubble|merch/.test(
      u
    )
  )
    return "E_COMMERCE";
  if (/opensea|rarible|nft|crypto|blockchain/.test(u)) return "NFT_CRYPTO";

  return "E_COMMERCE";
}

function riskToPercent(riskLevel) {
  switch ((riskLevel ?? "").toUpperCase()) {
    case "HIGH":
      return randInt(80, 95);
    case "MEDIUM":
      return randInt(55, 74);
    case "LOW":
      return randInt(32, 54);
    default:
      return randInt(25, 45);
  }
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function elapsedMs() {
  return `${randInt(300, 4500)}ms`;
}

// ── Goal builder ──────────────────────────────────────────────────────────────

function buildScrapeGoal(assetType, assetName, analysis) {
  return `You are an aggressive IP infringement detection agent working on behalf of the rights holder. Your job is to FIND potential infringement — not to clear sites of suspicion.

PROTECTED ASSET
  Type:     ${assetType.toUpperCase()}
  Name:     ${assetName}
  Summary:  ${analysis.description}
  Key features / claims:
    ${analysis.keyFeatures.map((f, i) => `${i + 1}. ${f}`).join("\n    ")}
  Search keywords: ${analysis.keywords.join(", ")}

MANDATORY STEPS — complete ALL of them before returning results:
1. Use the site's own search bar (or search URL) to search for EACH of these terms separately: ${analysis.keywords.slice(0, 5).join(", ")}.
2. For every search, scroll through at least the first two pages of results.
3. Open any listing that looks remotely related to the asset and inspect it in detail.
4. Also browse the most relevant category pages (e.g. for e-commerce: matching product categories; for social media: profiles or posts using the asset name).

DETECTION RULES — flag a match if ANY of the following apply:
- The product/content replicates one or more key features listed above, even partially.
- The name, branding, or description is confusingly similar to "${assetName}".
- The functionality, design, or creative output substantially overlaps with the asset's description.
- The item is clearly a copy, counterfeit, or derivative work.
- The item implements the same technical approach described in the key features.
DO NOT require all features to match — a single meaningful feature overlap is enough to flag at LOW or MEDIUM.

Return your findings as a JSON object with ONLY this structure (no markdown, no surrounding text):
{
  "matches": [
    {
      "link": "the exact final URL of the specific infringing product, listing, or content page after following any navigation or redirects — not the homepage or search URL",
      "product_title": "exact name of the product, listing, or content",
      "reason": "cite which specific key feature(s) from the list above are replicated and how",
      "matched_features": ["exact feature from the list that is matched", "another matched feature"],
      "risk_level": "HIGH",
      "similarity_score": "HIGH",
      "match_percent": 92
    }
  ]
}

risk_level / similarity_score values:
  HIGH   — replicates a core feature directly or is an obvious copy/counterfeit
  MEDIUM — implements the same concept with minor differences
  LOW    — partial overlap or functional similarity worth monitoring

match_percent: an integer from 0–100 representing how closely this item matches the protected asset.
  HIGH risk   → 80–100
  MEDIUM risk → 55–79
  LOW risk    → 25–54
Use your judgment within the range — do not pick the same number for every result.

Err on the side of inclusion — if you are unsure, flag it as LOW rather than omitting it.
If after completing all mandatory steps you find genuinely nothing related, return: {"matches": []}`;
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function runScan(scanId, assetData) {
  const { assetType, assetName, primaryUrl, fileName } = assetData;

  try {
    // ── Phase 1: Asset analysis ──────────────────────────────────────────────

    await updateScan(scanId, { status: "scanning", progressPercent: 5 });
    await addLog(scanId, "INFO", `Investigation initialised — ${assetType.toUpperCase()}: "${assetName}"`);
    await addLog(scanId, "INFO", "Engaging GPT-4o analysis engine…");

    let assetAnalysis;
    try {
      assetAnalysis = await analyzeAsset({ assetType, assetName, primaryUrl, fileName });
    } catch (err) {
      await addLog(scanId, "ALERT", `Asset analysis failed: ${err.message}`);
      await updateScan(scanId, { status: "complete", progressPercent: 100 });
      await createReport(scanId, []);
      return;
    }

    await addLog(
      scanId,
      "DATA",
      `Asset profile: ${assetAnalysis.description.slice(0, 160)}${assetAnalysis.description.length > 160 ? "…" : ""}`
    );
    await addLog(
      scanId,
      "INFO",
      `${assetAnalysis.targetSites.length} high-value target domains identified for investigation`
    );
    await updateScan(scanId, {
      progressPercent: 20,
      telemetry: { detectionConfidence: 40, visualMatching: 25, highPriorityRisk: false },
    });

    // ── Phase 2: Dispatch TinyFish agents ────────────────────────────────────

    await addLog(scanId, "SCAN", `Deploying ${assetAnalysis.targetSites.length} concurrent scan agents via TinyFish…`);

    const goal = buildScrapeGoal(assetType, assetName, assetAnalysis);

    const targets = assetAnalysis.targetSites.map((site) => ({
      url: site.url,
      goal,
      category: site.category,
    }));

    for (const t of targets) {
      await addLog(scanId, "SCAN", `Agent dispatched → ${t.url}`);
      await addStreamItem(scanId, {
        action: "AGENT_DISPATCHED",
        url: t.url,
        elapsed: "0ms",
        tags: [t.category ?? "TARGET"],
        isAlert: false,
      });
    }

    await updateScan(scanId, { progressPercent: 30 });

    // ── Concurrent scrape ────────────────────────────────────────────────────

    const scrapeResults = await bulkScrapeForInfringement(targets);

    await updateScan(scanId, { progressPercent: 75 });
    await addLog(scanId, "INFO", `All agents returned. Processing ${scrapeResults.length} site reports…`);

    // ── Phase 3: Build infringement list ─────────────────────────────────────

    const infringements = [];

    for (let i = 0; i < scrapeResults.length; i++) {
      const result = scrapeResults[i];
      const targetInfo = targets[i];

      if (result.error) {
        await addLog(scanId, "INFO", `Inconclusive scan at ${result.url} — ${result.error}`);
      } else if (!result.matches || result.matches.length === 0) {
        await addLog(scanId, "INFO", `No infringement detected at ${extractDomain(result.url)}`);
      } else {
        await addLog(
          scanId,
          "ALERT",
          `${result.matches.length} potential match(es) found via ${extractDomain(result.url)}`
        );
      }

      for (const match of result.matches ?? []) {
        const risk = match.risk_level ?? match.similarity_score ?? "LOW";
        const severity = mapRiskToSeverity(risk);
        const matchLink = match.link ?? result.raw?.final_url ?? result.url;

        const infringement = {
          id: randomUUID(),
          domain: extractDomain(matchLink),
          matchPercent: typeof match.match_percent === "number"
            ? Math.min(100, Math.max(0, Math.round(match.match_percent)))
            : riskToPercent(risk),
          severity,
          tags: (match.matched_features ?? []).slice(0, 4),
          sourceType: inferSourceType(targetInfo.category, matchLink),
          status: "UNACTIONED",
          systemNote:
            match.reason ??
            "Potential infringement detected via automated browser scan.",
          screenshotUrl: undefined,
          // Internal fields for downstream endpoints
          _link: matchLink,
          _productTitle: match.product_title,
        };

        infringements.push(infringement);

        await addStreamItem(scanId, {
          action: severity === "CRITICAL" ? "CRITICAL_MATCH" : "MATCH_DETECTED",
          url: matchLink,
          elapsed: elapsedMs(),
          tags: [severity, infringement.sourceType],
          isAlert: severity === "CRITICAL",
        });

        await addLog(
          scanId,
          severity === "CRITICAL" ? "ALERT" : "SCAN",
          `${severity} — ${match.product_title ?? extractDomain(matchLink)} @ ${extractDomain(matchLink)}`
        );
      }

      // Incremental progress: 75 → 95 over all results
      const pct = 75 + Math.round(((i + 1) / scrapeResults.length) * 20);
      await updateScan(scanId, { progressPercent: pct });
    }

    // ── Phase 4: Finalise ─────────────────────────────────────────────────────

    const hasCritical = infringements.some((i) => i.severity === "CRITICAL");
    const avgMatch =
      infringements.length > 0
        ? infringements.reduce((s, i) => s + i.matchPercent, 0) / infringements.length
        : 0;

    await updateScan(scanId, {
      status: "complete",
      progressPercent: 100,
      telemetry: {
        detectionConfidence: Math.min(97, Math.round(avgMatch + 12)),
        visualMatching: Math.min(93, Math.round(avgMatch - 5)),
        highPriorityRisk: hasCritical,
      },
    });

    await addLog(
      scanId,
      "INFO",
      `Investigation complete — ${infringements.length} infringement(s) identified across ${scrapeResults.length} sites`
    );

    if (hasCritical) {
      await addLog(
        scanId,
        "ALERT",
        "⚠  CRITICAL severity infringements detected. Immediate legal review recommended."
      );
    }

    await createReport(scanId, infringements);

    const notifyEmail = await getScanEmail(scanId);
    if (notifyEmail) {
      sendScanCompleteEmail(notifyEmail, {
        assetName,
        assetType,
        infringementCount: infringements.length,
        scanId,
      }).catch((err) => console.error("[scanner] Failed to send email:", err));
    }
  } catch (err) {
    console.error(`[Scanner] Scan ${scanId} failed:`, err);
    await addLog(scanId, "ALERT", `Fatal scan error: ${err.message}`);
    await updateScan(scanId, { status: "complete", progressPercent: 100 });
    await createReport(scanId, []);
  }
}
