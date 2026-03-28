/**
 * TinyFish browser-automation service for concurrent infringement scraping.
 *
 * Endpoint: POST https://agent.tinyfish.ai/v1/automation/run-sse
 * Auth:     X-API-Key header
 * Response: Server-Sent Events stream; we wait for the COMPLETE event.
 *
 * Concurrency: TinyFish queues requests that exceed the account's browser-session
 * limit automatically (no 429 errors), so we can fire all targets in parallel.
 * We still cap at MAX_CONCURRENT as a safety net.
 */

const TINYFISH_ENDPOINT =
  process.env.TINYFISH_ENDPOINT ||
  "https://agent.tinyfish.ai/v1/automation/run-sse";

const MAX_CONCURRENT = parseInt(process.env.TINYFISH_MAX_CONCURRENT || "8", 10);

// Per-request timeout (TinyFish tasks can take a few minutes for complex pages)
const REQUEST_TIMEOUT_MS = 6 * 60 * 1000; // 6 minutes

// ── SSE parser ────────────────────────────────────────────────────────────────

/**
 * Parse a raw SSE text body into an array of { event, data } objects.
 */
function parseSSE(text) {
  const events = [];
  let eventType = null;
  let dataBuffer = "";

  for (const line of text.split("\n")) {
    const trimmed = line.trimEnd();

    if (trimmed.startsWith("event:")) {
      eventType = trimmed.slice(6).trim();
    } else if (trimmed.startsWith("data:")) {
      dataBuffer += trimmed.slice(5).trim();
    } else if (trimmed === "") {
      // Empty line = end of event block
      if (dataBuffer && dataBuffer !== "[DONE]") {
        try {
          events.push({ event: eventType, data: JSON.parse(dataBuffer) });
        } catch {
          // Non-JSON data line — skip
        }
      }
      eventType = null;
      dataBuffer = "";
    }
  }

  // Handle stream that doesn't end with a blank line
  if (dataBuffer && dataBuffer !== "[DONE]") {
    try {
      events.push({ event: eventType, data: JSON.parse(dataBuffer) });
    } catch {
      // ignore
    }
  }

  return events;
}

/**
 * Extract the final output from the parsed SSE events.
 * TinyFish emits a COMPLETE event whose `.data.output` contains the result.
 */
function extractOutput(events) {
  for (const { event, data } of events) {
    const isComplete =
      event === "COMPLETE" ||
      data?.type === "COMPLETE" ||
      data?.status === "COMPLETED";

    if (isComplete) {
      return data?.output ?? data ?? null;
    }
  }
  return null;
}

// ── Single URL scrape ─────────────────────────────────────────────────────────

async function scrapeUrl(url, goal, browserProfile = "lite") {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(TINYFISH_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.TINYFISH_API_KEY,
      },
      body: JSON.stringify({ url, goal, browser_profile: browserProfile }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`TinyFish HTTP ${response.status}: ${errText}`);
    }

    const body = await response.text();
    const events = parseSSE(body);
    const output = extractOutput(events);

    if (!output) {
      console.warn(`[TinyFish] No COMPLETE output for ${url}. Events:`, events.length);
      return { url, matches: [] };
    }

    // Normalise: output may be { matches: [...] } or an array directly
    const matches = Array.isArray(output) ? output : output.matches ?? [];
    return { url, matches, raw: output };
  } catch (err) {
    if (err.name === "AbortError") {
      console.error(`[TinyFish] Timeout scraping ${url}`);
    } else {
      console.error(`[TinyFish] Error scraping ${url}:`, err.message);
    }
    return { url, matches: [], error: err.message };
  } finally {
    clearTimeout(timer);
  }
}

// ── Bulk scraper ──────────────────────────────────────────────────────────────

/**
 * Scrape multiple target URLs concurrently.
 *
 * @param {Array<{ url: string, goal: string, category?: string }>} targets
 * @returns {Promise<Array<{ url: string, matches: object[], error?: string }>>}
 */
export async function bulkScrapeForInfringement(targets) {
  const results = [];

  // Process in batches to honour MAX_CONCURRENT
  for (let i = 0; i < targets.length; i += MAX_CONCURRENT) {
    const batch = targets.slice(i, i + MAX_CONCURRENT);
    const batchResults = await Promise.all(
      batch.map(({ url, goal }) => scrapeUrl(url, goal))
    );
    results.push(...batchResults);
  }

  return results;
}
