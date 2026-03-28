"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: "dashboard" },
  { label: "Infringements", href: "/report/8829", icon: "gavel" },
  { label: "Case Files", href: "/cases", icon: "folder_shared" },
  { label: "Global Scan", href: "/global", icon: "language" },
  { label: "Settings", href: "/settings", icon: "settings" },
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full flex flex-col z-40 bg-[#10131a] w-64">
      {/* System status header */}
      <div className="p-6 border-b border-[#524533]/10">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 bg-primary-container status-pulse-animated" />
          <span className="font-headline text-xs font-semibold uppercase tracking-widest text-primary">
            SYSTEM ACTIVE
          </span>
        </div>
        <p className="font-body text-[10px] text-on-surface-variant tracking-tighter opacity-50">
          V.2.0.4-STABLE
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 mt-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`py-4 px-6 flex items-center gap-3 active:scale-[0.98] transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-[#1d2026] text-[#ffb000] border-l-4 border-[#ffb000]"
                    : "text-[#9f8e78] hover:bg-[#191c22] hover:text-[#ffd597]"
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {item.icon}
                </span>
                <span className="font-headline text-xs font-semibold uppercase tracking-widest">
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* New Investigation CTA */}
      <div className="px-6 pb-4">
        <Link href="/">
          <button className="w-full bg-primary-container text-on-primary font-headline text-xs font-bold py-4 tracking-widest active:opacity-80 transition-opacity uppercase">
            NEW INVESTIGATION
          </button>
        </Link>
      </div>

      {/* Footer links */}
      <div className="mt-auto p-4 border-t border-[#524533]/10">
        <button className="flex items-center gap-3 p-2 text-[#9f8e78] hover:text-primary transition-colors w-full">
          <span className="material-symbols-outlined text-sm">help</span>
          <span className="font-headline text-[10px] font-semibold uppercase tracking-widest">
            Support
          </span>
        </button>
        <button className="flex items-center gap-3 p-2 text-[#9f8e78] hover:text-primary transition-colors w-full">
          <span className="material-symbols-outlined text-sm">monitor_heart</span>
          <span className="font-headline text-[10px] font-semibold uppercase tracking-widest">
            System Status
          </span>
        </button>
      </div>
    </aside>
  );
}
