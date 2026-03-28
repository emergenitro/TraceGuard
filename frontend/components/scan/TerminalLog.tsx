"use client";

import { useEffect, useRef } from "react";
import type { ScanLogEntry } from "@/lib/api";

interface TerminalLogProps {
  logs: ScanLogEntry[];
}

const LEVEL_COLORS: Record<ScanLogEntry["level"], string> = {
  INFO: "text-primary",
  SCAN: "text-primary",
  ALERT: "text-secondary",
  DATA: "text-tertiary",
};

export default function TerminalLog({ logs }: TerminalLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="col-span-8 bg-surface-container-lowest border border-[#524533]/5 relative overflow-hidden flex flex-col h-[500px]">
      {/* Animated scan line */}
      <div className="scan-line" />

      {/* Terminal header */}
      <div className="p-4 bg-surface-container flex justify-between items-center border-b border-[#524533]/10">
        <div className="flex gap-2">
          <div className="w-2 h-2 bg-error rounded-full" />
          <div className="w-2 h-2 bg-primary rounded-full" />
          <div className="w-2 h-2 bg-on-tertiary-fixed-variant rounded-full" />
        </div>
        <span className="font-headline text-[10px] tracking-widest text-on-surface-variant">
          FORENSIC_DAEMON_LOG.SH
        </span>
      </div>

      {/* Log entries */}
      <div
        ref={scrollRef}
        className="flex-1 p-6 font-mono text-[11px] overflow-y-auto space-y-2 leading-relaxed"
      >
        {logs.map((entry, i) => (
          <div key={i} className="flex gap-4">
            <span className="text-[#524533] shrink-0">{entry.timestamp}</span>
            <span className={`shrink-0 ${LEVEL_COLORS[entry.level]}`}>
              [{entry.level}]
            </span>
            <span className="text-on-surface-variant break-all">
              {entry.message}
            </span>
          </div>
        ))}
        {/* Blinking cursor */}
        <div className="flex gap-4">
          <span className="text-[#524533]">&#x25B6;</span>
          <span className="text-primary cursor-blink">_</span>
        </div>
      </div>

      {/* Status bar */}
      <div className="p-2 bg-surface-container-low text-[9px] font-headline text-on-surface-variant flex justify-between px-4">
        <span>AGENT_STATUS: ACTIVE_CRAWL</span>
        <span>PACKETS: 1.2GB/s</span>
      </div>
    </div>
  );
}
