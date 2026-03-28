import type { StreamItem } from "@/lib/api";

interface DataStreamProps {
  items: StreamItem[];
}

export default function DataStream({ items }: DataStreamProps) {
  return (
    <div className="col-span-12">
      <div className="bg-surface-container-lowest border border-[#524533]/5 p-4 overflow-hidden relative">
        <div className="flex items-center gap-4 mb-4">
          <span className="material-symbols-outlined text-primary text-sm">
            monitor_heart
          </span>
          <h3 className="font-headline text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">
            Real-Time Data Stream
          </h3>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {items.map((item, i) => (
            <div
              key={i}
              className={`flex-none w-[300px] bg-surface-container p-4 border-l-2 ${
                item.isAlert ? "border-secondary" : "border-primary"
              }`}
            >
              <div className="flex justify-between mb-2">
                <span
                  className={`text-[9px] font-headline tracking-widest uppercase ${
                    item.isAlert ? "text-secondary" : "text-on-surface-variant"
                  }`}
                >
                  {item.action}
                </span>
                <span
                  className={`text-[9px] font-mono ${
                    item.isAlert ? "text-secondary" : "text-primary"
                  }`}
                >
                  {item.elapsed}
                </span>
              </div>

              <p className="text-[11px] font-mono truncate text-on-surface mb-3">
                {item.url}
              </p>

              <div className="flex gap-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`text-[8px] px-2 py-0.5 font-headline uppercase tracking-widest ${
                      item.isAlert
                        ? "bg-secondary-container text-on-secondary-container"
                        : "bg-surface-container-highest"
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
