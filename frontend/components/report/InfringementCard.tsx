"use client";

import { useState } from "react";
import type { Infringement } from "@/lib/api";
import { draftCeaseAndDesist } from "@/lib/api";

interface InfringementCardProps {
  item: Infringement;
}

const SEVERITY_STYLES: Record<
  Infringement["severity"],
  { badge: string; border: string; matchColor: string }
> = {
  CRITICAL: {
    badge: "bg-[#930014] text-white",
    border: "border-l-4 border-[#ffb3ae]",
    matchColor: "text-[#ffb3ae]",
  },
  MODERATE: {
    badge: "bg-[#6a4700] text-white",
    border: "border-l-4 border-[#ffb000]",
    matchColor: "text-[#ffb000]",
  },
  OBSERVATIONAL: {
    badge: "bg-[#32353c] text-[#d7c4ac]",
    border: "border-l-4 border-[#524533]",
    matchColor: "text-[#d7c4ac]",
  },
};

export default function InfringementCard({ item }: InfringementCardProps) {
  const style = SEVERITY_STYLES[item.severity];
  const [drafting, setDrafting] = useState(false);

  async function handleCeaseAndDesist() {
    setDrafting(true);
    try {
      const { subject, body, to } = await draftCeaseAndDesist(item.id);
      const toParam = to ? `${encodeURIComponent(to)}` : "";
      window.location.href = `mailto:${toParam}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } finally {
      setDrafting(false);
    }
  }

  const sourceHref = item.link ?? `https://${item.domain}`;

  return (
    <article className={`bg-[#1d2026] group relative ${style.border}`}>
      <div className="flex h-full">


        {/* Content */}
        <div className="flex-1 p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <h2 className="font-headline text-lg font-bold leading-tight">
                  {item.domain}
                </h2>
                <span className={`text-[9px] font-bold px-2 py-0.5 uppercase tracking-widest ${style.badge}`}>
                  {item.severity}
                </span>
              </div>
              <span className={`font-headline font-bold text-2xl ${style.matchColor}`}>
                {item.matchPercent}%
              </span>
            </div>

            <div className="flex gap-2 mb-3 flex-wrap">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className={`text-[9px] font-bold px-2 py-0.5 bg-[#32353c] uppercase tracking-widest ${
                    item.severity === "CRITICAL"
                      ? "text-[#ffb4ab] border border-[#930014]/30"
                      : "text-[#ffb000] border border-[#6a4700]/30"
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>

            <p className="text-[#d7c4ac] text-xs leading-relaxed mb-4 italic border-l border-[#524533] pl-3">
              <span className="text-[#ffb000] font-bold uppercase text-[9px] block mb-1">
                System Note:
              </span>
              {item.systemNote}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleCeaseAndDesist}
              disabled={drafting}
              className="flex-1 bg-[#ffb000] text-[#432c00] text-[9px] font-bold py-2 tracking-widest uppercase hover:brightness-110 transition text-center disabled:opacity-60"
            >
              {drafting ? "DRAFTING..." : "DRAFT CEASE & DESIST"}
            </button>
            <a
              href={sourceHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 border border-[#524533] text-[#d7c4ac] text-[9px] font-bold py-2 tracking-widest uppercase hover:bg-[#32353c] transition text-center"
            >
              VIEW SOURCE
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
