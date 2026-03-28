import { getScan } from "@/lib/api";
import AppSidebar from "@/components/layout/AppSidebar";
import AppTopNav from "@/components/layout/AppTopNav";
import TerminalLog from "@/components/scan/TerminalLog";
import ScanSidePanel from "@/components/scan/ScanSidePanel";
import DataStream from "@/components/scan/DataStream";
import Link from "next/link";

interface ScanPageProps {
  params: { id: string };
}

export default async function ScanPage({ params }: ScanPageProps) {
  // TODO: When backend is ready, getScan() will fetch from /api/scans/:id
  const scan = await getScan(params.id);

  return (
    <>
      <AppSidebar />
      <AppTopNav />

      <main className="ml-64 mt-[60px] p-6 min-h-screen">
        {/* Dashboard header */}
        <div className="flex justify-between items-end mb-8 border-b border-[#524533]/10 pb-6">
          <div>
            <p className="font-headline text-[10px] text-primary font-bold tracking-[0.3em] mb-2">
              OPERATIONAL OVERVIEW
            </p>
            <h2 className="font-headline text-4xl font-bold text-on-surface tracking-tighter">
              Live Web Crawl{" "}
              <span className="text-primary-fixed-dim">ID-{scan.id}</span>
            </h2>
          </div>

          {/* Progress + action buttons */}
          <div className="flex items-end gap-6">
            <div className="text-right">
              <div className="flex items-center justify-end gap-2 mb-1">
                <span className="text-[10px] font-headline text-on-surface-variant tracking-widest">
                  SCAN PROGRESS
                </span>
                <span className="text-lg font-headline font-bold text-primary">
                  {scan.progressPercent}%
                </span>
              </div>
              <div className="w-64 h-1 bg-surface-container-highest relative overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-primary-container"
                  style={{ width: `${scan.progressPercent}%` }}
                />
                <div
                  className="absolute top-0 left-0 h-full bg-primary opacity-50 blur-sm"
                  style={{ width: `${scan.progressPercent * 0.4}%` }}
                />
              </div>
            </div>

            {/* View report CTA - only shown when done or partially done */}
            <Link href={`/report/${scan.id}`}>
              <button className="bg-primary-container text-on-primary text-[10px] font-headline font-bold px-4 py-3 tracking-widest uppercase hover:brightness-110 transition flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">
                  assignment
                </span>
                VIEW REPORT
              </button>
            </Link>
          </div>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-12 gap-6">
          <TerminalLog logs={scan.logs} />
          <ScanSidePanel nodes={scan.nodes} telemetry={scan.telemetry} />
          <DataStream items={scan.stream} />
        </div>

        {/* Footer metadata */}
        <div className="mt-8 flex justify-between items-center text-[10px] font-headline font-medium tracking-widest text-on-surface-variant/40">
          <div className="flex gap-6">
            <span>COORD: 34.0522° N, 118.2437° W</span>
            <span>SYSTEM_ENTROPY: 0.0021</span>
            <span>UPLINK_LATENCY: 14MS</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[12px]">lock</span>
            <span>END-TO-END ENCRYPTED FORENSIC SESSION</span>
          </div>
        </div>
      </main>
    </>
  );
}
