import { useState, useEffect, useRef } from "react";
import { ChevronDown, Clock, Lock } from "lucide-react";
import type { Prediction as ApiPrediction } from "../services/predictions";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Page =
  | "home" | "pricing" | "login" | "register"
  | "dashboard" | "predictions" | "results"
  | "about" | "contact"
  | "reset-password" | "verify-email";

export type DashSection = "overview" | "results" | "performance";
export type PredCategory = "Banker" | "Sure 2" | "Sure 3" | "Sure 5" | "Rollover";
export type PredStatus = "pending" | "won" | "lost" | "void";

export interface Prediction {
  id: number;
  league: string;
  leagueCode: string;
  home: string;
  away: string;
  kickoff: string;
  prediction: string;
  odds: number;
  confidence: number;
  category: PredCategory;
  analyst: string;
  analysis: string;
  status: PredStatus;
}

export interface Result {
  id: number;
  date: string;
  league: string;
  match: string;
  prediction: string;
  odds: number;
  result: "won" | "lost" | "void";
  profit: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

export const PREDICTIONS: Prediction[] = [
  {
    id: 1, league: "Premier League", leagueCode: "EPL",
    home: "Arsenal", away: "Chelsea", kickoff: "2026-07-19T15:00:00Z",
    prediction: "Over 2.5 Goals", odds: 1.72, confidence: 82,
    category: "Banker", analyst: "Bet Lab Research Desk",
    analysis: "Both sides average 3.1 goals in recent fixtures. Chelsea's away defensive record has been porous — conceding in 7 of their last 8 away trips. Combined xG of 3.4 over last 5 H2H meetings strongly favours Over market.",
    status: "pending",
  },
  {
    id: 2, league: "Champions League", leagueCode: "UCL",
    home: "Bayern Munich", away: "Barcelona", kickoff: "2026-07-19T20:00:00Z",
    prediction: "Both Teams to Score", odds: 1.58, confidence: 76,
    category: "Sure 2", analyst: "Bet Lab Research Desk",
    analysis: "Both clubs have scored in 9 consecutive matches. Bayern's aggressive high defensive line creates exploitable space for Barça's front three on the counter. Both keepers under pressure this campaign.",
    status: "pending",
  },
  {
    id: 3, league: "La Liga", leagueCode: "LAL",
    home: "Real Madrid", away: "Atletico Madrid", kickoff: "2026-07-19T20:45:00Z",
    prediction: "Under 2.5 Goals", odds: 1.95, confidence: 71,
    category: "Sure 5", analyst: "Bet Lab Research Desk",
    analysis: "Madrid derbies average 1.8 goals across the last 6 seasons. Both sides employ organised defensive blocks in high-stakes fixtures. Low xG profile expected. Historical patterns strongly support the Under market.",
    status: "pending",
  },
  {
    id: 4, league: "Serie A", leagueCode: "SA",
    home: "Inter Milan", away: "AC Milan", kickoff: "2026-07-20T18:00:00Z",
    prediction: "Asian Handicap Inter -0.5", odds: 2.10, confidence: 63,
    category: "Rollover", analyst: "Bet Lab Research Desk",
    analysis: "Inter's home record this season: 11W 2D 0L. Milan travel without 3 key midfielders through suspension. Nerazzurri midfield press expected to dominate possession metrics in this fixture.",
    status: "pending",
  },
  {
    id: 5, league: "Bundesliga", leagueCode: "BUN",
    home: "Borussia Dortmund", away: "RB Leipzig", kickoff: "2026-07-20T14:30:00Z",
    prediction: "Over 3.5 Goals", odds: 2.25, confidence: 61,
    category: "Banker", analyst: "Bet Lab Research Desk",
    analysis: "Combined xG of 4.2 across Dortmund's last 3 home games. Leipzig's intense high press creates open, vertical play — producing a historically high-scoring fixture profile between these two clubs.",
    status: "pending",
  },
  {
    id: 6, league: "Ligue 1", leagueCode: "L1",
    home: "PSG", away: "Olympique Lyon", kickoff: "2026-07-20T21:00:00Z",
    prediction: "PSG Win & Over 1.5", odds: 1.45, confidence: 88,
    category: "Sure 2", analyst: "Bet Lab Research Desk",
    analysis: "PSG have won 14 consecutive home Ligue 1 fixtures, scoring 2+ goals in 12 of them. Lyon missing Lacazette and two first-choice defenders through injury. Confidence level: very high.",
    status: "pending",
  },
];

export const RESULTS: Result[] = [
  { id: 1, date: "18 Jul", league: "Champions League", match: "Real Madrid vs Man City", prediction: "Both Teams to Score", odds: 1.65, result: "won", profit: 65 },
  { id: 2, date: "18 Jul", league: "Premier League", match: "Liverpool vs Tottenham", prediction: "Over 2.5 Goals", odds: 1.55, result: "won", profit: 55 },
  { id: 3, date: "17 Jul", league: "Bundesliga", match: "Bayern vs Leverkusen", prediction: "Home Win", odds: 1.40, result: "won", profit: 40 },
  { id: 4, date: "17 Jul", league: "La Liga", match: "Sevilla vs Villarreal", prediction: "Under 2.5 Goals", odds: 1.80, result: "lost", profit: -100 },
  { id: 5, date: "16 Jul", league: "Serie A", match: "Juventus vs Napoli", prediction: "Both Teams to Score", odds: 1.70, result: "won", profit: 70 },
  { id: 6, date: "16 Jul", league: "Premier League", match: "Man United vs Everton", prediction: "Home Win & Over 1.5", odds: 1.90, result: "won", profit: 90 },
  { id: 7, date: "15 Jul", league: "Ligue 1", match: "PSG vs Nice", prediction: "PSG Win", odds: 1.35, result: "won", profit: 35 },
  { id: 8, date: "15 Jul", league: "Champions League", match: "Dortmund vs Atletico", prediction: "Under 2.5 Goals", odds: 1.75, result: "lost", profit: -100 },
  { id: 9, date: "14 Jul", league: "Premier League", match: "Newcastle vs Brighton", prediction: "Over 2.5 Goals", odds: 1.65, result: "won", profit: 65 },
  { id: 10, date: "14 Jul", league: "Bundesliga", match: "Leipzig vs Wolfsburg", prediction: "Home Win", odds: 1.55, result: "won", profit: 55 },
  { id: 11, date: "13 Jul", league: "La Liga", match: "Barcelona vs Betis", prediction: "Asian Handicap -1.5", odds: 2.10, result: "won", profit: 110 },
  { id: 12, date: "13 Jul", league: "Serie A", match: "Roma vs Lazio", prediction: "Under 2.5 Goals", odds: 1.85, result: "void", profit: 0 },
];

export const TESTIMONIALS = [
  { name: "Clear Daily Picks", role: "Member experience", avatar: "DP", rating: 5, quote: "See the match, selected market, odds, confidence and short analysis without sorting through a cluttered list of games." },
  { name: "Transparent Results", role: "Trust by design", avatar: "TR", rating: 5, quote: "Every published selection remains in the results history after the match, whether it wins, loses or is void." },
  { name: "Simple Lab Access", role: "Built for Nigeria", avatar: "LA", rating: 5, quote: "Choose a daily, weekly or monthly plan and receive immediate member access after successful payment verification." },
];

export const NOTIFICATIONS = [
  { icon: "✅", text: "Bayern vs Barcelona prediction confirmed: WON", time: "12m ago", unread: true },
  { icon: "📊", text: "Today&apos;s 6 predictions are now live", time: "1h ago", unread: true },
  { icon: "🏆", text: "Weekly performance summary: +18.2% ROI", time: "3h ago", unread: false },
  { icon: "⚠️", text: "La Liga: Sevilla vs Villarreal — LOST", time: "Yesterday", unread: false },
];

// ─── Utility ──────────────────────────────────────────────────────────────────

export function cn(...c: (string | undefined | false | null)[]) {
  return c.filter(Boolean).join(" ");
}

export function displayNameFor(user: { first_name: string; last_name: string; username: string } | null | undefined): string {
  if (!user) return "";
  const full = `${user.first_name} ${user.last_name}`.trim();
  return full || user.username;
}

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatKickoff(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) + " · " +
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function useCounter(target: number, duration = 1800) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const steps = 60;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const ease = 1 - Math.pow(1 - step / steps, 3);
      setVal(Math.round(target * ease));
      if (step >= steps) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target, duration]);
  return val;
}

