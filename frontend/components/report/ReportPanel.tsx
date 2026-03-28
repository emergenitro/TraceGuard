"use client";

import { useState } from "react";
import type { Infringement } from "@/lib/api";
import InfringementCard from "./InfringementCard";
import ReportFilterSidebar, {
  type ReportFilters,
} from "./ReportFilterSidebar";

interface ReportPanelProps {
  infringements: Infringement[];
}

const DEFAULT_FILTERS: ReportFilters = {
  severity: ["CRITICAL", "MODERATE"],
  sourceType: ["DOMAIN_SQUATTING", "SOCIAL_MEDIA", "E_COMMERCE"],
  status: "UNACTIONED",
};

export default function ReportPanel({ infringements }: ReportPanelProps) {
  const [filters, setFilters] = useState<ReportFilters>(DEFAULT_FILTERS);

  const filtered = infringements.filter(
    (item) =>
      filters.severity.includes(item.severity) &&
      filters.sourceType.includes(item.sourceType)
    // status filter would also go here once the items have dynamic status
  );

  return (
    <section className="flex-1 flex overflow-hidden">
      <ReportFilterSidebar filters={filters} onChange={setFilters} />

      <div className="flex-1 overflow-y-auto p-6 bg-[#10131a]">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl mb-4 opacity-40">
              search_off
            </span>
            <p className="text-sm uppercase tracking-widest font-headline opacity-40">
              No results match current filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filtered.map((item) => (
              <InfringementCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
