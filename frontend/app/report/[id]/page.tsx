"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import LandingTopNav from "@/components/layout/LandingTopNav";
import { useAuth } from "@/lib/auth-context";
import ReportPanel from "@/components/report/ReportPanel";
import { getReport, getUserScans, markAllReviewed, type ReportSummary } from "@/lib/api";
import { exportReportAsPdf } from "@/lib/exportPdf";

export default function ReportPage() {
  const params = useParams();
  const scanId = params.id as string;
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [report, setReport] = useState<ReportSummary | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isMarkingReviewed, setIsMarkingReviewed] = useState(false);
  const [activeScans, setActiveScans] = useState<number | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [isSecure, setIsSecure] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    setIsSecure(window.location.protocol === "https:");
    getUserScans().then((scans) => {
      setActiveScans(scans.filter((s) => s.status === "scanning" || s.status === "queued").length);
    });
  }, []);

  useEffect(() => {
    const start = performance.now();
    getReport(scanId).then((data) => {
      setLatency(Math.round(performance.now() - start));
      setReport(data);
    });
  }, [scanId]);

  const handleExport = async () => {
    if (!report) return;
    setIsExporting(true);
    try {
      await exportReportAsPdf(report);
    } finally {
      setIsExporting(false);
    }
  };

  const handleMarkAllReviewed = async () => {
    setIsMarkingReviewed(true);
    try {
      // TODO: wire to real backend
      await markAllReviewed(scanId);
    } finally {
      setIsMarkingReviewed(false);
    }
  };

  return (
    <>
      <LandingTopNav />

      <main className="mt-[60px] h-[calc(100vh-60px)] flex flex-col bg-[#10131a]">

        {/* Report header with action buttons */}
        <section className="p-6 bg-[#1d2026] flex justify-between items-end shrink-0">
          <div>
            <h1 className="font-headline text-3xl font-bold uppercase tracking-tight text-[#e1e2eb]">
              Infringement Report
            </h1>
            <p className="font-body text-xs text-[#d7c4ac] mt-1 uppercase tracking-widest">
              {report
                ? `Live Monitoring Result: ${report.totalMatches.toLocaleString()} Matches Detected`
                : "Loading..."}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              disabled={isExporting || !report}
              className="bg-[#32353c] text-[#ffd597] px-4 py-2 text-[10px] font-bold tracking-widest uppercase hover:bg-[#363940] flex items-center gap-2 border border-[#524533] disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              {isExporting ? "GENERATING PDF..." : "EXPORT PDF"}
            </button>
            <button
              onClick={handleMarkAllReviewed}
              disabled={isMarkingReviewed}
              className="bg-[#ffb000] text-[#432c00] px-4 py-2 text-[10px] font-bold tracking-widest uppercase hover:brightness-110 disabled:opacity-60"
            >
              {isMarkingReviewed ? "SAVING..." : "MARK ALL AS REVIEWED"}
            </button>
          </div>
        </section>

        {/* Filters + results */}
        {report ? (
          <ReportPanel infringements={report.infringements} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-on-surface-variant">
            <div className="flex flex-col items-center gap-4">
              <span className="material-symbols-outlined text-4xl animate-spin">sync</span>
              <p className="text-sm uppercase tracking-widest font-headline opacity-40">
                Loading report...
              </p>
            </div>
          </div>
        )}

        {/* Status footer */}
        <footer className="bg-[#0b0e14] border-t border-[#1d2026] px-6 py-2 flex justify-between items-center text-[9px] font-label font-semibold tracking-[0.2em] uppercase text-[#9f8e78] shrink-0">
          <div className="flex gap-6">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#ffb000] inline-block" />
              ACTIVE SCANS: {activeScans ?? "..."}
            </span>
          </div>
          <div className="flex gap-6">
            <span>LATENCY: {latency != null ? `${latency}ms` : "..."}</span>
            <span className="text-[#ffb000]">
              {isSecure ? "SECURE_SOCKET_ESTABLISHED" : "SECURE_SOCKET_NOT_ESTABLISHED"}
            </span>
          </div>
        </footer>
      </main>
    </>
  );
}
