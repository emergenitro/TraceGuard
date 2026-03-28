"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppSidebar from "@/components/layout/AppSidebar";
import ReportPanel from "@/components/report/ReportPanel";
import { getReport, markAllReviewed, type ReportSummary } from "@/lib/api";
import { exportReportAsPdf } from "@/lib/exportPdf";

export default function ReportPage() {
  const params = useParams();
  const scanId = params.id as string;

  const [report, setReport] = useState<ReportSummary | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isMarkingReviewed, setIsMarkingReviewed] = useState(false);

  useEffect(() => {
    // TODO: when backend is live, getReport() calls /api/reports/:scanId
    getReport(scanId).then(setReport);
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
      <AppSidebar />

      <main className="ml-64 h-screen flex flex-col bg-[#10131a]">
        {/* Top nav for report page (inline, full-width of content area) */}
        <header className="bg-[#191c22] flex justify-between items-center w-full px-6 py-3 shrink-0">
          <div className="flex items-center gap-8">
            <span className="text-xl font-bold text-[#ffb000] tracking-tighter font-headline uppercase">
              TraceGuard
            </span>
            <nav className="hidden md:flex items-center gap-6">
              <a className="text-[#d7c4ac] font-headline font-bold uppercase tracking-wider hover:bg-[#32353c] hover:text-white transition-colors duration-150 px-2 py-1 text-sm cursor-pointer">
                Dashboard
              </a>
              <a className="text-[#ffd597] border-b-2 border-[#ffb000] font-headline font-bold uppercase tracking-wider px-2 py-1 text-sm cursor-pointer">
                Infringements
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-[#1d2026] px-3 py-1.5 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ffb000] text-sm">search</span>
              <input
                className="bg-transparent border-none outline-none text-xs font-headline uppercase tracking-widest w-48 text-[#d7c4ac] placeholder:text-[#524533]"
                placeholder="SEARCH DATABASE..."
                type="text"
              />
            </div>
            <div className="flex gap-3">
              <button className="material-symbols-outlined text-[#ffb000] cursor-pointer active:opacity-80">sensors</button>
              <button className="material-symbols-outlined text-[#ffb000] cursor-pointer active:opacity-80">notifications</button>
              <button className="material-symbols-outlined text-[#ffb000] cursor-pointer active:opacity-80">account_circle</button>
            </div>
          </div>
        </header>

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
              DATABASE SYNC: 100%
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#ffb000] inline-block" />
              ACTIVE SCANS: 42
            </span>
          </div>
          <div className="flex gap-6">
            <span>LATENCY: 12ms</span>
            <span className="text-[#ffb000]">SECURE_SOCKET_ESTABLISHED</span>
          </div>
        </footer>
      </main>
    </>
  );
}
