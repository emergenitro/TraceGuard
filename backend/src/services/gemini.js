/**
 * Gemini 2.5 Flash service for IP asset analysis.
 *
 * Free-tier rate limits (as of 2025):
 *   - 15 RPM  (requests per minute)
 *   - 1 000 000 TPM
 *   - 250 RPD
 *
 * We enforce a minimum 4 s gap between requests (~15 RPM ceiling).
 */
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function getModel() {
  return genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.2, // Low temp for deterministic JSON
      responseMimeType: "application/json",
    },
  });
}

// ── Rate limiter ──────────────────────────────────────────────────────────────

let lastRequestAt = 0;
const MIN_INTERVAL_MS = 4_200; // ~14 RPM — slightly under the 15 RPM limit

async function withRateLimit(fn) {
  const now = Date.now();
  const wait = MIN_INTERVAL_MS - (now - lastRequestAt);
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();
  return fn();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Retry helper ──────────────────────────────────────────────────────────────

async function generateWithRetry(prompt, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await withRateLimit(() => getModel().generateContent(prompt));
    } catch (err) {
      const isQuota =
        err?.status === 429 ||
        err?.message?.includes("quota") ||
        err?.message?.includes("RESOURCE_EXHAUSTED");

      if (isQuota && attempt < retries) {
        const backoff = attempt * 15_000; // 15s, 30s
        console.warn(`Gemini quota hit — retrying in ${backoff / 1000}s…`);
        await sleep(backoff);
        continue;
      }
      throw err;
    }
  }
}

// ── JSON extraction ───────────────────────────────────────────────────────────

function extractJSON(text) {
  // Gemini sometimes wraps JSON in markdown fences
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object found in Gemini response");
  return JSON.parse(match[0]);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Phase 1: Analyse the submitted IP asset and return a description plus a list
 * of target websites where infringement is most likely to occur.
 *
 * @returns {{
 *   description: string,
 *   keyFeatures: string[],
 *   keywords: string[],
 *   targetSites: { url: string, rationale: string, category: string }[]
 * }}
 */
export async function analyzeAsset({ assetType, assetName, primaryUrl, fileName }) {
  const assetTypeHints = {
    patent: "Focus on e-commerce sites selling products that implement patented technology, patent databases for prior art, and marketplaces where counterfeit/infringing goods are commonly sold.",
    trademark: "Focus on domain squatting, e-commerce listings using the same or confusingly similar brand name, social media impersonation accounts, and counterfeit product listings.",
    copyright: "Focus on image sharing platforms, print-on-demand marketplaces, stock photo sites, e-book stores, and social media for unauthorised reproduction.",
    product: "Focus on e-commerce platforms, wholesale/manufacturing sites, and marketplaces where counterfeit or knockoff products are commonly sold.",
  };

  const prompt = `You are an IP (Intellectual Property) infringement detection specialist.

Analyse the following IP asset and identify the best websites to investigate for potential infringement.

Asset Type: ${assetType}
Asset Name: ${assetName}
${primaryUrl ? `Primary URL: ${primaryUrl}` : ""}
${fileName ? `Reference File: ${fileName}` : ""}

Context: ${assetTypeHints[assetType] ?? ""}

Return a JSON object with exactly this schema (no markdown, no extra text):
{
  "description": "A detailed, factual description of the asset including what it is and what makes it distinctive or protectable.",
  "keyFeatures": ["distinctive element 1", "distinctive element 2", "...up to 8 items"],
  "keywords": ["keyword1", "keyword2", "...up to 10 search terms likely to reveal infringing content"],
  "targetSites": [
    {
      "url": "https://full-url-of-site-homepage-or-search-page",
      "rationale": "One sentence explaining why this site is a high-value target",
      "category": "E_COMMERCE | SOCIAL_MEDIA | DOMAIN_SQUATTING | NFT_CRYPTO | PATENT_DATABASE | MARKETPLACE"
    }
  ]
}

Rules:
- targetSites must have between 6 and 12 entries, ordered by likelihood of infringement (highest first).
- Use only real, publicly accessible websites.
- For PATENT assets, always include at least one patent database (patents.google.com or worldwide.espacenet.com) alongside commercial sites.
- For TRADEMARK assets, always include at least one domain registrar search page (e.g. https://www.godaddy.com/domainsearch/find?checkAvail=1&tmskey=&domainToCheck=${encodeURIComponent(assetName.toLowerCase().replace(/\s+/g, ""))}) to check for domain squatting.`;

  const result = await generateWithRetry(prompt);
  const text = result.response.text();
  return extractJSON(text);
}
