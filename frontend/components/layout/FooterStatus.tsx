"use client";

import { useEffect, useState } from "react";

interface FooterStatusProps {
  version?: string;
  protocol?: string;
}

export default function FooterStatus({
  version = "v.2.0.4-STABLE",
  protocol = "FORENSIC_INDEX_ALPHA",
}: FooterStatusProps) {
  const [utcTime, setUtcTime] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setUtcTime(
        now.toUTCString().split(" ").slice(4, 5)[0] // HH:MM:SS
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="fixed bottom-0 left-0 w-full bg-surface-container-lowest border-t border-[#524533]/10 px-6 py-2 z-50 flex justify-between items-center overflow-hidden">
      <div className="flex gap-6 items-center">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-label font-bold text-outline uppercase tracking-widest">
            System:
          </span>
          <span className="text-[9px] font-label font-medium text-primary uppercase">
            {version}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-[9px] font-label font-bold text-outline uppercase tracking-widest">
            Protocol:
          </span>
          <span className="text-[9px] font-label font-medium text-on-surface uppercase">
            {protocol}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          <span className="text-[9px] font-label font-bold text-outline uppercase tracking-widest">
            Global Ops Normal
          </span>
        </div>
        <span className="text-[9px] font-label font-bold text-outline tabular-data uppercase">
          {utcTime} UTC
        </span>
      </div>
    </footer>
  );
}
