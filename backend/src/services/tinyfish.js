/**
 * TinyFish browser-automation service — async/poll pattern.
 *
 * Flow per URL:
 *   1. POST /v1/automation/run-async  → { run_id }   (returns immediately)
 *   2. Poll GET /v1/runs/{run_id}     → { status, result }
 *   3. Resolve when status is COMPLETED / FAILED / CANCELLED
 *
 * For bulk scraping we submit ALL jobs first, then poll them all in parallel,
 * so total wall-clock time ≈ slowest single job (not the sum of all jobs).
 */

const BASE = "https://agent.tinyfish.ai";
const SUBMIT_ENDPOINT = `${BASE}/v1/automation/run-async`;
const STATUS_ENDPOINT = (runId) => `${BASE}/v1/runs/${runId}`;

const POLL_INTERVAL_MS = parseInt(process.env.TINYFISH_POLL_INTERVAL || "5000", 10);
const JOB_TIMEOUT_MS   = parseInt(process.env.TINYFISH_TIMEOUT     || "600000", 10); // 10 min

// ── Submit ────────────────────────────────────────────────────────────────────

async function submitJob(url, goal, browserProfile = "lite") {
  const res = await fetch(SUBMIT_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": process.env.TINYFISH_API_KEY,
    },
    body: JSON.stringify({ url, goal, browser_profile: browserProfile }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`TinyFish submit HTTP ${res.status}: ${text}`);
  }

  const { run_id, error } = await res.json();
  if (error) throw new Error(`TinyFish submit error: ${error}`);
  return run_id;
}

// ── Poll a single run until terminal ─────────────────────────────────────────

async function pollUntilDone(runId, url) {
  const deadline = Date.now() + JOB_TIMEOUT_MS;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    let data;
    try {
      const res = await fetch(STATUS_ENDPOINT(runId), {
        headers: { "X-API-Key": process.env.TINYFISH_API_KEY },
      });
      if (!res.ok) {
        console.warn(`[TinyFish] Poll ${runId} HTTP ${res.status} — retrying`);
        continue;
      }
      data = await res.json();
    } catch (err) {
      console.warn(`[TinyFish] Poll ${runId} network error — retrying:`, err.message);
      continue;
    }

    const { status, result, error } = data;

    if (status === "COMPLETED") {
      const matches = Array.isArray(result)
        ? result
        : result?.matches ?? [];
      return { url, matches, raw: { ...data, final_url: data.final_url ?? data.page_url ?? null } };
    }

    if (status === "FAILED" || status === "CANCELLED") {
      console.error(`[TinyFish] Run ${runId} ${status}: ${error ?? ""}`);
      return { url, matches: [], error: `Run ${status.toLowerCase()}${error ? ": " + error : ""}` };
    }

    // PENDING or RUNNING — keep polling
  }

  console.error(`[TinyFish] Run ${runId} timed out after ${JOB_TIMEOUT_MS / 1000}s`);
  return { url, matches: [], error: "Timed out" };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Scrape multiple URLs concurrently using run-async + parallel polling.
 *
 * All jobs are submitted first (returns immediately), then polled in parallel,
 * so total time ≈ max(individual run times) rather than the sum.
 *
 * @param {Array<{ url: string, goal: string }>} targets
 * @returns {Promise<Array<{ url: string, matches: object[], error?: string }>>}
 */
export async function bulkScrapeForInfringement(targets) {
  // Step 1: Submit all jobs simultaneously
  const submissions = await Promise.all(
    targets.map(async ({ url, goal }) => {
      try {
        const runId = await submitJob(url, goal);
        console.log(`[TinyFish] Submitted ${url} → run_id ${runId}`);
        return { url, runId };
      } catch (err) {
        console.error(`[TinyFish] Failed to submit ${url}:`, err.message);
        return { url, runId: null, error: err.message };
      }
    })
  );

  // Step 2: Poll all submitted jobs in parallel
  const results = await Promise.all(
    submissions.map(({ url, runId, error }) => {
      if (!runId) return Promise.resolve({ url, matches: [], error });
      return pollUntilDone(runId, url);
    })
  );

  return results;
}
