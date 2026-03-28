"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { startInvestigation, type AssetType } from "@/lib/api";

const ASSET_TYPES: {
  id: AssetType;
  label: string;
  icon: string;
}[] = [
  { id: "trademark", label: "Trademark", icon: "verified" },
  { id: "copyright", label: "Copyright", icon: "copyright" },
  { id: "product", label: "Product", icon: "inventory_2" },
  { id: "patent", label: "Patent", icon: "gavel" },
];

export default function InvestigationForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedType, setSelectedType] = useState<AssetType>("trademark");
  const [assetName, setAssetName] = useState("");
  const [primaryUrl, setPrimaryUrl] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim()) return;

    setIsLoading(true);
    try {
      // TODO: wire to real backend via startInvestigation()
      const { scanId } = await startInvestigation({
        assetType: selectedType,
        assetName,
        primaryUrl,
        email: email.trim() || undefined,
        file: file ?? undefined,
      });
      router.push(`/scan/${scanId}`);
    } catch (err) {
      console.error("Failed to start investigation:", err);
      setIsLoading(false);
    }
  };

  return (
    <div className="lg:col-span-7 space-y-4">
      {/* Main form card */}
      <div className="bg-surface-container p-1 shadow-2xl">
        <div className="bg-surface-container-lowest p-8 border border-[#524533]/10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 border-b border-[#524533]/10 pb-4">
            <h2 className="font-headline text-xl font-medium tracking-tight uppercase">
              New Investigation
            </h2>
            <span className="text-[10px] font-label text-outline tabular-data uppercase">
              Reference: TG-88-ALPHA
            </span>
          </div>

          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Asset type selector */}
            <div>
              <label className="block text-[10px] font-label font-bold text-outline uppercase tracking-widest mb-4">
                Select Asset Classification
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {ASSET_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedType(type.id)}
                    className={`group p-4 border flex flex-col items-center gap-2 transition-all ${
                      selectedType === type.id
                        ? "border-primary text-primary bg-primary-container/10"
                        : "border-[#524533]/20 hover:border-primary/50 text-on-surface-variant hover:text-primary"
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl">
                      {type.icon}
                    </span>
                    <span className="text-[10px] font-label font-bold uppercase tracking-tight">
                      {type.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Text inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-label font-bold text-outline uppercase tracking-widest">
                  Asset Name
                </label>
                <input
                  type="text"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  placeholder="e.g. TRACEGUARD CORE"
                  className="w-full bg-surface-container-low border-0 border-b border-[#524533]/30 text-on-surface focus:outline-none focus:border-primary tabular-data py-3 transition-all placeholder:text-outline/50"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-label font-bold text-outline uppercase tracking-widest">
                  Primary URL
                </label>
                <input
                  type="url"
                  value={primaryUrl}
                  onChange={(e) => setPrimaryUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-surface-container-low border-0 border-b border-[#524533]/30 text-on-surface focus:outline-none focus:border-primary tabular-data py-3 transition-all placeholder:text-outline/50"
                />
              </div>
            </div>

            {/* Email notification */}
            <div className="space-y-2">
              <label className="block text-[10px] font-label font-bold text-outline uppercase tracking-widest">
                Notify via Email (optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-surface-container-low border-0 border-b border-[#524533]/30 text-on-surface focus:outline-none focus:border-primary tabular-data py-3 transition-all placeholder:text-outline/50"
              />
            </div>

            {/* File upload */}
            <div
              className={`border border-dashed p-8 flex flex-col items-center justify-center bg-surface-container-low/50 group cursor-pointer hover:bg-surface-container-low transition-colors ${
                dragging
                  ? "border-primary bg-surface-container-low"
                  : "border-[#524533]/30"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.png,.mp3,.zip"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <span className="material-symbols-outlined text-3xl text-outline mb-3 group-hover:text-primary transition-colors">
                upload_file
              </span>
              {file ? (
                <p className="text-[10px] font-label font-bold text-primary uppercase tracking-widest">
                  {file.name}
                </p>
              ) : (
                <>
                  <p className="text-[10px] font-label font-bold text-outline uppercase tracking-widest mb-1">
                    Drag &amp; Drop Logo / Reference File
                  </p>
                  <p className="text-[9px] text-outline/50 uppercase tracking-tighter">
                    PDF, PNG, MP3, ZIP (Max 50MB)
                  </p>
                </>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !assetName.trim()}
              className="w-full py-5 bg-primary-container text-on-primary font-headline font-bold text-lg tracking-widest flex items-center justify-center gap-3 group active:scale-[0.99] transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">
                    sync
                  </span>
                  INITIALIZING...
                </>
              ) : (
                <>
                  START MONITORING
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Forensic metadata strip */}
      <div className="flex justify-between items-center px-4 py-3 bg-[#32353c]/20 border border-[#524533]/5">
        <div className="flex gap-4">
          <span className="text-[10px] font-label text-outline tabular-data uppercase">
            Lat: 40.7128° N
          </span>
          <span className="text-[10px] font-label text-outline tabular-data uppercase">
            Lon: 74.0060° W
          </span>
        </div>
        <span className="text-[10px] font-label text-primary tabular-data uppercase">
          Encryption: AES-256 Active
        </span>
      </div>
    </div>
  );
}
