"use client";

import Link from "next/link";

interface LandingTopNavProps {
  activeTab?: "monitor" | "archive" | "network";
}

export default function LandingTopNav({
  activeTab = "monitor",
}: LandingTopNavProps) {
  const tabs = [
    { id: "monitor" as const, label: "Monitor", href: "/" },
    { id: "archive" as const, label: "Archive", href: "/archive" },
    { id: "network" as const, label: "Network", href: "/network" },
  ];

  return (
    <nav className="fixed top-0 z-50 flex justify-between items-center w-full px-6 py-3 bg-[#191c22]">
      <div className="flex items-center gap-8">
        <Link href="/">
          <span className="text-xl font-bold text-[#ffb000] tracking-tighter font-headline uppercase cursor-pointer">
            TraceGuard
          </span>
        </Link>
        <div className="hidden md:flex gap-6">
          {tabs.map((tab) => (
            <Link key={tab.id} href={tab.href}>
              <span
                className={`text-sm font-headline font-bold uppercase tracking-wider cursor-pointer transition-colors duration-150 ${
                  activeTab === tab.id
                    ? "text-[#ffd597] border-b-2 border-[#ffb000]"
                    : "text-[#d7c4ac] hover:bg-[#32353c] hover:text-white px-2 py-1"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="material-symbols-outlined text-[#ffb000] cursor-pointer active:opacity-80">
          sensors
        </button>
        <button className="material-symbols-outlined text-[#ffb000] cursor-pointer active:opacity-80">
          notifications
        </button>
        <button className="material-symbols-outlined text-[#ffb000] cursor-pointer active:opacity-80">
          account_circle
        </button>
      </div>
    </nav>
  );
}
