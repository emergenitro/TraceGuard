export default function HeroColumn() {
  return (
    <div className="lg:col-span-5 flex flex-col justify-between py-8">
      <div>
        {/* Status badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-lowest border border-[#524533]/20 mb-6">
          <span className="w-2 h-2 bg-primary-container status-pulse-animated block" />
          <span className="text-[10px] font-label font-bold tracking-[0.2em] text-on-surface-variant uppercase">
            System Status: Active
          </span>
        </div>

        <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter leading-none mb-6">
          SECURE YOUR{" "}
          <span className="text-primary-fixed-dim">DIGITAL</span> ASSETS.
        </h1>

        <p className="text-on-surface-variant max-w-md text-lg font-light leading-relaxed mb-8">
          Forensic-level intellectual property monitoring. Global real-time
          scanning for unauthorized trademark, patent, and copyright
          infringements.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 border-t border-[#524533]/10 pt-8">
        <div className="p-4 bg-surface-container-lowest">
          <span className="block text-[10px] font-label font-bold text-outline uppercase tracking-widest mb-1">
            Total Scans
          </span>
          <span className="text-2xl font-headline font-bold tabular-data">
            1,402,881
          </span>
        </div>
        <div className="p-4 bg-surface-container-lowest">
          <span className="block text-[10px] font-label font-bold text-outline uppercase tracking-widest mb-1">
            Active Alerts
          </span>
          <span className="text-2xl font-headline font-bold tabular-data text-secondary">
            24
          </span>
        </div>
      </div>
    </div>
  );
}
