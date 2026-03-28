import Image from "next/image";
import type { NodeStatus, ScanStatus } from "@/lib/api";

interface ScanSidePanelProps {
  nodes: NodeStatus[];
  telemetry: ScanStatus["telemetry"];
}

export default function ScanSidePanel({ nodes, telemetry }: ScanSidePanelProps) {
  return (
    <div className="col-span-4 space-y-6">
      {/* Global Nodes Map */}
      <div className="bg-surface-container border border-[#524533]/5 p-6 h-[240px] relative overflow-hidden">
        <h3 className="font-headline text-xs font-bold tracking-widest text-on-surface-variant mb-4 uppercase">
          Global Search Nodes
        </h3>

        {/* Map background */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <Image
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBihWdqnJuTYF_yAxhmpw5JESFP1nmoIyXZYCxGaj-sOxuKescBDDslyYV_441o5B5m4nbiWfHgmeA3OsmkrVKmuQCeEB6u--kltsKF-YkAvMTfcQOvlb3_w0ELfIeKUndkBs2oDix4JV8vd0FOokm_ZMjz1fAD49talqx7LggknnBB5tvH3lMBYYgVedPiy5044ZrritjJIYaJ76-J7pAhLP-vonqPuww1ASx8smKJjQgB9zHOv4dHmVlgvoTCVtBM9-pF9Y-tX6U"
            alt="World map"
            fill
            className="object-cover"
            unoptimized
          />
        </div>

        {/* Node list */}
        <div className="relative z-10 space-y-4 mt-2">
          {nodes.map((node) => (
            <div key={node.region} className="flex items-center justify-between">
              <span
                className={`text-[10px] font-headline tracking-widest uppercase ${
                  node.status === "idle" ? "opacity-40" : ""
                }`}
              >
                {node.region}
                {node.status === "idle" ? " (Idle)" : ""}
              </span>
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  node.status === "active"
                    ? "bg-primary-container status-pulse"
                    : "bg-[#524533]"
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Infringement Telemetry */}
      <div className="bg-surface-container-high p-6 border border-[#524533]/5 h-[236px]">
        <h3 className="font-headline text-xs font-bold tracking-widest text-on-surface-variant mb-6 uppercase">
          Infringement Telemetry
        </h3>

        <div className="space-y-6">
          {/* Detection Confidence */}
          <div>
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] font-headline tracking-widest uppercase opacity-70">
                Detection Confidence
              </span>
              <span className="text-sm font-headline font-bold text-primary">
                {telemetry.detectionConfidence}%
              </span>
            </div>
            <div className="w-full h-1 bg-surface-container-lowest overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{ width: `${telemetry.detectionConfidence}%` }}
              />
            </div>
          </div>

          {/* Visual Matching */}
          <div>
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] font-headline tracking-widest uppercase opacity-70">
                Visual Matching
              </span>
              <span className="text-sm font-headline font-bold text-primary">
                {telemetry.visualMatching}%
              </span>
            </div>
            <div className="w-full h-1 bg-surface-container-lowest overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{ width: `${telemetry.visualMatching}%` }}
              />
            </div>
          </div>

          {/* High priority warning */}
          {telemetry.highPriorityRisk && (
            <div className="pt-2">
              <div className="flex items-center gap-4 text-secondary">
                <span className="material-symbols-outlined text-sm">warning</span>
                <span className="text-[10px] font-headline font-bold tracking-tighter uppercase">
                  High Priority Risk Detected
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
