import { useEffect, useState } from "react";
import { ArrowRight, Lock } from "lucide-react";
import { Page, cn, GoldBtn, SectionEyebrow, ApiPredictionCard } from "../app/shared";
import { getPredictions, getPredictionCategories, type Prediction as ApiPrediction, type PredictionCategory } from "../services/predictions";
import { useCurrentSubscription } from "../hooks/useCurrentSubscription";

export default function PredictionsPage({ nav, authed }: { nav: (p: Page) => void; authed: boolean }) {
  const { hasSubscription } = useCurrentSubscription(authed);
  const [filter, setFilter] = useState("all");
  const [categories, setCategories] = useState<PredictionCategory[]>([]);
  const [predictions, setPredictions] = useState<ApiPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPredictions() {
      try {
        setLoading(true);
        setError("");

        const [predictionData, categoryData] = await Promise.all([
          getPredictions(),
          getPredictionCategories(),
        ]);
        setPredictions(predictionData);
        setCategories(categoryData);
      } catch (err) {
        console.error(err);
        setError("Unable to load predictions.");
      } finally {
        setLoading(false);
      }
    }

    loadPredictions();
  }, []);

  const filtered =
    filter === "all"
      ? predictions
      : predictions.filter((prediction) => prediction.category.slug === filter);

  return (
    <div className="pt-[60px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 pb-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-10">
          <div>
            <SectionEyebrow>Intelligence Feed</SectionEyebrow>
            <h1 className="font-['Rajdhani',sans-serif] font-bold text-[52px] text-white leading-none">TODAY&apos;S PREDICTIONS</h1>
            <p className="text-white text-[15px] mt-2 font-[JetBrains_Mono,monospace]">Saturday, 19 July 2026 · {predictions.length} prediction packages published</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 border border-emerald-500/20 bg-emerald-500/8 rounded-full px-3 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-[JetBrains_Mono,monospace] text-[9px] text-emerald-400 uppercase tracking-widest">Live</span>
            </div>
            <div className="bg-card border border-[#D4AF37]/8 rounded-lg px-3.5 py-2">
              <span className="font-[JetBrains_Mono,monospace] text-[12px] text-white">Avg confidence: </span>
              <span className="font-[JetBrains_Mono,monospace] text-[9px] text-[#D4AF37] font-bold">73.8%</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          <button onClick={() => setFilter("all")} className={cn(
            "px-4 py-1.5 rounded border font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-widest transition-all cursor-pointer",
            filter === "all" ? "bg-[#D4AF37] text-[#070E1A] border-[#D4AF37]" : "bg-card border-[#D4AF37]/8 text-white hover:border-[#D4AF37]/22 hover:text-white"
          )}>
            All
          </button>
          {categories.map(cat => (
            <button key={cat.slug} onClick={() => setFilter(cat.slug)} className={cn(
              "px-4 py-1.5 rounded border font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-widest transition-all cursor-pointer",
              filter === cat.slug ? "bg-[#D4AF37] text-[#070E1A] border-[#D4AF37]" : "bg-card border-[#D4AF37]/8 text-white hover:border-[#D4AF37]/22 hover:text-white"
            )}>
              {cat.name}
            </button>
          ))}
        </div>

        {loading && (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin mx-auto" />
            <p className="font-[JetBrains_Mono,monospace] text-[12px] text-white uppercase tracking-widest mt-4">
              Loading prediction packages
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl px-6 py-10 text-center">
            <p className="font-['Rajdhani',sans-serif] font-bold text-[22px] text-white">
              Predictions unavailable
            </p>
            <p className="text-[15px] text-white mt-2">
              {error} Please confirm that the Django server is running.
            </p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="bg-card border border-[#D4AF37]/10 rounded-xl px-6 py-14 text-center">
            <p className="font-['Rajdhani',sans-serif] font-bold text-[24px] text-white">
              No prediction packages found
            </p>
            <p className="text-[15px] text-white mt-2">
              There are currently no published packages in this category.
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((prediction, index) => (
              <ApiPredictionCard
                key={prediction.id}
                pred={prediction}
                locked={!hasSubscription && index >= 1}
              />
            ))}
          </div>
        )}

        {!hasSubscription && (
          <div className="mt-10 bg-card border border-[#D4AF37]/18 rounded-xl p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-[#D4AF37]/12 border border-[#D4AF37]/25 flex items-center justify-center mx-auto mb-4">
              <Lock size={20} className="text-[#D4AF37]" />
            </div>
            <h3 className="font-['Rajdhani',sans-serif] font-bold text-[26px] text-white mb-2">5 MORE PICKS TODAY</h3>
            <p className="text-[16px] text-white mb-6">Subscribe to access the full daily intelligence feed</p>
            <GoldBtn onClick={() => nav("pricing")} size="md">Get Lab Access <ArrowRight size={14} /></GoldBtn>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MATCH CENTRE PAGE ────────────────────────────────────────────────────────
