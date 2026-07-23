import { useEffect, useState } from "react";
import { Clock, ArrowRight, Activity, AlertCircle, Info, Globe, Trophy } from "lucide-react";
import { SectionEyebrow } from "../app/shared";
import { getPredictions, type Prediction as ApiPrediction } from "../services/predictions";

export default function MatchCentrePage() {
  const [predictions, setPredictions] = useState<ApiPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPredictions() {
      try {
        setLoading(true);
        setError("");

        const data = await getPredictions();

        if (active) {
          setPredictions(data);
        }
      } catch (err) {
        console.error("Failed to load Match Centre predictions:", err);

        if (active) {
          setError("We could not load the current Bet Lab picks.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPredictions();

    return () => {
      active = false;
    };
  }, []);

  const matchSelections = predictions.flatMap((prediction) =>
    prediction.selections.map((selection) => ({
      predictionId: prediction.id,
      predictionTitle: prediction.title,
      category: prediction.category.name,
      accessLevel: prediction.access_level,
      selection,
    }))
  );

  return (
    <div className="pt-[60px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 pb-20">

        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl border border-[#D4AF37]/15 bg-card px-6 py-10 sm:px-10 sm:py-14 mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1A2845]/75 via-transparent to-[#D4AF37]/[0.04] pointer-events-none" />
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" />

          <div className="relative max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40 animate-ping" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>

              <span className="font-[JetBrains_Mono,monospace] text-[9px] text-emerald-400 uppercase tracking-[0.22em]">
                Live football hub
              </span>
            </div>

            <SectionEyebrow>Live Scores</SectionEyebrow>

            <h1 className="font-['Rajdhani',sans-serif] font-bold text-[46px] sm:text-[64px] text-white leading-[0.95] mb-5">
              BET LAB
              <br />
              <span className="text-[#D4AF37]">MATCH CENTRE</span>
            </h1>

            <p className="text-white/60 text-[14px] sm:text-[15px] leading-relaxed max-w-2xl">
              Follow the matches connected to Bet Lab predictions and keep up
              with today&apos;s football action from one convenient place.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.4fr] gap-7">

          {/* Bet Lab picks */}
          <section>
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="font-[JetBrains_Mono,monospace] text-[9px] text-[#D4AF37]/70 uppercase tracking-widest mb-1">
                  Bet Lab intelligence
                </p>

                <h2 className="font-['Rajdhani',sans-serif] font-bold text-[26px] text-white">
                  Current Picks
                </h2>
              </div>

              {!loading && !error && (
                <span className="font-[JetBrains_Mono,monospace] text-[9px] text-white/25">
                  {matchSelections.length} matches
                </span>
              )}
            </div>

            {loading && (
              <div className="rounded-xl border border-[#D4AF37]/10 bg-card p-10 text-center">
                <div className="w-7 h-7 border-2 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin mx-auto mb-4" />
                <p className="font-[JetBrains_Mono,monospace] text-[10px] text-white/30 uppercase tracking-widest">
                  Loading picks
                </p>
              </div>
            )}

            {!loading && error && (
              <div className="rounded-xl border border-rose-500/15 bg-rose-500/[0.04] p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="text-rose-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[13px] text-rose-300 mb-1">
                      Match Centre unavailable
                    </p>
                    <p className="text-[13px] text-white/45 leading-relaxed">
                      {error} You can still use the live-score links beside this panel.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!loading && !error && matchSelections.length === 0 && (
              <div className="rounded-xl border border-[#D4AF37]/10 bg-card p-8 text-center">
                <Trophy size={24} className="text-[#D4AF37]/50 mx-auto mb-3" />
                <p className="text-[13px] text-white/55 mb-1">
                  No current picks yet
                </p>
                <p className="text-[13px] text-white/40">
                  Published Bet Lab matches will appear here automatically.
                </p>
              </div>
            )}

            {!loading && !error && matchSelections.length > 0 && (
              <div className="space-y-3">
                {matchSelections.slice(0, 8).map((item) => {
                  const kickoff = new Date(item.selection.match_time);
                  const hasValidKickoff = !Number.isNaN(kickoff.getTime());

                  return (
                    <article
                      key={`${item.predictionId}-${item.selection.id}`}
                      className="group rounded-xl border border-white/[0.06] bg-card p-5 hover:border-[#D4AF37]/20 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <p className="font-[JetBrains_Mono,monospace] text-[9px] text-[#D4AF37]/65 uppercase tracking-wider mb-1">
                            {item.selection.league}
                          </p>

                          <h3 className="font-['Rajdhani',sans-serif] font-bold text-[20px] text-white leading-tight">
                            {item.selection.home_team}
                            <span className="text-white/25 mx-2">vs</span>
                            {item.selection.away_team}
                          </h3>
                        </div>

                        <span className="shrink-0 rounded-full border border-[#D4AF37]/15 bg-[#D4AF37]/[0.05] px-2.5 py-1 font-[JetBrains_Mono,monospace] text-[8px] text-[#D4AF37] uppercase tracking-wider">
                          {item.category}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="rounded-lg bg-white/[0.025] px-3 py-2.5">
                          <p className="font-[JetBrains_Mono,monospace] text-[8px] text-white/20 uppercase tracking-wider mb-1">
                            Selection
                          </p>
                          <p className="text-[12px] text-white/65">
                            {item.selection.market}
                          </p>
                        </div>

                        <div className="rounded-lg bg-white/[0.025] px-3 py-2.5">
                          <p className="font-[JetBrains_Mono,monospace] text-[8px] text-white/20 uppercase tracking-wider mb-1">
                            Kickoff
                          </p>
                          <p className="text-[12px] text-white/65">
                            {hasValidKickoff
                              ? kickoff.toLocaleString([], {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "To be confirmed"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/[0.04] pt-3">
                        <span className="text-[10px] text-white/25 truncate pr-4">
                          {item.predictionTitle}
                        </span>

                        <span className="flex items-center gap-1.5 font-[JetBrains_Mono,monospace] text-[8px] text-white/30 uppercase tracking-wider">
                          <Clock size={11} />
                          Awaiting kickoff
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* Live-score area */}
          <section>
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="font-[JetBrains_Mono,monospace] text-[9px] text-[#D4AF37]/70 uppercase tracking-widest mb-1">
                  Live football
                </p>

                <h2 className="font-['Rajdhani',sans-serif] font-bold text-[26px] text-white">
                  Scores & Fixtures
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="font-[JetBrains_Mono,monospace] text-[8px] text-emerald-400/70 uppercase tracking-wider">
                  Live access
                </span>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-[#D4AF37]/12 bg-card min-h-[520px]">
              <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/[0.025] to-transparent pointer-events-none" />

              <div className="relative flex min-h-[520px] flex-col px-6 py-8 sm:px-8 sm:py-10">
                <div className="mb-7 text-center">
                  <div className="w-14 h-14 rounded-2xl border border-[#D4AF37]/15 bg-[#D4AF37]/[0.05] flex items-center justify-center mx-auto mb-5">
                    <Activity size={25} className="text-[#D4AF37]" />
                  </div>

                  <p className="font-[JetBrains_Mono,monospace] text-[9px] text-[#D4AF37]/65 uppercase tracking-[0.2em] mb-3">
                    Live-score providers
                  </p>

                  <h3 className="font-['Rajdhani',sans-serif] font-bold text-[28px] text-white mb-3">
                    Follow today&apos;s matches live
                  </h3>

                  <p className="text-[13px] text-white/45 leading-relaxed max-w-md mx-auto">
                    Choose a trusted score provider below. It opens in a new tab,
                    while Bet Lab remains available for reviewing your picks.
                  </p>
                </div>

                <div className="grid gap-3">
                  <a
                    href="https://www.sofascore.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group rounded-xl border border-[#D4AF37]/15 bg-[#D4AF37]/[0.04] p-5 text-left hover:border-[#D4AF37]/35 hover:bg-[#D4AF37]/[0.07] transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 shrink-0 rounded-lg bg-[#D4AF37] flex items-center justify-center">
                          <Globe size={18} className="text-[#07111F]" />
                        </div>

                        <div>
                          <p className="font-['Rajdhani',sans-serif] font-bold text-[20px] text-white mb-1">
                            Sofascore
                          </p>
                          <p className="text-[13px] text-white/45 leading-relaxed">
                            Live scores, fixtures, tables and detailed match statistics.
                          </p>
                        </div>
                      </div>

                      <ArrowRight
                        size={17}
                        className="mt-1 shrink-0 text-[#D4AF37]/45 group-hover:text-[#D4AF37] group-hover:translate-x-1 transition"
                      />
                    </div>
                  </a>

                  <a
                    href="https://www.livescore.com/en/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group rounded-xl border border-white/[0.07] bg-white/[0.02] p-5 text-left hover:border-white/15 hover:bg-white/[0.04] transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 shrink-0 rounded-lg border border-white/[0.08] bg-white/[0.035] flex items-center justify-center">
                          <Activity size={18} className="text-white/55" />
                        </div>

                        <div>
                          <p className="font-['Rajdhani',sans-serif] font-bold text-[20px] text-white mb-1">
                            LiveScore
                          </p>
                          <p className="text-[13px] text-white/45 leading-relaxed">
                            Fast live results, upcoming fixtures and competition schedules.
                          </p>
                        </div>
                      </div>

                      <ArrowRight
                        size={17}
                        className="mt-1 shrink-0 text-white/20 group-hover:text-white/60 group-hover:translate-x-1 transition"
                      />
                    </div>
                  </a>
                </div>

                <div className="mt-auto pt-7">
                  <div className="rounded-lg border border-white/[0.05] bg-white/[0.018] px-4 py-3">
                    <div className="flex items-start gap-3">
                      <Info size={14} className="text-[#D4AF37]/55 mt-0.5 shrink-0" />
                      <p className="text-[10px] text-white/25 leading-relaxed">
                        Return to this Match Centre at any time to compare the live
                        action with Bet Lab&apos;s published selections.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
              {[
                "Premier League",
                "Champions League",
                "La Liga",
                "Serie A",
              ].map((competition) => (
                <div
                  key={competition}
                  className="rounded-lg border border-white/[0.05] bg-card px-3 py-3 text-center"
                >
                  <p className="font-[JetBrains_Mono,monospace] text-[8px] text-white/30 uppercase tracking-wider">
                    {competition}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-8 rounded-xl border border-[#D4AF37]/10 bg-[#D4AF37]/[0.025] px-5 py-4">
          <div className="flex items-start gap-3">
            <Info size={16} className="text-[#D4AF37]/70 mt-0.5 shrink-0" />
            <p className="text-[13px] text-white/45 leading-relaxed">
              Live scores are supplied by independent football-score services.
              Bet Lab predictions remain informational and do not guarantee any
              betting outcome.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ABOUT PAGE ───────────────────────────────────────────────────────────────
