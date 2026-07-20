import { useState, useEffect, useRef } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";
import {
  BarChart2, TrendingUp, Shield, Clock, Star, Bell, Settings,
  LogOut, Menu, X, Check, Target, Zap, Users, Award,
  ArrowRight, Lock, Mail, Eye, EyeOff, Activity,
  ChevronRight, ChevronDown, AlertCircle, CheckCircle2,
  XCircle, Minus, Flame, LayoutDashboard, List,
  LineChart, History, Info, Phone, Globe, Send,
  Home, Trophy,
} from "lucide-react";

import {
  getPredictions,
  type Prediction as ApiPrediction,
} from "../services/predictions";

// ─── Types ────────────────────────────────────────────────────────────────────

type Page =
  | "home" | "pricing" | "login" | "register"
  | "dashboard" | "predictions" | "results"
  | "about" | "contact";

type DashSection = "overview" | "predictions" | "results" | "performance";
type PredCategory = "Banker" | "Sure 2" | "Sure 3" | "Sure 5" | "Rollover";
type PredStatus = "pending" | "won" | "lost" | "void";

interface Prediction {
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

interface Result {
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

const PREDICTIONS: Prediction[] = [
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

const RESULTS: Result[] = [
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

const PERF_DATA = [
  { day: "Jul 1", winRate: 64, roi: 8.2 },
  { day: "Jul 3", winRate: 68, roi: 11.4 },
  { day: "Jul 5", winRate: 71, roi: 13.8 },
  { day: "Jul 7", winRate: 69, roi: 12.1 },
  { day: "Jul 9", winRate: 74, roi: 16.5 },
  { day: "Jul 11", winRate: 72, roi: 18.2 },
  { day: "Jul 13", winRate: 78, roi: 20.4 },
  { day: "Jul 15", winRate: 75, roi: 19.8 },
  { day: "Jul 17", winRate: 80, roi: 22.1 },
  { day: "Jul 19", winRate: 82, roi: 23.4 },
];

const LEAGUE_PERF = [
  { league: "EPL", winRate: 81, predictions: 42 },
  { league: "UCL", winRate: 76, predictions: 28 },
  { league: "La Liga", winRate: 79, predictions: 35 },
  { league: "Bundesliga", winRate: 74, predictions: 30 },
  { league: "Serie A", winRate: 72, predictions: 26 },
  { league: "Ligue 1", winRate: 85, predictions: 18 },
];

const TESTIMONIALS = [
  { name: "Clear Daily Picks", role: "Member experience", avatar: "DP", rating: 5, quote: "See the match, selected market, odds, confidence and short analysis without sorting through a cluttered list of games." },
  { name: "Transparent Results", role: "Trust by design", avatar: "TR", rating: 5, quote: "Every published selection remains in the results history after the match, whether it wins, loses or is void." },
  { name: "Simple Lab Access", role: "Built for Nigeria", avatar: "LA", rating: 5, quote: "Choose a daily, weekly or monthly plan and receive immediate member access after successful payment verification." },
];

const USER = {
  name: "Idongesit Preston", initials: "IP",
  email: "member@betlab.ng", plan: "Monthly Lab",
  expiry: "19 Oct 2026", daysLeft: 92,
  winRate: 78, roi: 23.4, streak: 7, totalPredictions: 847,
};

const NOTIFICATIONS = [
  { icon: "✅", text: "Bayern vs Barcelona prediction confirmed: WON", time: "12m ago", unread: true },
  { icon: "📊", text: "Today&apos;s 6 predictions are now live", time: "1h ago", unread: true },
  { icon: "🏆", text: "Weekly performance summary: +18.2% ROI", time: "3h ago", unread: false },
  { icon: "⚠️", text: "La Liga: Sevilla vs Villarreal — LOST", time: "Yesterday", unread: false },
];

// ─── Utility ──────────────────────────────────────────────────────────────────

function cn(...c: (string | undefined | false | null)[]) {
  return c.filter(Boolean).join(" ");
}

function formatKickoff(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) + " · " +
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function useCounter(target: number, duration = 1800) {
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

const GOLD = "#D4AF37";
const NAVY = "#0B1220";

// ─── Shared Components ────────────────────────────────────────────────────────

function Chip({ label, variant }: {
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

function GoldBtn({ children, onClick, size = "md", outline = false, full = false, className }: {
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

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="h-px w-7 bg-[#D4AF37]" />
      <span className="font-[JetBrains_Mono,monospace] text-[10px] text-[#D4AF37] uppercase tracking-[0.2em]">{children}</span>
    </div>
  );
}

function ConfidenceBar({ value }: { value: number }) {
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

function CategoryPip({ cat }: { cat: PredCategory }) {
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

function LiveTicker() {
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

function PredCard({ pred, locked = false }: { pred: Prediction; locked?: boolean }) {
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


function ApiPredictionCard({
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

function Navbar({ page, nav, authed, setAuthed }: {
  page: Page; nav: (p: Page) => void;
  authed: boolean; setAuthed: (v: boolean) => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const unread = NOTIFICATIONS.filter(n => n.unread).length;

  const links = authed
    ? [{ label: "Dashboard", p: "dashboard" as Page }, { label: "Predictions", p: "predictions" as Page }, { label: "Live Scores", p: "results" as Page }]
    : [{ label: "Home", p: "home" as Page }, { label: "Predictions", p: "predictions" as Page }, { label: "Pricing", p: "pricing" as Page }, { label: "Live Scores", p: "results" as Page }, { label: "About", p: "about" as Page }];

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-[60px] border-b border-[#D4AF37]/8 bg-[#0B1220]/92 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-6">
        {/* Logo */}
        <button onClick={() => nav("home")} className="flex items-center gap-2.5 cursor-pointer flex-shrink-0">
          <div className="w-7 h-7 rounded-[5px] bg-[#D4AF37] flex items-center justify-center">
            <BarChart2 size={14} className="text-[#070E1A]" />
          </div>
          <span className="font-['Rajdhani',sans-serif] font-bold text-[20px] tracking-[0.05em] text-white">
            BET<span className="text-[#D4AF37]">LAB</span>
          </span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-5">
          {links.map(l => (
            <button key={l.p} onClick={() => nav(l.p)} className={cn(
              "text-[13px] transition-colors cursor-pointer relative py-1",
              page === l.p ? "text-[#D4AF37]" : "text-white/50 hover:text-white/85"
            )}>
              {l.label}
              {page === l.p && <span className="absolute bottom-0 inset-x-0 h-px bg-[#D4AF37]/60" />}
            </button>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2.5">
          {authed ? (
            <>
              {/* Notifications */}
              <div className="relative">
                <button onClick={() => setNotifOpen(!notifOpen)} className="relative w-8 h-8 flex items-center justify-center rounded border border-[#D4AF37]/15 text-white/40 hover:text-[#D4AF37] hover:border-[#D4AF37]/35 transition-all cursor-pointer">
                  <Bell size={14} />
                  {unread > 0 && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-[#111C2E] border border-[#D4AF37]/15 rounded-lg shadow-2xl overflow-hidden z-50">
                    <div className="px-4 py-2.5 border-b border-white/[0.05] flex items-center justify-between">
                      <span className="font-[JetBrains_Mono,monospace] text-[10px] text-[#D4AF37] uppercase tracking-widest">Notifications</span>
                      {unread > 0 && <span className="font-[JetBrains_Mono,monospace] text-[10px] text-white/30">{unread} unread</span>}
                    </div>
                    {NOTIFICATIONS.map((n, i) => (
                      <div key={i} className={cn("px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer flex gap-3", n.unread && "bg-[#D4AF37]/[0.03]")}>
                        <span className="text-sm mt-0.5 flex-shrink-0">{n.icon}</span>
                        <div>
                          <p className="text-[12px] text-white/75 leading-snug">{n.text}</p>
                          <p className="font-[JetBrains_Mono,monospace] text-[10px] text-white/25 mt-1">{n.time}</p>
                        </div>
                        {n.unread && <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] flex-shrink-0 mt-1.5 ml-auto" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* User pill */}
              <div className="flex items-center gap-2.5 pl-2.5 border-l border-white/8">
                <div className="w-7 h-7 rounded-full bg-[#D4AF37]/18 border border-[#D4AF37]/30 flex items-center justify-center">
                  <span className="text-[#D4AF37] text-[10px] font-bold">{USER.initials}</span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-[12px] font-medium text-white leading-none">{USER.name.split(" ")[0]}</p>
                  <p className="font-[JetBrains_Mono,monospace] text-[9px] text-[#D4AF37] mt-0.5">{USER.plan}</p>
                </div>
                <button onClick={() => { setAuthed(false); nav("home"); }} className="ml-1 text-white/25 hover:text-white/60 transition-colors cursor-pointer">
                  <LogOut size={13} />
                </button>
              </div>
            </>
          ) : (
            <>
              <button onClick={() => nav("login")} className="text-[13px] text-white/50 hover:text-white transition-colors cursor-pointer">Sign In</button>
              <GoldBtn onClick={() => nav("register")} size="sm">Get Access</GoldBtn>
            </>
          )}

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-white/50 hover:text-white transition-colors cursor-pointer ml-1">
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#D4AF37]/8 bg-[#0B1220]">
          <nav className="px-4 py-3 flex flex-col gap-0.5">
            {links.map(l => (
              <button key={l.p} onClick={() => { nav(l.p); setMobileOpen(false); }}
                className={cn("text-left px-3 py-2.5 rounded text-[13px] transition-colors", page === l.p ? "text-[#D4AF37] bg-[#D4AF37]/8" : "text-white/60 hover:text-white hover:bg-white/[0.03]")}>
                {l.label}
              </button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer({ nav }: { nav: (p: Page) => void }) {
  return (
    <footer className="border-t border-[#D4AF37]/8 mt-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded bg-[#D4AF37] flex items-center justify-center">
              <BarChart2 size={12} className="text-[#070E1A]" />
            </div>
            <span className="font-['Rajdhani',sans-serif] font-bold text-[18px] text-white tracking-wide">BET<span className="text-[#D4AF37]">LAB</span></span>
          </div>
          <p className="text-[12px] text-white/35 leading-relaxed mb-4">Premium football intelligence platform. Data-driven predictions for serious analysts.</p>
          <p className="text-[10px] font-[JetBrains_Mono,monospace] text-white/20 leading-relaxed">Bet Lab is a sports analytics subscription service. We are not a bookmaker. Please gamble responsibly. 18+ only.</p>
        </div>
        {[
          { title: "Platform", links: [["Home", "home"], ["Predictions", "predictions"], ["Live Scores", "results"], ["Pricing", "pricing"]] as [string, Page][] },
          { title: "Company", links: [["About", "about"], ["Contact", "contact"]] as [string, Page][] },
          { title: "Legal", links: [["Privacy Policy", "about"], ["Terms of Service", "about"], ["Responsible Gambling", "about"]] as [string, Page][] },
        ].map(col => (
          <div key={col.title}>
            <h4 className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-[0.2em] text-[#D4AF37] mb-4">{col.title}</h4>
            <ul className="space-y-2.5">
              {col.links.map(([label, p]) => (
                <li key={label}><button onClick={() => nav(p)} className="text-[12px] text-white/35 hover:text-white/75 transition-colors cursor-pointer">{label}</button></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-[#D4AF37]/8 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-[JetBrains_Mono,monospace] text-[10px] text-white/20">© 2026 Bet Lab Intelligence Ltd. All rights reserved.</p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-[JetBrains_Mono,monospace] text-[10px] text-white/25">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────

function HomePage({ nav }: { nav: (p: Page) => void }) {
  const wins = useCounter(6, 1200);
  const members = useCounter(3, 1200);

  const features = [
    { icon: <Activity size={20} />, title: "Statistical Modelling", desc: "50+ variables per prediction — xG, press intensity, set-piece efficiency, travel fatigue, squad depth and form cycles." },
    { icon: <Target size={20} />, title: "Value Identification", desc: "Daily selections focus on markets where form, matchup context and available statistics support a clear position." },
    { icon: <Shield size={20} />, title: "Analyst Verification", desc: "Every selection is reviewed by the football analyst before publication. No automatic or unverified releases." },
    { icon: <Award size={20} />, title: "Full Accountability", desc: "Every prediction is logged permanently — wins and losses. No cherry-picking, no revisionism. Our record is fully public." },
    { icon: <Users size={20} />, title: "Coverage Depth", desc: "Coverage follows the strongest available fixtures across major leagues and competitions, rather than forcing picks every day." },
    { icon: <TrendingUp size={20} />, title: "Live Performance Tracking", desc: "Real-time ROI tracking, win rate trends and personal performance benchmarks in your subscriber dashboard." },
  ];

  const plans = [
    { name: "Daily Pass", price: "₦1,000", sub: "/day", picks: "24-hour access", features: ["All daily Lab picks", "Banker and Rollover", "Results access", "Instant activation"], highlight: false },
    { name: "Weekly Lab", price: "₦3,500", sub: "/week", picks: "7-day access", features: ["All prediction categories", "Daily analysis notes", "Priority updates", "Complete results log"], highlight: true },
    { name: "Monthly Lab", price: "₦10,000", sub: "/month", picks: "30-day access", features: ["Everything in Weekly Lab", "Weekend Mega and Jackpot", "Performance dashboard", "Best member value"], highlight: false },
  ];

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-[60px]">
        {/* Grid backdrop */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage: `linear-gradient(${GOLD} 1px, transparent 1px), linear-gradient(90deg, ${GOLD} 1px, transparent 1px)`,
              backgroundSize: "52px 52px",
              animation: "grid-drift 18s linear infinite",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0B1220]" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 w-full py-20 lg:py-28">
          <div className="grid lg:grid-cols-[1fr_420px] gap-16 items-center">
            {/* Left copy */}
            <div>
              <div className="flex items-center gap-2.5 mb-7 animate-fade-up">
                <div className="flex items-center gap-1.5 border border-emerald-500/25 bg-emerald-500/8 rounded-full px-3 py-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-[JetBrains_Mono,monospace] text-[10px] text-emerald-400 tracking-widest uppercase">Live · 6 predictions today</span>
                </div>
              </div>

              <h1 className="font-['Rajdhani',sans-serif] font-bold text-[64px] sm:text-[80px] lg:text-[88px] text-white leading-[0.95] tracking-tight mb-6 animate-fade-up delay-100">
                FOOTBALL<br />
                INTELLIGENCE<br />
                <span className="text-[#D4AF37]">REFINED.</span>
              </h1>

              <p className="text-white/50 text-[16px] leading-relaxed mb-8 max-w-[500px] animate-fade-up delay-200">
                Curated football predictions for members who want clear, disciplined daily selections. Every prediction is backed by deep statistical modelling and expert verification — not gut feeling or punditry.
              </p>

              <div className="flex flex-wrap gap-3 mb-14 animate-fade-up delay-300">
                <GoldBtn onClick={() => nav("register")} size="lg">
                  Get Lab Access <ArrowRight size={16} />
                </GoldBtn>
                <GoldBtn onClick={() => nav("predictions")} size="lg" outline>
                  View Today&apos;s Picks
                </GoldBtn>
              </div>

              {/* Live stats bar */}
              <div className="animate-fade-up delay-400">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 border border-[#D4AF37]/12 rounded-lg overflow-hidden">
                  {[
                    { v: wins.toLocaleString(), label: "Picks Today", sub: "Updated daily" },
                    { v: "4", label: "Core Categories", sub: "Banker · Sure 2 · Sure 5 · Rollover" },
                    { v: members.toLocaleString(), label: "Access Plans", sub: "Daily · Weekly · Monthly" },
                    { v: "100%", label: "Results Logged", sub: "Wins and losses remain visible" },
                  ].map((s, i) => (
                    <div key={i} className={cn("px-5 py-4 bg-[#111C2E]/50", i < 3 && "border-r border-[#D4AF37]/10")}>
                      <p className="font-['Rajdhani',sans-serif] font-bold text-[26px] text-[#D4AF37] leading-none">{s.v}</p>
                      <p className="font-[JetBrains_Mono,monospace] text-[9px] text-white/30 uppercase tracking-widest mt-1.5">{s.label}</p>
                      <p className="font-[JetBrains_Mono,monospace] text-[9px] text-emerald-400 mt-0.5">{s.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — stacked cards */}
            <div className="hidden lg:block relative h-[520px]">
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Back card */}
                <div className="absolute top-0 right-2 w-[340px] rotate-[2deg] opacity-35 pointer-events-none scale-95">
                  <PredCard pred={PREDICTIONS[2]} />
                </div>
                {/* Mid card */}
                <div className="absolute top-14 right-0 w-[340px] rotate-[0.5deg] opacity-60 pointer-events-none scale-[0.97]">
                  <PredCard pred={PREDICTIONS[1]} />
                </div>
                {/* Front card */}
                <div className="absolute top-24 right-4 w-[350px] z-10">
                  <PredCard pred={PREDICTIONS[0]} />
                </div>
                {/* Result badge */}
                <div className="absolute bottom-14 right-0 z-20 bg-[#111C2E] border border-[#D4AF37]/20 rounded-lg px-4 py-2.5 shadow-2xl flex items-center gap-3">
                  <CheckCircle2 size={15} className="text-emerald-400" />
                  <div>
                    <p className="font-[JetBrains_Mono,monospace] text-[9px] text-white/40 uppercase tracking-widest">Yesterday&apos;s record</p>
                    <p className="font-['Rajdhani',sans-serif] font-bold text-white text-[16px] leading-none mt-0.5">5 / 6 <span className="text-emerald-400">Correct</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Ticker ─────────────────────────────────────────── */}
      <LiveTicker />

      {/* ── Features ────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
        <div className="text-center mb-14">
          <SectionEyebrow>How It Works</SectionEyebrow>
          <h2 className="font-['Rajdhani',sans-serif] font-bold text-[48px] sm:text-[60px] text-white mb-3">
            DATA-DRIVEN. ANALYST-VERIFIED.
          </h2>
          <p className="text-white/40 max-w-lg mx-auto text-[14px] leading-relaxed">
            We treat football prediction as a serious analytical discipline — building models that surface genuine edge, not noise.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div key={i} className="bg-card border border-[#D4AF37]/8 rounded-lg p-6 group hover:border-[#D4AF37]/20 transition-all duration-300 hover:bg-[#111C2E]">
              <div className="w-9 h-9 rounded bg-[#D4AF37]/10 border border-[#D4AF37]/15 flex items-center justify-center text-[#D4AF37] mb-4 group-hover:bg-[#D4AF37]/18 transition-colors">
                {f.icon}
              </div>
              <h3 className="font-['Rajdhani',sans-serif] font-bold text-[20px] text-white mb-1.5">{f.title}</h3>
              <p className="text-[12px] text-white/40 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Sample Predictions ──────────────────────────────── */}
      <section className="py-20 bg-[#0D1828]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <SectionEyebrow>Today&apos;s Intelligence</SectionEyebrow>
              <h2 className="font-['Rajdhani',sans-serif] font-bold text-[44px] text-white">LIVE PREDICTIONS</h2>
            </div>
            <GoldBtn onClick={() => nav("predictions")} outline size="sm">
              View All Picks <ChevronRight size={13} />
            </GoldBtn>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PREDICTIONS.slice(0, 3).map((p, i) => (
              <PredCard key={p.id} pred={p} locked={i > 0} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <p className="text-[12px] text-white/30 mb-4 font-[JetBrains_Mono,monospace]">+ 3 more predictions available to subscribers today</p>
            <GoldBtn onClick={() => nav("register")} size="md">
              Unlock All Predictions <Lock size={13} />
            </GoldBtn>
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
        <div className="text-center mb-14">
          <SectionEyebrow>Membership</SectionEyebrow>
          <h2 className="font-['Rajdhani',sans-serif] font-bold text-[48px] sm:text-[56px] text-white mb-3">
            CHOOSE YOUR EDGE
          </h2>
          <p className="text-white/40 max-w-md mx-auto text-[13px]">Choose the access period that works for you. Payments will be secured with Paystack.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((plan, i) => (
            <div key={i} className={cn(
              "relative border rounded-lg overflow-hidden transition-all duration-300",
              plan.highlight
                ? "bg-gradient-to-b from-[#1A2A45] to-[#111C2E] border-[#D4AF37]/40 shadow-[0_0_50px_rgba(212,175,55,0.1)]"
                : "bg-card border-[#D4AF37]/8 hover:border-[#D4AF37]/20"
            )}>
              {plan.highlight && <div className="h-[2px] bg-gradient-to-r from-[#D4AF37]/40 via-[#D4AF37] to-[#D4AF37]/40" />}
              <div className="p-7">
                {plan.highlight && (
                  <div className="mb-3">
                    <span className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-widest text-[#D4AF37] border border-[#D4AF37]/25 bg-[#D4AF37]/8 px-2.5 py-1 rounded-full">Most Popular</span>
                  </div>
                )}
                <h3 className="font-['Rajdhani',sans-serif] font-bold text-[24px] text-white mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="font-['Rajdhani',sans-serif] font-bold text-[42px] text-[#D4AF37] leading-none">{plan.price}</span>
                  <span className="text-white/35 text-[12px]">{plan.sub}</span>
                </div>
                <p className="font-[JetBrains_Mono,monospace] text-[10px] text-white/30 mb-7 uppercase tracking-wider">{plan.picks}</p>
                <ul className="space-y-2.5 mb-7">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-[13px] text-white/60">
                      <Check size={12} className="text-[#D4AF37] flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                {plan.highlight
                  ? <GoldBtn onClick={() => nav("register")} full size="md">Get Lab Access</GoldBtn>
                  : <GoldBtn onClick={() => nav("register")} full size="md" outline>Get Lab Access</GoldBtn>
                }
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────── */}
      <section className="py-20 bg-[#0D1828]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <SectionEyebrow>Member Feedback</SectionEyebrow>
            <h2 className="font-['Rajdhani',sans-serif] font-bold text-[44px] text-white">TRUSTED BY MEMBERS</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-card border border-[#D4AF37]/8 rounded-lg p-6">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={13} className="text-[#D4AF37] fill-[#D4AF37]" />
                  ))}
                </div>
                <p className="text-[13px] text-white/55 leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/[0.04]">
                  <div className="w-8 h-8 rounded-full bg-[#D4AF37]/12 border border-[#D4AF37]/22 flex items-center justify-center">
                    <span className="font-bold text-[#D4AF37] text-[10px]">{t.avatar}</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-white">{t.name}</p>
                    <p className="font-[JetBrains_Mono,monospace] text-[9px] text-white/30 mt-0.5">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
        <div className="relative rounded-xl border border-[#D4AF37]/22 bg-gradient-to-br from-[#1A2845] via-[#131F33] to-[#0D1828] px-10 py-16 sm:px-20 text-center overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/35 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/15 to-transparent" />
          <SectionEyebrow>Start Your Intelligence Edge</SectionEyebrow>
          <h2 className="font-['Rajdhani',sans-serif] font-bold text-[44px] sm:text-[56px] text-white mb-3 leading-tight">
            DAILY PICKS.<br />SIMPLE LAB ACCESS.
          </h2>
          <p className="text-white/40 mb-8 max-w-md mx-auto text-[14px]">Create an account, choose an access plan and receive carefully selected daily football picks in one simple dashboard.</p>
          <GoldBtn onClick={() => nav("register")} size="lg">
            Create Your Account <ArrowRight size={16} />
          </GoldBtn>
        </div>
      </section>
    </div>
  );
}

// ─── PRICING PAGE ─────────────────────────────────────────────────────────────

function PricingPage({ nav }: { nav: (p: Page) => void }) {
  

  const plans = [
    {
      name: "Daily Pass", price: "₦1,000", period: "/day", picks: "24-hour access",
      inc: ["All daily Lab picks", "Banker and Rollover", "Results access", "Instant activation"],
      exc: ["Weekend Mega", "Monthly performance dashboard"], highlight: false,
    },
    {
      name: "Weekly Lab", price: "₦3,500", period: "/week", picks: "7-day access",
      inc: ["All prediction categories", "Daily analysis notes", "Sure 2 and Sure 5", "Rollover updates", "Complete results log"],
      exc: ["Monthly performance dashboard"], highlight: true,
    },
    {
      name: "Monthly Lab", price: "₦10,000", period: "/month", picks: "30-day access",
      inc: ["Everything in Weekly Lab", "Weekend Mega and Jackpot", "Performance dashboard", "Priority notifications", "Best member value"],
      exc: [], highlight: false,
    },
  ];

  const faqs = [
    { q: "Is Bet Lab a gambling service?", a: "No. Bet Lab is a sports analytics subscription platform. We provide research and predictions. We are not a bookmaker and do not accept any form of wager." },
    { q: "How accurate are the predictions?", a: "Accuracy changes over time and no result is guaranteed. Bet Lab keeps a complete results history so members can judge performance from the published record." },
    { q: "Can I cancel my subscription at any time?", a: "Yes. Cancel online at any time with no penalty. Your access continues until the end of your current billing cycle." },
    { q: "Which competitions are covered?", a: "Bet Lab focuses on major football leagues and competitions. Available games will depend on the day’s fixtures and the analyst’s strongest selections." },
    { q: "How quickly is access activated?", a: "Access is activated immediately after a successful payment is verified." },
  ];

  return (
    <div className="pt-[60px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 pb-24">
        <div className="text-center mb-14">
          <SectionEyebrow>Pricing</SectionEyebrow>
          <h1 className="font-['Rajdhani',sans-serif] font-bold text-[56px] sm:text-[68px] text-white mb-4">
            TRANSPARENT PRICING
          </h1>
          <p className="text-white/40 mb-8 text-[14px]">Choose daily, weekly or monthly access. Payments will be processed securely in Nigerian naira.</p>

        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-20">
          {plans.map((plan, i) => {
            return (
              <div key={i} className={cn(
                "relative border rounded-lg overflow-hidden",
                plan.highlight
                  ? "bg-gradient-to-b from-[#1A2A45] to-[#111C2E] border-[#D4AF37]/40 shadow-[0_0_50px_rgba(212,175,55,0.1)]"
                  : "bg-card border-[#D4AF37]/8"
              )}>
                {plan.highlight && <div className="h-[2px] bg-gradient-to-r from-[#D4AF37]/40 via-[#D4AF37] to-[#D4AF37]/40" />}
                <div className="p-7">
                  {plan.highlight && (
                    <div className="mb-3">
                      <span className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-widest text-[#D4AF37] border border-[#D4AF37]/25 bg-[#D4AF37]/8 px-2.5 py-1 rounded-full">Recommended</span>
                    </div>
                  )}
                  <h3 className="font-['Rajdhani',sans-serif] font-bold text-[24px] text-white mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="font-['Rajdhani',sans-serif] font-bold text-[48px] leading-none text-[#D4AF37]">{plan.price}</span>
                    <span className="text-white/35 text-[12px]">{plan.period}</span>
                  </div>
                  <p className="font-[JetBrains_Mono,monospace] text-[9px] text-white/30 uppercase tracking-wider mb-7">{plan.picks}</p>
                  {plan.highlight
                    ? <GoldBtn onClick={() => nav("register")} full size="md">Get Lab Access</GoldBtn>
                    : <GoldBtn onClick={() => nav("register")} full size="md" outline>Get Lab Access</GoldBtn>
                  }
                  <div className="mt-6 space-y-2.5">
                    {plan.inc.map(f => (
                      <div key={f} className="flex items-start gap-2.5">
                        <Check size={11} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span className="text-[12px] text-white/60">{f}</span>
                      </div>
                    ))}
                    {plan.exc.map(f => (
                      <div key={f} className="flex items-start gap-2.5 opacity-30">
                        <Minus size={11} className="text-white/30 mt-0.5 flex-shrink-0" />
                        <span className="text-[12px] text-white/40">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="font-['Rajdhani',sans-serif] font-bold text-[36px] text-white text-center mb-8">FREQUENTLY ASKED</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => <FaqRow key={i} q={faq.q} a={faq.a} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function FaqRow({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-card border border-[#D4AF37]/8 rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer hover:bg-white/[0.015] transition-colors">
        <span className="font-medium text-white text-[13px]">{q}</span>
        <ChevronDown size={14} className={cn("text-[#D4AF37] flex-shrink-0 transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && (
        <div className="px-5 pb-4 border-t border-white/[0.04]">
          <p className="text-[12px] text-white/45 leading-relaxed pt-3">{a}</p>
        </div>
      )}
    </div>
  );
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

function AuthPage({ mode, nav, setAuthed }: {
  mode: "login" | "register"; nav: (p: Page) => void; setAuthed: (v: boolean) => void;
}) {
  const [tab, setTab] = useState<"login" | "register">(mode);
  const [step, setStep] = useState(1);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", pass: "", plan: "Weekly Lab" });

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === "register" && step === 1) { setStep(2); return; }
    setAuthed(true);
    nav("dashboard");
  };

  return (
    <div className="min-h-screen pt-[60px] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-[#D4AF37] flex items-center justify-center mx-auto mb-4">
            <BarChart2 size={22} className="text-[#070E1A]" />
          </div>
          <h1 className="font-['Rajdhani',sans-serif] font-bold text-[36px] text-white mb-1">
            {tab === "login" ? "WELCOME BACK" : "JOIN BET LAB"}
          </h1>
          <p className="text-[12px] text-white/35">
            {tab === "login" ? "Access your intelligence feed" : "Simple signup · Secure payment"}
          </p>
        </div>

        {/* Tab toggle */}
        <div className="flex bg-card border border-[#D4AF37]/12 rounded-lg p-1 mb-6">
          {(["login", "register"] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setStep(1); }} className={cn("flex-1 py-2 rounded text-[13px] font-medium transition-all capitalize cursor-pointer", tab === t ? "bg-[#D4AF37] text-[#070E1A]" : "text-white/40 hover:text-white")}>
              {t === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        <div className="bg-card border border-[#D4AF37]/12 rounded-xl p-7">
          <form onSubmit={go} className="space-y-4">
            {tab === "register" && step === 1 && (
              <div>
                <label className="block font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-widest text-white/35 mb-1.5">Full Name</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Your full name"
                  className="w-full bg-[#162036] border border-[#D4AF37]/12 rounded px-3.5 py-2.5 text-[13px] text-white placeholder-white/20 focus:outline-none focus:border-[#D4AF37]/45 transition-colors" />
              </div>
            )}
            {(tab === "login" || step === 1) && (
              <div>
                <label className="block font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-widest text-white/35 mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="you@example.com"
                    className="w-full bg-[#162036] border border-[#D4AF37]/12 rounded pl-9 pr-3.5 py-2.5 text-[13px] text-white placeholder-white/20 focus:outline-none focus:border-[#D4AF37]/45 transition-colors" />
                </div>
              </div>
            )}
            {(tab === "login" || step === 1) && (
              <div>
                <label className="block font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-widest text-white/35 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                  <input type={showPass ? "text" : "password"} value={form.pass} onChange={e => setForm({ ...form, pass: e.target.value })} required placeholder="••••••••"
                    className="w-full bg-[#162036] border border-[#D4AF37]/12 rounded pl-9 pr-9 py-2.5 text-[13px] text-white placeholder-white/20 focus:outline-none focus:border-[#D4AF37]/45 transition-colors" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 cursor-pointer">
                    {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
            )}

            {tab === "register" && step === 2 && (
              <div className="space-y-3">
                <p className="font-['Rajdhani',sans-serif] font-bold text-[20px] text-white">Select Your Plan</p>
                {["Daily Pass", "Weekly Lab", "Monthly Lab"].map(p => {
                  const prices: Record<string, string> = { "Daily Pass": "₦1,000/day", "Weekly Lab": "₦3,500/week", "Monthly Lab": "₦10,000/month" };
                  const descs: Record<string, string> = { "Daily Pass": "24-hour access", "Weekly Lab": "7-day access", "Monthly Lab": "30-day access" };
                  return (
                    <label key={p} className={cn("flex items-center gap-3.5 p-3.5 rounded-lg border cursor-pointer transition-all", form.plan === p ? "border-[#D4AF37]/40 bg-[#D4AF37]/5" : "border-[#D4AF37]/8 hover:border-[#D4AF37]/20")}>
                      <input type="radio" name="plan" value={p} checked={form.plan === p} onChange={() => setForm({ ...form, plan: p })} className="accent-[#D4AF37]" />
                      <div className="flex-1 flex items-center justify-between">
                        <div>
                          <span className="font-['Rajdhani',sans-serif] font-bold text-white text-[16px]">{p}</span>
                          <p className="font-[JetBrains_Mono,monospace] text-[9px] text-white/30 mt-0.5 uppercase">{descs[p]}</p>
                        </div>
                        <span className="font-['Rajdhani',sans-serif] font-bold text-[#D4AF37] text-[16px]">{prices[p]}</span>
                      </div>
                    </label>
                  );
                })}
                <p className="font-[JetBrains_Mono,monospace] text-[9px] text-white/25 text-center pt-1 uppercase tracking-widest">Access begins after payment verification</p>
              </div>
            )}

            {tab === "login" && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-3 h-3 accent-[#D4AF37]" />
                  <span className="text-[11px] text-white/35">Remember me</span>
                </label>
                <button type="button" className="text-[11px] text-[#D4AF37]/60 hover:text-[#D4AF37] cursor-pointer">Forgot password?</button>
              </div>
            )}

            <GoldBtn full size="md">
              {tab === "login" ? "Sign In" : step === 1 ? "Continue" : "Get Lab Access"}
              <ArrowRight size={14} />
            </GoldBtn>
          </form>
          <p className="mt-5 text-center font-[JetBrains_Mono,monospace] text-[9px] text-white/25 uppercase tracking-widest">Demo: any credentials work</p>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

function DashboardPage({ nav }: { nav: (p: Page) => void }) {
  const [section, setSection] = useState<DashSection>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems: { icon: React.ReactNode; label: string; s: DashSection }[] = [
    { icon: <LayoutDashboard size={15} />, label: "Overview", s: "overview" },
    { icon: <List size={15} />, label: "Predictions", s: "predictions" },
    { icon: <History size={15} />, label: "Results", s: "results" },
    { icon: <LineChart size={15} />, label: "Performance", s: "performance" },
  ];

  const daysLeft = USER.daysLeft;
  const expiryPct = Math.round((daysLeft / 365) * 100);

  return (
    <div className="pt-[60px] min-h-screen flex">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className={cn(
        "fixed top-[60px] left-0 bottom-0 w-[220px] bg-[#0D1828] border-r border-[#D4AF37]/8 flex flex-col z-40 transition-transform duration-300",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="font-[JetBrains_Mono,monospace] text-[9px] text-white/20 uppercase tracking-[0.2em] px-3 mb-3">Navigation</p>
          {navItems.map(item => (
            <button key={item.s} onClick={() => { setSection(item.s); setSidebarOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded text-[13px] font-medium transition-all duration-150 cursor-pointer",
                section === item.s
                  ? "bg-[#D4AF37]/12 text-[#D4AF37] border border-[#D4AF37]/20"
                  : "text-white/40 hover:text-white/80 hover:bg-white/[0.03]"
              )}>
              <span className={section === item.s ? "text-[#D4AF37]" : "text-white/25"}>{item.icon}</span>
              {item.label}
            </button>
          ))}

          <div className="pt-4">
            <p className="font-[JetBrains_Mono,monospace] text-[9px] text-white/20 uppercase tracking-[0.2em] px-3 mb-3">Account</p>
            <button onClick={() => nav("pricing")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-[13px] text-white/40 hover:text-white/80 hover:bg-white/[0.03] transition-all cursor-pointer">
              <span className="text-white/25"><Settings size={15} /></span>Settings
            </button>
          </div>
        </nav>

        {/* Subscription card */}
        <div className="p-4">
          <div className="bg-gradient-to-b from-[#1A2640] to-[#111C2E] border border-[#D4AF37]/18 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-[JetBrains_Mono,monospace] text-[9px] text-white/30 uppercase tracking-widest mb-0.5">Membership</p>
                <p className="font-['Rajdhani',sans-serif] font-bold text-[18px] text-[#D4AF37]">{USER.plan}</p>
              </div>
              <Chip label="Active" variant="emerald" />
            </div>
            {/* Expiry bar */}
            <div className="mb-2">
              <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                <div className="h-full bg-[#D4AF37]/50 rounded-full" style={{ width: `${expiryPct}%` }} />
              </div>
            </div>
            <p className="font-[JetBrains_Mono,monospace] text-[9px] text-white/25">Expires {USER.expiry} · {daysLeft}d left</p>
            <button onClick={() => nav("pricing")} className="mt-3 w-full text-center font-[JetBrains_Mono,monospace] text-[9px] text-[#D4AF37]/50 hover:text-[#D4AF37] transition-colors cursor-pointer uppercase tracking-widest">
              Upgrade Plan →
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar toggle */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden fixed bottom-6 left-4 z-50 w-10 h-10 rounded-full bg-[#D4AF37] text-[#070E1A] flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.4)] cursor-pointer">
        {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
      </button>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="lg:hidden fixed inset-0 bg-black/50 z-30" />
      )}

      {/* ── Main Content ───────────────────────────────────── */}
      <main className="flex-1 lg:ml-[220px] min-h-full overflow-x-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <p className="font-[JetBrains_Mono,monospace] text-[9px] text-white/25 uppercase tracking-[0.2em] mb-1">Dashboard · {section}</p>
              <h1 className="font-['Rajdhani',sans-serif] font-bold text-[38px] text-white leading-none">
                Good morning, <span className="text-[#D4AF37]">{USER.name.split(" ")[0]}.</span>
              </h1>
              <p className="text-[12px] text-white/35 mt-1">Saturday, 19 July 2026 · 6 predictions live today</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 border border-emerald-500/20 bg-emerald-500/8 rounded-full px-3 py-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-[JetBrains_Mono,monospace] text-[9px] text-emerald-400 uppercase tracking-widest">Live feed</span>
              </div>
            </div>
          </div>

          {/* KPI strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {[
              { label: "Today's Picks", value: "6", sub: "3 high confidence", icon: <Target size={15} />, c: "text-[#D4AF37]" },
              { label: "Win Rate (30d)", value: `${USER.winRate}%`, sub: "↑ 4pp vs last month", icon: <TrendingUp size={15} />, c: "text-emerald-400" },
              { label: "Running ROI", value: `+${USER.roi}%`, sub: "Flat-stake basis", icon: <Activity size={15} />, c: "text-emerald-400" },
              { label: "Win Streak", value: `${USER.streak}W`, sub: `Best: 12 wins`, icon: <Flame size={15} />, c: "text-[#D4AF37]" },
            ].map((k, i) => (
              <div key={i} className="bg-card border border-[#D4AF37]/8 rounded-lg p-4 hover:border-[#D4AF37]/18 transition-colors group">
                <div className="flex items-start justify-between mb-3">
                  <span className="font-[JetBrains_Mono,monospace] text-[9px] text-white/30 uppercase tracking-widest leading-tight">{k.label}</span>
                  <span className={cn(k.c, "opacity-40 group-hover:opacity-70 transition-opacity")}>{k.icon}</span>
                </div>
                <p className={cn("font-['Rajdhani',sans-serif] font-bold text-[28px] leading-none", k.c)}>{k.value}</p>
                <p className="font-[JetBrains_Mono,monospace] text-[9px] text-white/25 mt-1.5">{k.sub}</p>
              </div>
            ))}
          </div>

          {/* ── Section: Overview ───────────────────────────── */}
          {section === "overview" && (
            <div className="space-y-5">
              <div className="grid lg:grid-cols-[1fr_280px] gap-5">
                {/* Chart */}
                <div className="bg-card border border-[#D4AF37]/8 rounded-lg p-5">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="font-[JetBrains_Mono,monospace] text-[9px] text-white/25 uppercase tracking-widest mb-1">Performance</p>
                      <h3 className="font-['Rajdhani',sans-serif] font-bold text-[20px] text-white">Win Rate — July 2026</h3>
                    </div>
                    <Chip label="+18pp MoM" variant="emerald" />
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={PERF_DATA} margin={{ top: 2, right: 2, bottom: 0, left: -22 }}>
                      <defs>
                        <linearGradient id="gGold" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={GOLD} stopOpacity={0.25} />
                          <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10, fontFamily: "JetBrains Mono,monospace" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10, fontFamily: "JetBrains Mono,monospace" }} axisLine={false} tickLine={false} domain={[55, 95]} />
                      <Tooltip contentStyle={{ background: "#111C2E", border: "1px solid rgba(212,175,55,0.18)", borderRadius: 6, fontSize: 11, fontFamily: "JetBrains Mono,monospace" }} itemStyle={{ color: GOLD }} labelStyle={{ color: "rgba(255,255,255,0.4)" }} />
                      <Area type="monotone" dataKey="winRate" stroke={GOLD} strokeWidth={1.5} fill="url(#gGold)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Recent results mini */}
                <div className="bg-card border border-[#D4AF37]/8 rounded-lg p-5">
                  <h3 className="font-['Rajdhani',sans-serif] font-bold text-[18px] text-white mb-4">Recent Results</h3>
                  <div className="space-y-3">
                    {RESULTS.slice(0, 7).map(r => (
                      <div key={r.id} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {r.result === "won"
                            ? <CheckCircle2 size={12} className="text-emerald-400 flex-shrink-0" />
                            : r.result === "lost"
                            ? <XCircle size={12} className="text-rose-400 flex-shrink-0" />
                            : <Minus size={12} className="text-white/20 flex-shrink-0" />
                          }
                          <div className="min-w-0">
                            <p className="text-[11px] text-white/55 truncate">{r.match.split(" vs ")[0]}</p>
                            <p className="font-[JetBrains_Mono,monospace] text-[9px] text-white/20">{r.date}</p>
                          </div>
                        </div>
                        <span className={cn("font-[JetBrains_Mono,monospace] text-[11px] font-bold flex-shrink-0",
                          r.profit > 0 ? "text-emerald-400" : r.profit < 0 ? "text-rose-400" : "text-white/20")}>
                          {r.profit > 0 ? `+${r.profit}` : r.profit === 0 ? "—" : r.profit}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setSection("results")} className="mt-4 w-full text-center font-[JetBrains_Mono,monospace] text-[9px] text-[#D4AF37]/50 hover:text-[#D4AF37] transition-colors cursor-pointer pt-3 border-t border-white/[0.04] uppercase tracking-widest">
                    View all results →
                  </button>
                </div>
              </div>

              {/* Today's top picks preview */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-['Rajdhani',sans-serif] font-bold text-[22px] text-white">Today&apos;s Top Picks</h3>
                  <button onClick={() => setSection("predictions")} className="font-[JetBrains_Mono,monospace] text-[9px] text-[#D4AF37]/60 hover:text-[#D4AF37] uppercase tracking-widest cursor-pointer">View all →</button>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {PREDICTIONS.slice(0, 3).map(p => <PredCard key={p.id} pred={p} />)}
                </div>
              </div>
            </div>
          )}

          {/* ── Section: Predictions ────────────────────────── */}
          {section === "predictions" && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-['Rajdhani',sans-serif] font-bold text-[26px] text-white">Today&apos;s Predictions</h2>
                <Chip label="6 live" variant="emerald" />
              </div>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {PREDICTIONS.map(p => <PredCard key={p.id} pred={p} />)}
              </div>
            </div>
          )}

          {/* ── Section: Results ────────────────────────────── */}
          {section === "results" && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-['Rajdhani',sans-serif] font-bold text-[26px] text-white">Results Log</h2>
                <div className="flex items-center gap-2">
                  <span className="font-[JetBrains_Mono,monospace] text-[11px] text-emerald-400">8W</span>
                  <span className="text-white/15">/</span>
                  <span className="font-[JetBrains_Mono,monospace] text-[11px] text-rose-400">2L</span>
                  <span className="text-white/15">/</span>
                  <span className="font-[JetBrains_Mono,monospace] text-[11px] text-white/25">1V</span>
                  <span className="font-[JetBrains_Mono,monospace] text-[9px] text-white/20 ml-1">(last 11)</span>
                </div>
              </div>
              <div className="bg-card border border-[#D4AF37]/8 rounded-lg overflow-hidden">
                {RESULTS.map((r, i) => (
                  <div key={r.id} className={cn(
                    "flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.015] transition-colors",
                    i < RESULTS.length - 1 && "border-b border-white/[0.04]"
                  )}>
                    <span className="font-[JetBrains_Mono,monospace] text-[10px] text-white/25 w-12 flex-shrink-0">{r.date}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-white/70 truncate">{r.match}</p>
                      <p className="font-[JetBrains_Mono,monospace] text-[9px] text-white/25 mt-0.5">{r.prediction} · {r.league}</p>
                    </div>
                    <span className="font-[JetBrains_Mono,monospace] text-[11px] text-white/40 flex-shrink-0">{r.odds}</span>
                    <div className="flex items-center gap-1.5 w-14 flex-shrink-0">
                      <div className={cn("w-1.5 h-1.5 rounded-full", r.result === "won" ? "bg-emerald-500" : r.result === "lost" ? "bg-rose-500" : "bg-white/15")} />
                      <span className={cn("font-[JetBrains_Mono,monospace] text-[10px] uppercase", r.result === "won" ? "text-emerald-400" : r.result === "lost" ? "text-rose-400" : "text-white/20")}>
                        {r.result}
                      </span>
                    </div>
                    <span className={cn("font-[JetBrains_Mono,monospace] text-[11px] font-bold w-14 text-right flex-shrink-0",
                      r.profit > 0 ? "text-emerald-400" : r.profit < 0 ? "text-rose-400" : "text-white/20")}>
                      {r.profit > 0 ? `+${r.profit}u` : r.profit === 0 ? "VOID" : `${r.profit}u`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Section: Performance ────────────────────────── */}
          {section === "performance" && (
            <div className="space-y-5">
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { label: "Total Predictions", value: USER.totalPredictions.toLocaleString(), sub: "Since Jan 2026" },
                  { label: "Overall Win Rate", value: `${USER.winRate}%`, sub: "All markets, all leagues" },
                  { label: "Total ROI", value: `+${USER.roi}%`, sub: "Flat-stake, 1 unit/pred" },
                ].map((s, i) => (
                  <div key={i} className="bg-card border border-[#D4AF37]/8 rounded-lg p-5">
                    <p className="font-[JetBrains_Mono,monospace] text-[9px] text-white/25 uppercase tracking-widest mb-2">{s.label}</p>
                    <p className="font-['Rajdhani',sans-serif] font-bold text-[32px] text-[#D4AF37] leading-none">{s.value}</p>
                    <p className="font-[JetBrains_Mono,monospace] text-[9px] text-white/25 mt-2">{s.sub}</p>
                  </div>
                ))}
              </div>

              {/* ROI chart */}
              <div className="bg-card border border-[#D4AF37]/8 rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-['Rajdhani',sans-serif] font-bold text-[20px] text-white">Cumulative ROI — July 2026</h3>
                  <Chip label="Flat stake" variant="ghost" />
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={PERF_DATA} margin={{ top: 2, right: 2, bottom: 0, left: -22 }}>
                    <defs>
                      <linearGradient id="gROI" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10, fontFamily: "JetBrains Mono,monospace" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10, fontFamily: "JetBrains Mono,monospace" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#111C2E", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 6, fontSize: 11, fontFamily: "JetBrains Mono,monospace" }} itemStyle={{ color: "#10B981" }} />
                    <Area type="monotone" dataKey="roi" stroke="#10B981" strokeWidth={1.5} fill="url(#gROI)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* League breakdown */}
              <div className="bg-card border border-[#D4AF37]/8 rounded-lg p-5">
                <h3 className="font-['Rajdhani',sans-serif] font-bold text-[20px] text-white mb-5">Win Rate by League</h3>
                <div className="space-y-3">
                  {LEAGUE_PERF.map(l => (
                    <div key={l.league} className="flex items-center gap-4">
                      <span className="font-[JetBrains_Mono,monospace] text-[10px] text-white/40 uppercase w-14 flex-shrink-0">{l.league}</span>
                      <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${l.winRate}%`, background: l.winRate >= 80 ? "#10B981" : l.winRate >= 75 ? GOLD : "rgba(255,255,255,0.3)" }} />
                      </div>
                      <span className={cn("font-[JetBrains_Mono,monospace] text-[11px] font-bold w-10 text-right flex-shrink-0",
                        l.winRate >= 80 ? "text-emerald-400" : l.winRate >= 75 ? "text-[#D4AF37]" : "text-white/40")}>
                        {l.winRate}%
                      </span>
                      <span className="font-[JetBrains_Mono,monospace] text-[9px] text-white/20 w-14 text-right flex-shrink-0">{l.predictions} picks</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ─── PUBLIC PREDICTIONS PAGE ──────────────────────────────────────────────────

function PredictionsPage({ nav, authed }: { nav: (p: Page) => void; authed: boolean }) {
  const [filter, setFilter] = useState<"all" | PredCategory>("all");
  const [predictions, setPredictions] = useState<ApiPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPredictions() {
      try {
        setLoading(true);
        setError("");

        const data = await getPredictions();
        setPredictions(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load predictions.");
      } finally {
        setLoading(false);
      }
    }

    loadPredictions();
  }, []);

  const cats: ("all" | PredCategory)[] = ["all", "Banker", "Sure 2", "Sure 3", "Sure 5", "Rollover"];
  const filtered =
    filter === "all"
      ? predictions
      : predictions.filter((prediction) => prediction.category.name === filter);

  return (
    <div className="pt-[60px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 pb-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-10">
          <div>
            <SectionEyebrow>Intelligence Feed</SectionEyebrow>
            <h1 className="font-['Rajdhani',sans-serif] font-bold text-[52px] text-white leading-none">TODAY&apos;S PREDICTIONS</h1>
            <p className="text-white/35 text-[12px] mt-2 font-[JetBrains_Mono,monospace]">Saturday, 19 July 2026 · {predictions.length} prediction packages published</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 border border-emerald-500/20 bg-emerald-500/8 rounded-full px-3 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-[JetBrains_Mono,monospace] text-[9px] text-emerald-400 uppercase tracking-widest">Live</span>
            </div>
            <div className="bg-card border border-[#D4AF37]/8 rounded-lg px-3.5 py-2">
              <span className="font-[JetBrains_Mono,monospace] text-[9px] text-white/30">Avg confidence: </span>
              <span className="font-[JetBrains_Mono,monospace] text-[9px] text-[#D4AF37] font-bold">73.8%</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {cats.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)} className={cn(
              "px-4 py-1.5 rounded border font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-widest transition-all cursor-pointer",
              filter === cat ? "bg-[#D4AF37] text-[#070E1A] border-[#D4AF37]" : "bg-card border-[#D4AF37]/8 text-white/40 hover:border-[#D4AF37]/22 hover:text-white"
            )}>
              {cat === "all" ? "All" : cat}
            </button>
          ))}
        </div>

        {loading && (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin mx-auto" />
            <p className="font-[JetBrains_Mono,monospace] text-[10px] text-white/35 uppercase tracking-widest mt-4">
              Loading prediction packages
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl px-6 py-10 text-center">
            <p className="font-['Rajdhani',sans-serif] font-bold text-[22px] text-white">
              Predictions unavailable
            </p>
            <p className="text-[12px] text-white/40 mt-2">
              {error} Please confirm that the Django server is running.
            </p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="bg-card border border-[#D4AF37]/10 rounded-xl px-6 py-14 text-center">
            <p className="font-['Rajdhani',sans-serif] font-bold text-[24px] text-white">
              No prediction packages found
            </p>
            <p className="text-[12px] text-white/35 mt-2">
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
                locked={!authed && index >= 1}
              />
            ))}
          </div>
        )}

        {!authed && (
          <div className="mt-10 bg-card border border-[#D4AF37]/18 rounded-xl p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-[#D4AF37]/12 border border-[#D4AF37]/25 flex items-center justify-center mx-auto mb-4">
              <Lock size={20} className="text-[#D4AF37]" />
            </div>
            <h3 className="font-['Rajdhani',sans-serif] font-bold text-[26px] text-white mb-2">5 MORE PICKS TODAY</h3>
            <p className="text-[13px] text-white/35 mb-6">Subscribe to access the full daily intelligence feed</p>
            <GoldBtn onClick={() => nav("register")} size="md">Get Lab Access <ArrowRight size={14} /></GoldBtn>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MATCH CENTRE PAGE ────────────────────────────────────────────────────────

function MatchCentrePage() {
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

            <p className="text-white/45 text-[14px] sm:text-[15px] leading-relaxed max-w-2xl">
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
                    <p className="text-[11px] text-white/30 leading-relaxed">
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
                <p className="text-[11px] text-white/25">
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

                  <p className="text-[12px] text-white/30 leading-relaxed max-w-md mx-auto">
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
                          <p className="text-[11px] text-white/30 leading-relaxed">
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
                          <p className="text-[11px] text-white/30 leading-relaxed">
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
            <p className="text-[11px] text-white/30 leading-relaxed">
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

function AboutPage({ nav }: { nav: (p: Page) => void }) {
  const team = [
    { name: "Lead Football Analyst", role: "Daily Selection & Review", bio: "Responsible for selecting the strongest daily games, assigning confidence levels and writing clear reasons for each published pick.", initials: "LA" },
    { name: "Product & Technology", role: "Platform Operations", bio: "Builds and maintains the Bet Lab website, member access, payments, notifications and future mobile applications.", initials: "PT" },
    { name: "Results Verification", role: "Transparency", bio: "Updates completed selections and preserves the full public record of wins, losses and void results.", initials: "RV" },
    { name: "Member Support", role: "Customer Experience", bio: "Helps members with account access, subscriptions, payments and general platform questions.", initials: "MS" },
  ];

  return (
    <div className="pt-[60px]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 pb-24">
        <div className="mb-14">
          <SectionEyebrow>Our Story</SectionEyebrow>
          <h1 className="font-['Rajdhani',sans-serif] font-bold text-[56px] sm:text-[68px] text-white leading-none mb-6">
            WE BUILT BET LAB<br /><span className="text-[#D4AF37]">FOR SMARTER PICKS.</span>
          </h1>
          <p className="text-white/45 max-w-2xl text-[15px] leading-relaxed">
            Bet Lab was created to give a skilled football analyst a simple, professional platform for publishing carefully selected daily games. Members get clear categories, confidence levels, useful analysis and a transparent results history.
          </p>
        </div>

        {/* Mission */}
        <div className="relative border border-[#D4AF37]/18 rounded-xl p-8 sm:p-12 mb-14 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1A2845]/60 to-[#111C2E] pointer-events-none" />
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
          <div className="relative text-center max-w-2xl mx-auto">
            <p className="font-[JetBrains_Mono,monospace] text-[9px] text-[#D4AF37] uppercase tracking-widest mb-4">Mission Statement</p>
            <p className="font-['Rajdhani',sans-serif] font-bold text-[22px] text-white/80 leading-relaxed">
              &ldquo;To build the most transparent, data-driven football intelligence platform in the world — where every prediction is traceable, every result is accountable, and every subscriber makes more informed decisions.&rdquo;
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="grid sm:grid-cols-3 gap-4 mb-14">
          {[
            { icon: <Shield size={18} />, title: "Radical Transparency", desc: "Every prediction, win or loss, is permanently logged. We never delete poor results or rewrite history." },
            { icon: <Activity size={18} />, title: "Data Over Opinion", desc: "Selections combine football knowledge, form, available statistics and disciplined judgement. We avoid exaggerated promises and publish only the analyst’s preferred games." },
            { icon: <Award size={18} />, title: "Analytical Rigour", desc: "Every selection is reviewed before publication, assigned to a clear category and recorded permanently after the match." },
          ].map((v, i) => (
            <div key={i} className="bg-card border border-[#D4AF37]/8 rounded-lg p-6">
              <div className="w-9 h-9 rounded bg-[#D4AF37]/8 border border-[#D4AF37]/15 flex items-center justify-center text-[#D4AF37] mb-4">{v.icon}</div>
              <h3 className="font-['Rajdhani',sans-serif] font-bold text-[20px] text-white mb-1.5">{v.title}</h3>
              <p className="text-[12px] text-white/40 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>

        {/* Team */}
        <div className="mb-14">
          <h2 className="font-['Rajdhani',sans-serif] font-bold text-[36px] text-white text-center mb-8">HOW BET LAB OPERATES</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {team.map((t, i) => (
              <div key={i} className="bg-card border border-[#D4AF37]/8 rounded-lg p-5 flex gap-4">
                <div className="w-11 h-11 rounded-lg bg-[#D4AF37]/12 border border-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-[#D4AF37] text-[12px]">{t.initials}</span>
                </div>
                <div>
                  <h3 className="font-['Rajdhani',sans-serif] font-bold text-[18px] text-white leading-none">{t.name}</h3>
                  <p className="font-[JetBrains_Mono,monospace] text-[9px] text-[#D4AF37] uppercase tracking-widest mb-2 mt-0.5">{t.role}</p>
                  <p className="text-[12px] text-white/40 leading-relaxed">{t.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Responsible notice */}
        <div className="bg-[#162036] border border-[#D4AF37]/8 rounded-lg p-5 flex gap-3">
          <AlertCircle size={16} className="text-[#D4AF37]/50 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-['Rajdhani',sans-serif] font-bold text-[16px] text-white mb-1">Responsible Use</p>
            <p className="text-[12px] text-white/35 leading-relaxed">
              Bet Lab is a sports analytics platform. We provide research and predictions. We are not a bookmaker and do not encourage irresponsible gambling. Please bet responsibly.
              If you have concerns, visit <span className="text-[#D4AF37]">begambleaware.org</span>. 18+ only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CONTACT PAGE ─────────────────────────────────────────────────────────────

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  return (
    <div className="pt-[60px]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 pb-24">
        <div className="mb-12">
          <SectionEyebrow>Get In Touch</SectionEyebrow>
          <h1 className="font-['Rajdhani',sans-serif] font-bold text-[52px] text-white">CONTACT US</h1>
        </div>

        <div className="grid lg:grid-cols-[1fr_280px] gap-8">
          {/* Form */}
          <div className="bg-card border border-[#D4AF37]/12 rounded-xl p-7">
            {sent ? (
              <div className="py-14 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-500/12 border border-emerald-500/25 flex items-center justify-center mx-auto mb-4">
                  <Check size={24} className="text-emerald-400" />
                </div>
                <h3 className="font-['Rajdhani',sans-serif] font-bold text-[26px] text-white mb-2">Message Sent</h3>
                <p className="text-[12px] text-white/35">We&apos;ll respond within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={e => { e.preventDefault(); setSent(true); }} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-widest text-white/30 mb-1.5">Name</label>
                    <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Your name"
                      className="w-full bg-[#162036] border border-[#D4AF37]/12 rounded px-3.5 py-2.5 text-[13px] text-white placeholder-white/18 focus:outline-none focus:border-[#D4AF37]/40 transition-colors" />
                  </div>
                  <div>
                    <label className="block font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-widest text-white/30 mb-1.5">Email</label>
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="you@example.com"
                      className="w-full bg-[#162036] border border-[#D4AF37]/12 rounded px-3.5 py-2.5 text-[13px] text-white placeholder-white/18 focus:outline-none focus:border-[#D4AF37]/40 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-widest text-white/30 mb-1.5">Subject</label>
                  <input type="text" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required placeholder="How can we help?"
                    className="w-full bg-[#162036] border border-[#D4AF37]/12 rounded px-3.5 py-2.5 text-[13px] text-white placeholder-white/18 focus:outline-none focus:border-[#D4AF37]/40 transition-colors" />
                </div>
                <div>
                  <label className="block font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-widest text-white/30 mb-1.5">Message</label>
                  <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required rows={6} placeholder="Tell us more..."
                    className="w-full bg-[#162036] border border-[#D4AF37]/12 rounded px-3.5 py-2.5 text-[13px] text-white placeholder-white/18 focus:outline-none focus:border-[#D4AF37]/40 transition-colors resize-none" />
                </div>
                <GoldBtn full size="md">
                  Send Message <Send size={13} />
                </GoldBtn>
              </form>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-card border border-[#D4AF37]/8 rounded-xl p-5">
              <h3 className="font-['Rajdhani',sans-serif] font-bold text-[18px] text-white mb-4">Contact Details</h3>
              {[
                { icon: <Mail size={14} />, label: "General", val: "hello@betlab.io" },
                { icon: <Users size={14} />, label: "Partnerships", val: "partners@betlab.io" },
                { icon: <Globe size={14} />, label: "Press", val: "press@betlab.io" },
              ].map((c, i) => (
                <div key={i} className="flex items-center gap-3 py-3 border-b border-white/[0.04] last:border-0">
                  <div className="w-7 h-7 rounded bg-[#D4AF37]/8 flex items-center justify-center text-[#D4AF37] flex-shrink-0">{c.icon}</div>
                  <div>
                    <p className="font-[JetBrains_Mono,monospace] text-[9px] text-white/25 uppercase tracking-widest">{c.label}</p>
                    <p className="text-[12px] text-white/60 mt-0.5">{c.val}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-card border border-[#D4AF37]/8 rounded-xl p-5">
              <h3 className="font-['Rajdhani',sans-serif] font-bold text-[16px] text-white mb-2">Response Time</h3>
              <p className="text-[12px] text-white/35 leading-relaxed mb-3">We respond to all enquiries within 24 hours on business days.</p>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-[JetBrains_Mono,monospace] text-[9px] text-emerald-400">Support online now</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [authed, setAuthed] = useState(false);

  const nav = (p: Page) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isDash = page === "dashboard";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar page={page} nav={nav} authed={authed} setAuthed={setAuthed} />

      <div className={cn("animate-fade-in")}>
        {page === "home" && <HomePage nav={nav} />}
        {page === "pricing" && <PricingPage nav={nav} />}
        {page === "login" && <AuthPage mode="login" nav={nav} setAuthed={setAuthed} />}
        {page === "register" && <AuthPage mode="register" nav={nav} setAuthed={setAuthed} />}
        {page === "dashboard" && <DashboardPage nav={nav} />}
        {page === "predictions" && <PredictionsPage nav={nav} authed={authed} />}
        {page === "results" && <MatchCentrePage />}
        {page === "about" && <AboutPage nav={nav} />}
        {page === "contact" && <ContactPage />}
      </div>

      {!isDash && <Footer nav={nav} />}
    </div>
  );
}
