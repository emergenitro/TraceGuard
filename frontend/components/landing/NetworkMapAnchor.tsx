import Image from "next/image";

export default function NetworkMapAnchor() {
  return (
    <div className="max-w-6xl mx-auto mt-20 relative h-[300px] overflow-hidden">
      {/* Background map */}
      <div className="absolute inset-0 bg-surface-container-lowest opacity-40">
        <Image
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfp1fGz06TcAxou_CyvWNHGOUvv0dNgZJRIvB9Yt977--wjUdTJFbPmLW8na_g2x1Dxqr8Vu9G42IzocdJvDpRL5Fy8ISE9xZ83l8nIKruyzXW514NaEpLqJkFsNFukgNsorY0CsX6Cu7zP3vgSN_Btmy_cBNOmOUoNsiaHd5WuKrbYAFvwPsClmu7R7ufwTL4SvkATWy2HaHJv1bgBjx-IAF9XgAodLjRKGIKtEKYynXT6oaCAAZhaovv9J-bsZjsFZmtfLP9YBs"
          alt="Global Network Map"
          fill
          className="object-cover grayscale opacity-30 contrast-125"
          unoptimized
        />
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

      {/* Metrics overlay */}
      <div className="absolute bottom-8 left-8">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[9px] font-label font-bold text-primary uppercase tracking-[0.3em]">
              Network Load
            </span>
            <div className="flex gap-1 mt-2 items-end">
              {[3, 5, 4, 6, 2, 4].map((h, i) => (
                <div
                  key={i}
                  className={`w-1 ${i < 4 ? "bg-primary" : "bg-[#524533]/40"}`}
                  style={{ height: `${h * 4}px` }}
                />
              ))}
            </div>
          </div>

          <div className="h-10 w-px bg-[#524533]/30" />

          <div>
            <span className="text-[9px] font-label font-bold text-outline uppercase tracking-[0.3em]">
              Active Nodes
            </span>
            <span className="block font-headline text-lg tabular-data">
              2,819
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
