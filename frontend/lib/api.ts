/**
 * TraceGuard API Layer
 *
 * All backend calls are centralised here. Replace the stub
 * implementations with real fetch / axios calls once the
 * backend is ready. Every function is typed and returns a
 * Promise so callers don't need to change when you go live.
 *
 * Convention: functions that read data are prefixed `get`,
 * functions that mutate are prefixed `post` / verb.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type AssetType = "trademark" | "copyright" | "product" | "patent";

export interface StartInvestigationPayload {
  assetType: AssetType;
  assetName: string;
  primaryUrl: string;
  file?: File;
}

export interface ScanStatus {
  id: string;
  assetName: string;
  assetType: AssetType;
  progressPercent: number;
  status: "queued" | "scanning" | "paused" | "complete";
  startedAt: string;
  logs: ScanLogEntry[];
  nodes: NodeStatus[];
  telemetry: {
    detectionConfidence: number;
    visualMatching: number;
    highPriorityRisk: boolean;
  };
  stream: StreamItem[];
}

export interface ScanLogEntry {
  timestamp: string;
  level: "INFO" | "SCAN" | "ALERT" | "DATA";
  message: string;
}

export interface NodeStatus {
  region: string;
  status: "active" | "idle";
}

export interface StreamItem {
  action: string;
  url: string;
  elapsed: string;
  tags: string[];
  isAlert: boolean;
}

export type Severity = "CRITICAL" | "MODERATE" | "OBSERVATIONAL";
export type SourceType =
  | "DOMAIN_SQUATTING"
  | "SOCIAL_MEDIA"
  | "E_COMMERCE"
  | "NFT_CRYPTO";
export type InfringementStatus =
  | "UNACTIONED"
  | "PENDING_REVIEW"
  | "CEASE_AND_DESIST_SENT"
  | "LITIGATION";

export interface Infringement {
  id: string;
  domain: string;
  matchPercent: number;
  severity: Severity;
  tags: string[];
  sourceType: SourceType;
  status: InfringementStatus;
  systemNote: string;
  screenshotUrl?: string;
}

export interface ReportSummary {
  scanId: string;
  totalMatches: number;
  infringements: Infringement[];
}

export interface ExportReportResponse {
  downloadUrl: string;
}

// ─── Investigation ───────────────────────────────────────────────────────────

/**
 * Start a new monitoring investigation.
 * Returns the newly created scan ID for redirect.
 *
 * @todo POST /api/investigations
 */
export async function startInvestigation(
  payload: StartInvestigationPayload
): Promise<{ scanId: string }> {
  // TODO: replace with real API call
  // const formData = new FormData();
  // formData.append("assetType", payload.assetType);
  // formData.append("assetName", payload.assetName);
  // formData.append("primaryUrl", payload.primaryUrl);
  // if (payload.file) formData.append("file", payload.file);
  // const res = await fetch("/api/investigations", { method: "POST", body: formData });
  // const data = await res.json();
  // return data;

  await simulateDelay(600);
  return { scanId: "8829" };
}

// ─── Scans ───────────────────────────────────────────────────────────────────

/**
 * Fetch the live status of a scan by its ID.
 *
 * @todo GET /api/scans/:id
 */
export async function getScan(id: string): Promise<ScanStatus> {
  // TODO: replace with real API call
  // const res = await fetch(`/api/scans/${id}`);
  // return res.json();

  await simulateDelay(400);
  return MOCK_SCAN_STATUS;
}

/**
 * Pause or resume a running scan.
 *
 * @todo POST /api/scans/:id/pause | /api/scans/:id/resume
 */
export async function toggleScanPause(
  id: string,
  paused: boolean
): Promise<void> {
  // TODO: replace with real API call
  await simulateDelay(300);
  console.log(`[API STUB] Scan ${id} paused=${paused}`);
}

// ─── Reports ─────────────────────────────────────────────────────────────────

/**
 * Fetch the full infringement report for a scan.
 *
 * @todo GET /api/reports/:scanId
 */
export async function getReport(scanId: string): Promise<ReportSummary> {
  // TODO: replace with real API call
  // const res = await fetch(`/api/reports/${scanId}`);
  // return res.json();

  await simulateDelay(400);
  return MOCK_REPORT;
}

/**
 * Export a report as PDF / CSV.
 * Returns a signed download URL.
 *
 * @todo POST /api/reports/:scanId/export
 */
