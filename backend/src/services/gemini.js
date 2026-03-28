/**
 * OpenAI GPT-4o service for IP asset analysis.
 *
 * Uses structured JSON output (response_format: json_object) so the response
 * is always valid JSON — no markdown stripping needed.
 *
 * Rate limits (Tier 1 as of 2025): 500 RPM / 30 000 TPD — far more headroom
 * than Gemini's free tier, so we only retry on transient 429s.
 */
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || "gpt-4o";

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function chatWithRetry(messages, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await client.chat.completions.create({
        model: MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages,
      });
    } catch (err) {
      const is429 = err?.status === 429 || err?.message?.includes("rate limit");
      if (is429 && attempt < retries) {
        const backoff = attempt * 10_000; // 10s, 20s
        console.warn(`[OpenAI] Rate limit hit — retrying in ${backoff / 1000}s…`);
        await sleep(backoff);
        continue;
      }
      throw err;
    }
  }
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
    patent:
      "Focus on e-commerce sites selling products that implement patented technology, patent databases for prior art, and marketplaces where counterfeit/infringing goods are commonly sold.",
    trademark:
      "Focus on domain squatting, e-commerce listings using the same or confusingly similar brand name, social media impersonation accounts, and counterfeit product listings.",
    copyright:
      "Focus on image sharing platforms, print-on-demand marketplaces, stock photo sites, e-book stores, and social media for unauthorised reproduction.",
    product:
      "Focus on e-commerce platforms, wholesale/manufacturing sites, and marketplaces where counterfeit or knockoff products are commonly sold.",
  };

  const userContent = `Analyse the following IP asset and identify the best websites to investigate for potential infringement.

Asset Type: ${assetType}
Asset Name: ${assetName}
${primaryUrl ? `Primary URL: ${primaryUrl}` : ""}
${fileName ? `Reference File: ${fileName}` : ""}

Context: ${assetTypeHints[assetType] ?? ""}

Return a JSON object with exactly this schema:
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

  const completion = await chatWithRetry([
    {
      role: "system",
      content:
        "You are an IP (Intellectual Property) infringement detection specialist. Always respond with valid JSON only.",
    },
    { role: "user", content: userContent },
  ]);

  return JSON.parse(completion.choices[0].message.content);
}
