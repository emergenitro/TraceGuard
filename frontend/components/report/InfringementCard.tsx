"use client";

import Image from "next/image";
import { draftCeaseAndDesist, getFullTrace, type Infringement } from "@/lib/api";

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

  const handleCeaseAndDesist = async () => {
    // TODO: wire to real backend
    const { documentId } = await draftCeaseAndDesist(item.id);
    console.log("C&D draft created:", documentId);
  };

  const handleViewTrace = async () => {
    // TODO: navigate to trace page
    const { traceUrl } = await getFullTrace(item.id);
    console.log("Opening trace:", traceUrl);
  };

  return (
    <article className={`bg-[#1d2026] group relative ${style.border}`}>
      <div className="flex h-full">
        {/* Screenshot thumbnail */}
        <div className="w-48 relative overflow-hidden bg-[#0b0e14] shrink-0">
          {item.screenshotUrl && (
            <Image
              src={item.screenshotUrl}
              alt={`Screenshot of ${item.domain}`}
              fill
              className="object-cover opacity-60 group-hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
              unoptimized
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#10131a] to-transparent" />
          <div
            className={`absolute top-2 left-2 text-[9px] font-black px-2 py-0.5 tracking-tighter uppercase ${style.badge}`}
          >
            {item.severity}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <h2 className="font-headline text-lg font-bold leading-tight">
                {item.domain}
              </h2>
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
              className="flex-1 bg-[#ffb000] text-[#432c00] text-[9px] font-bold py-2 tracking-widest uppercase hover:brightness-110 transition"
            >
              DRAFT CEASE &amp; DESIST
            </button>
            <button
              onClick={handleViewTrace}
              className="flex-1 border border-[#524533] text-[#d7c4ac] text-[9px] font-bold py-2 tracking-widest uppercase hover:bg-[#32353c] transition"
            >
              VIEW FULL TRACE
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
