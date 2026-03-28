const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export type AssetType = "trademark" | "copyright" | "product" | "patent";

export interface StartInvestigationPayload {
  assetType: AssetType;
  assetName: string;
  primaryUrl: string;
  email?: string;
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
}

export interface ReportSummary {
  scanId: string;
  totalMatches: number;
  infringements: Infringement[];
}

export interface ExportReportResponse {
  downloadUrl: string;
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
      email: payload.email,
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
): Promise<{ documentId: string }> {
  return request<{ documentId: string }>(
    `/api/infringements/${infringementId}/cease-and-desist`,
    {
      method: "POST",
    }
  );
}

export async function getFullTrace(
  infringementId: string
): Promise<{ traceUrl: string }> {
  return request<{ traceUrl: string }>(
    `/api/infringements/${infringementId}/trace`,
    {
      cache: "no-store",
    }
  );
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
