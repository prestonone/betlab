import { ArrowRight, Lock } from "lucide-react";
import { Page, PREDICTIONS, cn, GoldBtn, SectionEyebrow, PredCard } from "../app/shared";

export default function PredictionsMarketingPage({ nav }: { nav: (p: Page) => void }) {
  const cats = ["all", "Banker", "Sure 2", "Sure 3", "Sure 5", "Rollover"];

  return (
    <div className="pt-[60px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 pb-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-10">
          <div>
            <SectionEyebrow>Intelligence Feed</SectionEyebrow>
            <h1 className="font-['Rajdhani',sans-serif] font-bold text-[52px] text-white leading-none">TODAY&apos;S PREDICTIONS</h1>
            <p className="text-white text-[15px] mt-2 font-[JetBrains_Mono,monospace]">A preview of today&apos;s picks · Sign in to unlock the full live feed</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 border border-emerald-500/20 bg-emerald-500/8 rounded-full px-3 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-[JetBrains_Mono,monospace] text-[9px] text-emerald-400 uppercase tracking-widest">Live</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {cats.map(cat => (
            <span key={cat} className={cn(
              "px-4 py-1.5 rounded border font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-widest",
              cat === "all" ? "bg-[#D4AF37] text-[#070E1A] border-[#D4AF37]" : "bg-card border-[#D4AF37]/8 text-white"
            )}>
              {cat === "all" ? "All" : cat}
            </span>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {PREDICTIONS.map((pred, index) => (
            <PredCard key={pred.id} pred={pred} locked={index >= 1} />
          ))}
        </div>

        <div className="mt-10 bg-card border border-[#D4AF37]/18 rounded-xl p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-[#D4AF37]/12 border border-[#D4AF37]/25 flex items-center justify-center mx-auto mb-4">
            <Lock size={20} className="text-[#D4AF37]" />
          </div>
          <h3 className="font-['Rajdhani',sans-serif] font-bold text-[26px] text-white mb-2">SEE EVERY PICK, LIVE</h3>
          <p className="text-[16px] text-white mb-6">Create a free account to access the full daily intelligence feed, category filters and live results.</p>
          <div className="flex items-center justify-center gap-3">
            <GoldBtn onClick={() => nav("register")} size="md">Get Lab Access <ArrowRight size={14} /></GoldBtn>
            <GoldBtn onClick={() => nav("login")} size="md" outline>Sign In</GoldBtn>
          </div>
        </div>
      </div>
    </div>
  );
}
