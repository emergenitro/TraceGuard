"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getUserScans, type DashboardScan } from "@/lib/api";
import LandingTopNav from "@/components/layout/LandingTopNav";

const STATUS_LABEL: Record<DashboardScan["status"], string> = {
  queued: "QUEUED",
  scanning: "SCANNING",
  paused: "PAUSED",
  stopped: "STOPPED",
  complete: "COMPLETE",
};

const STATUS_COLOR: Record<DashboardScan["status"], string> = {
  queued: "text-outline",
  scanning: "text-[#ffd597]",
  paused: "text-[#ffb3ae]",
  stopped: "text-[#cf6679]",
  complete: "text-[#4caf7d]",
};

const ASSET_ICON: Record<string, string> = {
  trademark: "verified",
  copyright: "copyright",
  product: "inventory_2",
  patent: "gavel",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [scans, setScans] = useState<DashboardScan[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    getUserScans()
      .then(setScans)
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  if (isLoading || !user) return null;

  return (
    <>
      <LandingTopNav />
      <main className="pt-24 pb-20 px-6 min-h-screen grid-pattern">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-headline text-2xl font-bold uppercase tracking-tight text-on-surface">
                My Investigations
              </h1>
              <p className="text-[10px] font-label text-outline uppercase tracking-widest mt-1">
                {user.email}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="px-4 py-2 border border-[#524533]/30 text-[10px] font-label font-bold uppercase tracking-widest text-outline hover:text-on-surface hover:border-primary/50 transition-colors"
              >
                + New Scan
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-[10px] font-label font-bold uppercase tracking-widest text-outline hover:text-on-surface transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>

          {fetching ? (
            <div className="flex items-center gap-3 text-outline">
              <span className="material-symbols-outlined animate-spin">sync</span>
              <span className="text-[10px] font-label uppercase tracking-widest">Loading...</span>
            </div>
          ) : scans.length === 0 ? (
            <div className="bg-surface-container p-1">
              <div className="bg-surface-container-lowest p-16 border border-[#524533]/10 flex flex-col items-center gap-4">
                <span className="material-symbols-outlined text-4xl text-outline">
                  manage_search
                </span>
                <p className="text-[10px] font-label font-bold uppercase tracking-widest text-outline">
                  No investigations yet
                </p>
                <Link
                  href="/"
                  className="mt-2 px-6 py-3 bg-primary-container text-on-primary text-[10px] font-label font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
                >
                  Start your first scan
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {scans.map((scan) => {
                const href =
                  scan.status === "complete"
                    ? `/report/${scan.id}`
                    : `/scan/${scan.id}`;
                return (
                  <Link
                    key={scan.id}
                    href={href}
                    className="block bg-surface-container p-1 hover:bg-surface-container-low transition-colors group"
                  >
                    <div className="bg-surface-container-lowest p-5 border border-[#524533]/10 group-hover:border-[#524533]/25 transition-colors">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <span className="material-symbols-outlined text-[#ffb000] shrink-0">
                            {ASSET_ICON[scan.assetType] ?? "shield"}
                          </span>
                          <div className="min-w-0">
                            <p className="font-headline font-bold text-on-surface truncate">
                              {scan.assetName}
                            </p>
                            <p className="text-[10px] font-label text-outline uppercase tracking-widest mt-0.5">
                              {scan.assetType} · {formatDate(scan.startedAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 shrink-0">
                          {scan.status === "scanning" && (
                            <div className="w-24 h-1 bg-surface-container-low overflow-hidden">
                              <div
                                className="h-full bg-[#ffb000] transition-all"
                                style={{ width: `${scan.progressPercent}%` }}
                              />
                            </div>
                          )}

                          {scan.alertCount > 0 && (
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                              <span className="text-[10px] font-label font-bold text-red-400 uppercase tracking-widest">
                                {scan.alertCount} alert{scan.alertCount !== 1 ? "s" : ""}
                              </span>
                            </div>
                          )}

                          <span
                            className={`text-[10px] font-label font-bold uppercase tracking-widest ${STATUS_COLOR[scan.status]}`}
                          >
                            {STATUS_LABEL[scan.status]}
                          </span>

                          <span className="material-symbols-outlined text-outline text-sm group-hover:text-on-surface transition-colors">
                            arrow_forward
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
