import LandingTopNav from "@/components/layout/LandingTopNav";
import FooterStatus from "@/components/layout/FooterStatus";
import HeroColumn from "@/components/landing/HeroColumn";
import InvestigationForm from "@/components/landing/InvestigationForm";
import ArchitectureSection from "@/components/landing/ArchitectureSection";
import NetworkMapAnchor from "@/components/landing/NetworkMapAnchor";

export default function HomePage() {
  return (
    <>
      <LandingTopNav activeTab="monitor" />

      {/* Slim left sidebar - icon only on xl */}
      <aside className="fixed left-0 top-0 h-full hidden xl:flex flex-col z-40 bg-[#10131a] w-16 border-r border-[#524533]/10">
        <div className="flex-1 flex flex-col items-center py-20 gap-8">
          <button className="material-symbols-outlined text-[#ffb000] cursor-pointer" title="Dashboard">
            dashboard
          </button>
          <button className="material-symbols-outlined text-[#9f8e78] hover:text-[#ffd597] cursor-pointer transition-colors" title="Infringements">
            gavel
          </button>
          <button className="material-symbols-outlined text-[#9f8e78] hover:text-[#ffd597] cursor-pointer transition-colors" title="Case Files">
            folder_shared
          </button>
          <button className="material-symbols-outlined text-[#9f8e78] hover:text-[#ffd597] cursor-pointer transition-colors" title="Global Scan">
            language
          </button>
        </div>
        <div className="py-8 flex flex-col items-center gap-4">
          <button className="material-symbols-outlined text-[#9f8e78] cursor-pointer hover:text-[#ffd597] transition-colors">
            help
          </button>
          <button className="material-symbols-outlined text-[#9f8e78] cursor-pointer hover:text-[#ffd597] transition-colors">
            settings
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="pt-24 pb-20 px-6 min-h-screen grid-pattern xl:pl-24">
        {/* Hero + Form */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          <HeroColumn />
          <InvestigationForm />
        </div>

        {/* Architecture section */}
        <ArchitectureSection />

        {/* Map anchor */}
        <NetworkMapAnchor />
      </main>

      <FooterStatus />
    </>
  );
}
