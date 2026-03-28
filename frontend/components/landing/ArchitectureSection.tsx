const PILLARS = [
  {
    icon: "network_ping",
    title: "Global Indexing",
    body: "Continuous crawling of indexed and unindexed web surfaces, including specialized marketplaces and deep-web repositories.",
  },
  {
    icon: "query_stats",
    title: "Visual Comparison",
    body: "Neural networks analyze uploaded assets against millions of daily findings to identify visual or structural similarities.",
  },
  {
    icon: "security",
    title: "Legal Triage",
    body: "Automated evidence gathering and timestamping for immediate legal action or Digital Millennium Copyright Act (DMCA) filings.",
  },
];

export default function ArchitectureSection() {
  return (
    <div className="max-w-6xl mx-auto mt-32 border-t border-[#524533]/10 pt-16">
      <h3 className="font-headline text-3xl font-bold tracking-tight mb-12 uppercase text-center md:text-left">
        Architecture of Protection
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-[#524533]/10">
        {PILLARS.map((pillar) => (
          <div
            key={pillar.title}
            className="p-8 group hover:bg-surface-container-low transition-colors"
          >
            <div className="w-12 h-12 flex items-center justify-center bg-surface-container mb-6 group-hover:bg-primary-container group-hover:text-on-primary transition-colors">
              <span className="material-symbols-outlined">{pillar.icon}</span>
            </div>
            <h4 className="font-headline font-bold uppercase tracking-tight mb-4">
              {pillar.title}
            </h4>
            <p className="text-sm text-on-surface-variant font-light leading-relaxed">
              {pillar.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
