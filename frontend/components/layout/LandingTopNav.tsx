"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getAlertCount, getUserScans, logout as apiLogout, type DashboardScan } from "@/lib/api";

export default function LandingTopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const [alertCount, setAlertCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [alertScans, setAlertScans] = useState<DashboardScan[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const fetchData = () => {
      getAlertCount().then(setAlertCount).catch(() => {});
      getUserScans()
        .then((scans) => setAlertScans(scans.filter((s) => s.alertCount > 0)))
        .catch(() => {});
    };
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]);

  const handleLogout = async () => {
    await apiLogout();
    router.replace("/login");
  };

  return (
    <nav className="fixed top-0 z-50 flex justify-between items-center w-full px-6 py-3 bg-[#191c22]">
      <div className="flex items-center gap-8">
        <Link href={user ? "/dashboard" : "/"}>
          <span className="text-xl font-bold text-[#ffb000] tracking-tighter font-headline uppercase cursor-pointer">
            TraceGuard
          </span>
        </Link>
        <Link href="/">
          <span className={`text-sm font-headline font-bold uppercase tracking-wider cursor-pointer transition-colors ${pathname === "/" ? "text-[#ffd597] border-b-2 border-[#ffb000]" : "text-outline hover:text-[#ffd597]"}`}>
            Monitor
          </span>
        </Link>
        {user && (
          <Link href="/dashboard">
            <span className={`text-sm font-headline font-bold uppercase tracking-wider cursor-pointer transition-colors ${pathname === "/dashboard" || pathname.startsWith("/report/") || pathname.startsWith("/scan/") ? "text-[#ffd597] border-b-2 border-[#ffb000]" : "text-outline hover:text-[#ffd597]"}`}>
              Dashboard
            </span>
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4">
        {!isLoading && (
          <>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setNotifOpen((o) => !o)}
                className="material-symbols-outlined text-[#ffb000] cursor-pointer active:opacity-80"
              >
                notifications
              </button>
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white px-1 leading-none pointer-events-none">
                  {alertCount > 99 ? "99+" : alertCount}
                </span>
              )}
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-[#1e2128] border border-[#32353c] shadow-xl z-50">
                  <div className="px-4 py-2 border-b border-[#32353c] flex items-center justify-between">
                    <span className="text-[10px] font-headline font-bold tracking-widest text-[#ffb000]">
                      ALERTS
                    </span>
                    <span className="text-[9px] font-headline text-outline">
                      {alertCount} UNACTIONED
                    </span>
                  </div>
                  {alertScans.length === 0 ? (
                    <div className="px-4 py-6 text-center text-[10px] font-headline text-outline tracking-widest">
                      NO ACTIVE ALERTS
                    </div>
                  ) : (
                    <ul className="max-h-72 overflow-y-auto">
                      {alertScans.map((scan) => (
                        <li key={scan.id}>
                          <Link
                            href={`/report/${scan.id}`}
                            onClick={() => setNotifOpen(false)}
                            className="flex items-center justify-between px-4 py-3 hover:bg-[#32353c] transition-colors duration-100 group"
                          >
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <span className="text-[11px] font-headline font-bold text-[#d7c4ac] group-hover:text-white truncate tracking-wide">
                                {scan.assetName}
                              </span>
                              <span className="text-[9px] font-headline text-outline tracking-widest">
                                {scan.assetType}
                              </span>
                            </div>
                            <span className="ml-3 shrink-0 min-w-[28px] h-5 bg-red-500/20 border border-red-500/40 text-red-400 text-[9px] font-bold font-headline flex items-center justify-center px-1.5">
                              {scan.alertCount}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {user ? (
              <button
                onClick={handleLogout}
                className="material-symbols-outlined text-[#ffb000] cursor-pointer active:opacity-80"
                title={`Sign out (${user.email})`}
              >
                logout
              </button>
            ) : (
              <Link href="/login">
                <span className="material-symbols-outlined text-[#ffb000] cursor-pointer active:opacity-80">
                  account_circle
                </span>
              </Link>
            )}
          </>
        )}
      </div>
    </nav>
  );
}
