"use client";

import Link from "next/link";

export default function AppTopNav() {
  return (
    <header className="fixed top-0 right-0 left-64 z-30 bg-[#191c22] flex justify-between items-center px-6 py-3">
      <div className="flex items-center gap-4">
        <Link href="/">
          <h1 className="text-xl font-bold text-[#ffb000] tracking-tighter font-headline cursor-pointer">
            TraceGuard
          </h1>
        </Link>
        <div className="h-6 w-px bg-[#524533]/40" />
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
            search
          </span>
          <input
            type="text"
            placeholder="QUERY DATABASE..."
            className="bg-surface-container-lowest border-none text-[10px] font-headline tracking-widest pl-10 pr-4 py-2 w-64 focus:outline-none focus:ring-1 focus:ring-primary text-on-surface placeholder:text-outline/60"
          />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#ffb000] text-sm">
            sensors
          </span>
          <span className="text-[10px] font-headline font-bold text-[#ffb000] tracking-widest">
            UPLINK STABLE
          </span>
        </div>
        <div className="flex gap-4">
          <button className="text-[#d7c4ac] hover:bg-[#32353c] hover:text-white p-2 transition-colors duration-150 cursor-pointer active:opacity-80">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="text-[#d7c4ac] hover:bg-[#32353c] hover:text-white p-2 transition-colors duration-150 cursor-pointer active:opacity-80">
            <span className="material-symbols-outlined">account_circle</span>
          </button>
        </div>
      </div>
    </header>
  );
}