// ─── Design Tokens (inline for component-level use) ───────────────────────────

export const GOLD = "#D4AF37";
export const NAVY = "#0B1220";

// ─── Shared Components ────────────────────────────────────────────────────────

export function Chip({ label, variant }: {
  label: string;
  variant: "gold" | "emerald" | "rose" | "blue" | "ghost" | "violet";
}) {
  const s = {
    gold: "bg-[#D4AF37]/12 text-[#D4AF37] border-[#D4AF37]/25",
    emerald: "bg-emerald-500/12 text-emerald-400 border-emerald-500/25",
    rose: "bg-rose-500/12 text-rose-400 border-rose-500/25",
    blue: "bg-blue-500/12 text-blue-300 border-blue-500/20",
    violet: "bg-violet-500/12 text-violet-300 border-violet-500/20",
    ghost: "bg-white/5 text-white/45 border-white/10",
  };
  return (
    <span className={cn("inline-flex items-center border px-2 py-0.5 rounded text-[10px] font-[JetBrains_Mono,monospace] tracking-[0.08em] uppercase font-medium", s[variant])}>
      {label}
    </span>
  );
}

export function GoldBtn({ children, onClick, size = "md", outline = false, full = false, className }: {
  children: React.ReactNode; onClick?: () => void;
  size?: "sm" | "md" | "lg"; outline?: boolean; full?: boolean; className?: string;
}) {
  const sz = { sm: "px-4 py-1.5 text-sm", md: "px-6 py-2.5 text-sm", lg: "px-8 py-3.5 text-base" };
  const base = cn("inline-flex items-center gap-2 rounded font-semibold transition-all duration-200 cursor-pointer", sz[size], full && "w-full justify-center", className);
  if (outline) return (
    <button onClick={onClick} className={cn(base, "border border-[#D4AF37]/45 text-[#D4AF37] hover:bg-[#D4AF37]/8 hover:border-[#D4AF37]")}>
      {children}
    </button>
  );
  return (
    <button onClick={onClick} className={cn(base, "bg-[#D4AF37] text-[#070E1A] hover:bg-[#E8C84A] hover:shadow-[0_0_28px_rgba(212,175,55,0.4)]")}>
      {children}
    </button>
  );
}

