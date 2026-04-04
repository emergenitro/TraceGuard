"use client";

import { useEffect, useState } from "react";

export default function FooterStatus() {
  const [utcTime, setUtcTime] = useState("");

  useEffect(() => {
    const update = () => {
      setUtcTime(new Date().toUTCString().split(" ").slice(4, 5)[0]);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="fixed bottom-0 left-0 w-full bg-surface-container-lowest border-t border-[#524533]/10 px-6 py-2 z-50 flex justify-between items-center">
      <span className="text-[9px] font-label font-bold text-outline/40 uppercase tracking-widest">
        TraceGuard
      </span>
      <span className="text-[9px] font-label font-bold text-outline tabular-data uppercase">
        {utcTime} UTC
      </span>
    </footer>
  );
}