export async function exportReport(
  scanId: string
): Promise<ExportReportResponse> {
  // TODO: replace with real API call
  await simulateDelay(800);
  return { downloadUrl: `/exports/report-${scanId}.pdf` };
}

/**
 * Mark all infringements in a report as reviewed.
 *
 * @todo POST /api/reports/:scanId/mark-reviewed
 */
export async function markAllReviewed(scanId: string): Promise<void> {
  // TODO: replace with real API call
  await simulateDelay(400);
  console.log(`[API STUB] All items in report for scan ${scanId} reviewed`);
}

/**
 * Draft a cease-and-desist letter for a specific infringement.
 * Returns a document ID or URL to a draft generator.
 *
 * @todo POST /api/infringements/:id/cease-and-desist
 */
export async function draftCeaseAndDesist(
  infringementId: string
): Promise<{ documentId: string }> {
  // TODO: replace with real API call
  await simulateDelay(600);
  return { documentId: `cd-draft-${infringementId}` };
}

/**
 * Get the full forensic trace for an infringement.
 *
 * @todo GET /api/infringements/:id/trace
 */
export async function getFullTrace(
  infringementId: string
): Promise<{ traceUrl: string }> {
  // TODO: replace with real API call
  await simulateDelay(400);
  return { traceUrl: `/trace/${infringementId}` };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function simulateDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_SCAN_STATUS: ScanStatus = {
  id: "8829",
  assetName: "TRACEGUARD CORE",
  assetType: "trademark",
  progressPercent: 74.2,
  status: "scanning",
  startedAt: "2025-01-01T14:02:00Z",
  logs: [
    {
      timestamp: "14:02:11",
      level: "INFO",
      message: "Initializing Agent: TRACE_ALPHA_09",
    },
    {
      timestamp: "14:02:12",
      level: "SCAN",
      message:
        "Crawling: https://amazon.com/dp/B07XJ8C1ML/ref=traceguard_id=8829",
    },
    {
      timestamp: "14:02:15",
      level: "ALERT",
      message: "Potential Trademark Infringement Detected on Node: HK-0912",
    },
    {
      timestamp: "14:02:18",
      level: "SCAN",
      message:
        "Crawling: https://reddit.com/r/repsneakers/comments/q1w2e3/legit_check_traceguard/",
    },
    {
      timestamp: "14:02:22",
      level: "DATA",
      message: "Indexing 412 assets from Domain: aliexpress.com",
    },
    {
      timestamp: "14:02:25",
      level: "SCAN",
      message:
        "Crawling: https://ebay.com/itm/33421901231?hash=item4dfa6e1",
    },
    {
      timestamp: "14:02:29",
      level: "SCAN",
      message: "Crawling: https://shopee.sg/product/11029/332198",
    },
    {
      timestamp: "14:02:33",
      level: "ALERT",
      message:
        "Visual Match Found (88% Confidence) - Signature ID: TG-XP-11",
    },
    {
      timestamp: "14:02:35",
      level: "SCAN",
      message: "Crawling: https://instagram.com/p/CW1_XJ8C1ML/",
    },
  ],
  nodes: [
    { region: "North America", status: "active" },
    { region: "Asia-Pacific", status: "active" },
    { region: "Europe", status: "idle" },
    { region: "South America", status: "active" },
  ],
  telemetry: {
    detectionConfidence: 94.8,
    visualMatching: 82.1,
    highPriorityRisk: true,
  },
  stream: [
    {
      action: "Analyzing URL",
      url: "amazon.com/product/B01N...-id=82",
      elapsed: "0.04s",
      tags: ["Metadata", "Pricing"],
      isAlert: false,
    },
    {
      action: "Scanning Assets",
      url: "twitter.com/ads/campaign/22901-tx",
      elapsed: "0.12s",
      tags: ["Visual", "OCR"],
      isAlert: false,
    },
    {
      action: "Match Identified",
      url: "aliexpress.com/item/100500...829",
      elapsed: "0.08s",
      tags: ["Infringement"],
      isAlert: true,
    },
    {
      action: "Parsing CSS",
      url: "tiktok.com/shop/checkout/q?u=trace",
      elapsed: "0.03s",
      tags: ["Style", "Font"],
      isAlert: false,
    },
    {
      action: "Checking DNS",
      url: "cdn.static.fakedomain.ru/assets",
      elapsed: "0.01s",
      tags: ["Origin"],
      isAlert: false,
    },
  ],
};

const MOCK_REPORT: ReportSummary = {
  scanId: "8829",
  totalMatches: 1204,
  infringements: [
    {
      id: "inf-001",
      domain: "traceguard-security.io",
      matchPercent: 98,
      severity: "CRITICAL",
      tags: ["Trademark", "Phishing Risk"],
      sourceType: "DOMAIN_SQUATTING",
      status: "UNACTIONED",
      systemNote:
        "Exact visual match of brand assets and CSS structure identified on unauthorized domain.",
      screenshotUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAJO_B8hxKv_7l5MvSuENQCeUXXH0Ozv7M4M6HtMd8-2VKV8qrySPWF0zp5Mf0YywAFhTnaob0r21kTmFWOz61BsTSAuV9vvD3Y5DXV6cXoCbEM1u0liyanq2j0LP2Bnjh3be0Z3pc7IpX_R91JKYviMorZ_YaFxRzryqv_ORfIBCdAHmQkdZ14gtlPhBZVoIb6jLkcQ8REzSS1NWDL0Rmj7dGYvVtcje6lLSRyuGZImHg72Zmb7gjsHcuyloh88fEFNe68t7IVMFQ",
    },
    {
      id: "inf-002",
      domain: "shop-traceguard.com",
      matchPercent: 84,
      severity: "MODERATE",
      tags: ["Copyright", "Logo Misuse"],
      sourceType: "E_COMMERCE",
      status: "UNACTIONED",
      systemNote:
        'Detected unlicensed use of "Sentinel" icon pack in hero section and footer.',
      screenshotUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDmflssHf32kWcZlDmvH49ACcIgthl9ekjx5yM2c3QITsCbxdcNDtkD7OkiNAfj30vFT7ermBVC4TREsM2sJxhAKKni5OrhBt8gcSBcaFMzhMXTfgmF7-pykFpyxfbLMzJOIrAbZZXavHbT_UCpl2WkCaX_MCa-dMCj37TiQ4h3Sp_NCf_OgECcHEw98b87u8kgV3LHB9oAjPY0PWS0LixgorHjZSaoHXLH-VNcLeb3qXTtev9Ql14kCSA0MP0fXOVZuUVcGYkXc-Y",
    },
    {
      id: "inf-003",
      domain: "official-traceguard.net",
      matchPercent: 94,
      severity: "CRITICAL",
      tags: ["Trademark", "Typosquatting"],
      sourceType: "DOMAIN_SQUATTING",
      status: "UNACTIONED",
      systemNote:
        "High similarity in keyword density and meta-tag structure indicates intentional imitation.",
      screenshotUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDxzIeUdxrv37kZzA5bVWg1ne6jUvAzBKmTshE_JYul8FNFLvstA-prkm3L9QX_WKKrWQno1rfubjbVs2p8hhQOJlRbpiS_e2Ns8AKrf0FWqoSSGC_RnhOFxjnC1eia3laFXycjaC_QfFUf8kIIgR4-c4Z2l7plKx1-RUj1O6EOAmLs7VV57KcTfJzuja9Qf0KykqxMXiH2LOj_IAO3FURXflUd1Ab9dooXB_45sRUDDwHNh5KMnjqsn5uAQWX8ea4KNGbBOWKRLn8",
    },
    {
      id: "inf-004",
      domain: "tg-monitoring-app.biz",
      matchPercent: 72,
      severity: "MODERATE",
      tags: ["Copyright", "Asset Scrape"],
      sourceType: "E_COMMERCE",
      status: "UNACTIONED",
      systemNote:
        "Partial match of technical documentation text and API endpoint examples.",
      screenshotUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDEArMTCfcNpQsC-VB9GLFaErwAisJSgmTcvhg9Q_t2LYIENJoOgIGzOwb6Vvkauc8RBmSPIQbWJhSao_g9eJfc09Z_rnLUm7gcfn0_eyDOuFYJ7kNiATK4EQ_L6tupmXemyYATPyic1vGJZ0lkLc6wZnY3Ol6fR4iff7zpCkx1JF1IGysSPftPjqckaPwisd1AsFMQjG4cJI1pSK-ljteVqX5-Oll8ALEwJdqReapQlofeC2avfaZG3kRegqx0QT28iXgNOVKV4Zo",
    },
  ],
};