export function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="h-px w-7 bg-[#D4AF37]" />
      <span className="font-[JetBrains_Mono,monospace] text-[10px] text-[#D4AF37] uppercase tracking-[0.2em]">{children}</span>
    </div>
  );
}

export function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 75 ? "#10B981" : value >= 60 ? GOLD : "#F43F5E";
  return (
    <div className="w-full h-1 bg-white/8 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${value}%`, background: color }}
      />
    </div>
  );
}

export function CategoryPip({ cat }: { cat: PredCategory }) {
  const m: Record<PredCategory, "gold" | "emerald" | "rose" | "blue" | "violet"> = {
    "Banker": "gold",
    "Sure 2": "emerald",
    "Sure 3": "violet",
    "Sure 5": "blue",
    "Rollover": "rose",
  };
  return <Chip label={cat} variant={m[cat]} />;
}

// ─── Live Ticker ──────────────────────────────────────────────────────────────

export function LiveTicker() {
  const items = RESULTS.slice(0, 8).map(r => `${r.match} — ${r.prediction} · ${r.result === "won" ? "✓ WON" : r.result === "lost" ? "✗ LOST" : "○ VOID"}`);
  const doubled = [...items, ...items];
  return (
    <div className="border-y border-[#D4AF37]/10 bg-[#0D1828]/60 overflow-hidden py-2.5">
      <div className="flex animate-ticker whitespace-nowrap">
        {doubled.map((item, i) => (
          <span key={i} className="font-[JetBrains_Mono,monospace] text-[11px] text-white/35 px-10 flex-shrink-0">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Prediction Card ──────────────────────────────────────────────────────────

export function PredCard({ pred, locked = false }: { pred: Prediction; locked?: boolean }) {
  const [open, setOpen] = useState(false);
  const accentLine: Record<PredCategory, string> = {
    "Banker": "from-[#D4AF37] via-[#D4AF37]/50 to-transparent",
    "Sure 2": "from-emerald-500 via-emerald-500/50 to-transparent",
    "Sure 3": "from-violet-500 via-violet-500/50 to-transparent",
    "Sure 5": "from-blue-400 via-blue-400/50 to-transparent",
    "Rollover": "from-rose-500 via-rose-500/50 to-transparent",
  };
  const leagueHue: Record<string, string> = {
    EPL: "text-purple-400", UCL: "text-sky-400", LAL: "text-red-400",
    SA: "text-blue-300", BUN: "text-red-300", L1: "text-white/50",
  };

  return (
    <article className={cn(
      "relative bg-card border border-[#D4AF37]/10 rounded-lg overflow-hidden group",
      "transition-all duration-300 hover:border-[#D4AF37]/22 hover:shadow-[0_4px_40px_rgba(212,175,55,0.07)]",
      locked && "pointer-events-none select-none"
    )}>
      <div className={cn("h-[2px] w-full bg-gradient-to-r", accentLine[pred.category])} />

      <div className={cn("p-5", locked && "blur-sm")}>
        {/* Header row */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("font-[JetBrains_Mono,monospace] text-[10px] font-medium uppercase tracking-wider", leagueHue[pred.leagueCode] ?? "text-white/45")}>
              {pred.league}
            </span>
            <CategoryPip cat={pred.category} />
          </div>
          <div className="flex items-center gap-1.5 text-white/30 flex-shrink-0">
            <Clock size={11} />
            <span className="font-[JetBrains_Mono,monospace] text-[10px]">{formatKickoff(pred.kickoff)}</span>
          </div>
        </div>

        {/* Teams */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 text-right">
            <p className="font-['Rajdhani',sans-serif] font-bold text-[22px] text-white leading-none">{pred.home}</p>
            <p className="font-[JetBrains_Mono,monospace] text-[9px] text-white/25 uppercase mt-0.5 tracking-wider">Home</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#162036] border border-[#D4AF37]/15 flex items-center justify-center flex-shrink-0">
            <span className="font-[JetBrains_Mono,monospace] text-[9px] text-[#D4AF37] font-bold">VS</span>
          </div>
          <div className="flex-1">
            <p className="font-['Rajdhani',sans-serif] font-bold text-[22px] text-white leading-none">{pred.away}</p>
            <p className="font-[JetBrains_Mono,monospace] text-[9px] text-white/25 uppercase mt-0.5 tracking-wider">Away</p>
          </div>
        </div>

        {/* Prediction pill */}
        <div className="bg-[#0B1220]/70 border border-white/5 rounded px-4 py-3 mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-[JetBrains_Mono,monospace] text-[9px] text-white/30 uppercase tracking-widest mb-1">Prediction</p>
            <p className="font-['Rajdhani',sans-serif] font-bold text-[18px] text-white leading-none">{pred.prediction}</p>
          </div>
          <div className="text-right">
            <p className="font-[JetBrains_Mono,monospace] text-[9px] text-white/30 uppercase tracking-widest mb-1">Odds</p>
            <p className="font-['Rajdhani',sans-serif] font-bold text-[26px] text-[#D4AF37] leading-none">{pred.odds.toFixed(2)}</p>
          </div>
        </div>

        {/* Confidence */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-widest text-white/30">Confidence</span>
            <span className={cn(
              "font-[JetBrains_Mono,monospace] text-xs font-bold",
              pred.confidence >= 75 ? "text-emerald-400" : pred.confidence >= 60 ? "text-[#D4AF37]" : "text-rose-400"
            )}>{pred.confidence}%</span>
          </div>
          <ConfidenceBar value={pred.confidence} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.05]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#D4AF37]/15 flex items-center justify-center">
              <span className="font-bold text-[#D4AF37] text-[8px]">{pred.analyst.split(" ").map(w => w[0]).filter((_, i, a) => i === 0 || i === a.length - 1).join("")}</span>
            </div>
            <span className="text-[11px] text-white/35">{pred.analyst}</span>
          </div>
          <button
            onClick={() => setOpen(!open)}
            className="font-[JetBrains_Mono,monospace] text-[9px] text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors uppercase tracking-widest flex items-center gap-1 cursor-pointer"
          >
            Analysis <ChevronDown size={9} className={cn("transition-transform duration-200", open && "rotate-180")} />
          </button>
        </div>

        {open && (
          <div className="mt-3 pt-3 border-t border-white/[0.05] animate-fade-in">
            <p className="text-[12px] text-white/50 leading-relaxed">{pred.analysis}</p>
          </div>
        )}
      </div>

      {/* Lock overlay */}
      {locked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B1220]/75 backdrop-blur-[3px]">
          <div className="w-11 h-11 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/35 flex items-center justify-center mb-3">
            <Lock size={18} className="text-[#D4AF37]" />
          </div>
          <p className="font-['Rajdhani',sans-serif] font-bold text-white text-lg">Lab Access Required</p>
          <p className="text-[11px] text-white/35 mt-1 font-[JetBrains_Mono,monospace]">Choose a plan to unlock</p>
        </div>
      )}
    </article>
  );
}


export function ApiPredictionCard({
  pred,
  locked = false,
}: {
  pred: ApiPrediction;
  locked?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const category = pred.category.name as PredCategory;

  const accentLine: Record<PredCategory, string> = {
    "Banker": "from-[#D4AF37] via-[#D4AF37]/50 to-transparent",
    "Sure 2": "from-emerald-500 via-emerald-500/50 to-transparent",
    "Sure 3": "from-violet-500 via-violet-500/50 to-transparent",
    "Sure 5": "from-blue-400 via-blue-400/50 to-transparent",
    "Rollover": "from-rose-500 via-rose-500/50 to-transparent",
  };

  const totalOdds = pred.selections.reduce(
    (total, selection) => total * Number(selection.odds),
    1,
  );

  return (
    <article
      className={cn(
        "relative bg-card border border-[#D4AF37]/10 rounded-lg overflow-hidden",
        "transition-all duration-300 hover:border-[#D4AF37]/22",
        "hover:shadow-[0_4px_40px_rgba(212,175,55,0.07)]",
        locked && "pointer-events-none select-none",
      )}
    >
      <div
        className={cn(
          "h-[2px] w-full bg-gradient-to-r",
          accentLine[category] ?? accentLine.Banker,
        )}
      />

      <div className={cn("p-5", locked && "blur-sm")}>
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <CategoryPip cat={category} />
            <h3 className="font-['Rajdhani',sans-serif] font-bold text-[25px] text-white mt-2 leading-tight">
              {pred.title}
            </h3>
          </div>

          <div className="text-right flex-shrink-0">
            <p className="font-[JetBrains_Mono,monospace] text-[9px] text-white/30 uppercase tracking-widest">
              Total odds
            </p>
            <p className="font-['Rajdhani',sans-serif] font-bold text-[27px] text-[#D4AF37] leading-none mt-1">
              {totalOdds.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {pred.selections.map((selection, index) => (
            <div
              key={selection.id}
              className="bg-[#0B1220]/70 border border-white/5 rounded-lg p-3.5"
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="font-[JetBrains_Mono,monospace] text-[9px] text-white/35 uppercase tracking-wider">
                  {index + 1}. {selection.league}
                </span>

                <span className="flex items-center gap-1 font-[JetBrains_Mono,monospace] text-[9px] text-white/30">
                  <Clock size={10} />
                  {formatKickoff(selection.match_time)}
                </span>
              </div>

              <p className="font-['Rajdhani',sans-serif] font-bold text-[18px] text-white">
                {selection.home_team}
                <span className="text-white/25 mx-2">vs</span>
                {selection.away_team}
              </p>

              <div className="flex items-end justify-between gap-3 mt-2">
                <div>
                  <p className="font-[JetBrains_Mono,monospace] text-[8px] text-white/25 uppercase tracking-widest">
                    Selection
                  </p>
                  <p className="text-[13px] text-white/70 mt-0.5">
                    {selection.market}
                  </p>
                </div>

                <p className="font-['Rajdhani',sans-serif] font-bold text-[21px] text-[#D4AF37]">
                  {Number(selection.odds).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/[0.05]">
          <span className="font-[JetBrains_Mono,monospace] text-[9px] text-white/30 uppercase tracking-widest">
            {pred.selections.length} selection{pred.selections.length === 1 ? "" : "s"}
          </span>

          <button
            onClick={() => setOpen(!open)}
            className="font-[JetBrains_Mono,monospace] text-[9px] text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors uppercase tracking-widest flex items-center gap-1 cursor-pointer"
          >
            Analysis
            <ChevronDown
              size={9}
              className={cn(
                "transition-transform duration-200",
                open && "rotate-180",
              )}
            />
          </button>
        </div>

        {open && (
          <div className="mt-3 pt-3 border-t border-white/[0.05]">
            <p className="text-[12px] text-white/50 leading-relaxed">
              {pred.analysis || "No analysis has been published yet."}
            </p>
          </div>
        )}
      </div>

      {locked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B1220]/75 backdrop-blur-[3px]">
          <div className="w-11 h-11 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/35 flex items-center justify-center mb-3">
            <Lock size={18} className="text-[#D4AF37]" />
          </div>
          <p className="font-['Rajdhani',sans-serif] font-bold text-white text-lg">
            Lab Access Required
          </p>
          <p className="text-[11px] text-white/35 mt-1 font-[JetBrains_Mono,monospace]">
            Choose a plan to unlock
          </p>
        </div>
      )}
    </article>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
