const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export type AssetType = "trademark" | "copyright" | "product" | "patent";

export interface User {
  id: string;
  email: string;
}

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
  stream: StreamItem[];
}

export interface ScanLogEntry {
  timestamp: string;
  level: "INFO" | "SCAN" | "ALERT" | "DATA";
  message: string;
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
  link?: string | null;
}

export interface ReportSummary {
  scanId: string;
  totalMatches: number;
  infringements: Infringement[];
}

export interface ExportReportResponse {
  downloadUrl: string;
}

export interface DashboardScan {
  id: string;
  assetName: string;
  assetType: AssetType;
  status: "queued" | "scanning" | "paused" | "complete";
  startedAt: string;
  progressPercent: number;
  alertCount: number;
  totalInfringements: number;
}

// ── Token management ──────────────────────────────────────────────────────────

let accessToken: string | null = null;
let refreshInFlight: Promise<string | null> | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export async function refreshSession(): Promise<{ user: User; accessToken: string } | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return null;
    const data = await res.json();
    accessToken = data.accessToken;
    return data;
  } catch {
    return null;
  }
}

async function attemptTokenRefresh(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = refreshSession()
      .then((d) => d?.accessToken ?? null)
      .finally(() => { refreshInFlight = null; });
  }
  return refreshInFlight;
}

// ── Auth API ──────────────────────────────────────────────────────────────────

export async function requestOtp(email: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/auth/request-otp`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
}

export async function verifyOtp(
  email: string,
  otp: string
): Promise<{ accessToken: string; user: User }> {
  const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Verification failed: ${res.status}`);
  }
  const data = await res.json();
  accessToken = data.accessToken;
  return data;
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  accessToken = null;
}

// ── Data API ──────────────────────────────────────────────────────────────────

export async function getStats(): Promise<{ totalScans: number; activeAlerts: number }> {
  return request<{ totalScans: number; activeAlerts: number }>("/api/stats");
}

export async function getAlertCount(): Promise<number> {
  const data = await request<{ count: number }>("/api/stats/alerts");
  return data.count;
}

export async function getUserScans(): Promise<DashboardScan[]> {
  return request<DashboardScan[]>("/api/dashboard/scans");
}

export async function startInvestigation(
  payload: StartInvestigationPayload
): Promise<{ scanId: string }> {
  return request<{ scanId: string }>("/api/investigations", {
    method: "POST",
    body: JSON.stringify({
      assetType: payload.assetType,
      assetName: payload.assetName,
      primaryUrl: payload.primaryUrl,
      fileName: payload.file?.name,
    }),
  });
}

export async function getScan(id: string): Promise<ScanStatus> {
  return request<ScanStatus>(`/api/scans/${id}`, {
    cache: "no-store",
  });
}

export async function toggleScanPause(
  id: string,
  paused: boolean
): Promise<void> {
  await request(`/api/scans/${id}/${paused ? "pause" : "resume"}`, {
    method: "POST",
  });
}

export async function getReport(scanId: string): Promise<ReportSummary> {
  return request<ReportSummary>(`/api/reports/${scanId}`, {
    cache: "no-store",
  });
}

export async function exportReport(
  scanId: string
): Promise<ExportReportResponse> {
  return request<ExportReportResponse>(`/api/reports/${scanId}/export`, {
    method: "POST",
  });
}

export async function markAllReviewed(scanId: string): Promise<void> {
  await request(`/api/reports/${scanId}/mark-reviewed`, {
    method: "POST",
  });
}

export async function draftCeaseAndDesist(
  infringementId: string
): Promise<{ documentId: string; subject: string; body: string; to: string | null }> {
  return request<{ documentId: string; subject: string; body: string; to: string | null }>(
    `/api/infringements/${infringementId}/cease-and-desist`,
    { method: "POST" }
  );
}

export async function getFullTrace(
  infringementId: string
): Promise<{ traceUrl: string }> {
  return request<{ traceUrl: string }>(
    `/api/infringements/${infringementId}/trace`,
    { cache: "no-store" }
  );
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetchWithAuth(path, init);

  if (response.status === 401) {
    const newToken = await attemptTokenRefresh();
    if (!newToken) throw new Error("Unauthorized");
    const retry = await fetchWithAuth(path, init, newToken);
    if (!retry.ok) {
      if (retry.status === 401) throw new Error("Unauthorized");
      throw new Error(`API request failed with status ${retry.status}`);
    }
    if (retry.status === 204) return undefined as T;
    return retry.json() as Promise<T>;
  }

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function fetchWithAuth(path: string, init?: RequestInit, token?: string): Promise<Response> {
  const tok = token ?? accessToken;
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(tok ? { Authorization: `Bearer ${tok}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
}
