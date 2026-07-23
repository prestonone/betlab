import React, { useEffect, useMemo, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Settings, Menu, X, Target, Activity, CheckCircle2, XCircle, Minus, Flame, LayoutDashboard, LineChart, History, MailWarning, ShieldCheck, Download } from "lucide-react";
import { Page, DashSection, cn, GOLD, Chip, ApiPredictionCard, displayNameFor } from "../app/shared";
import { useAuth } from "../contexts/AuthContext";
import { useCurrentSubscription } from "../hooks/useCurrentSubscription";
import { resendVerificationEmail } from "../services/auth";
import { verifyPayment } from "../services/payments";
import { getPredictions, type Prediction as ApiPrediction } from "../services/predictions";
import { getMyConsent, updateMarketingConsent, type MyConsentData } from "../services/legal";
import { ApiError } from "../services/api";

function combinedOdds(pred: ApiPrediction): number {
  return pred.selections.reduce((total, s) => total * Number(s.odds), 1);
}

function unitProfit(pred: ApiPrediction): number {
  if (pred.result_status === "won") return Math.round((combinedOdds(pred) - 1) * 100);
  if (pred.result_status === "lost") return -100;
  return 0;
}

function earliestKickoff(pred: ApiPrediction): Date | null {
  const times = pred.selections
    .map(s => new Date(s.match_time))
    .filter(d => !Number.isNaN(d.getTime()));
  if (times.length === 0) return null;
  return new Date(Math.min(...times.map(d => d.getTime())));
}

function greetingForHour(hour: number): string {
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage({ nav }: { nav: (p: Page) => void }) {
  const [section, setSection] = useState<DashSection>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<{
    kind: "pending" | "success" | "error";
    message: string;
  } | null>(null);

  const { user } = useAuth();
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const resendVerification = async () => {
    setResendState("sending");
    try {
      await resendVerificationEmail();
      setResendState("sent");
    } catch {
      setResendState("error");
    }
  };

  const {
    subscription,
    hasSubscription,
    isLoading,
    refreshSubscription,
  } = useCurrentSubscription();

  const [predictions, setPredictions] = useState<ApiPrediction[]>([]);
  const [predictionsError, setPredictionsError] = useState("");
  const greeting = greetingForHour(new Date().getHours());

  useEffect(() => {
    let active = true;
    getPredictions()
      .then(data => { if (active) setPredictions(data); })
      .catch(() => { if (active) setPredictionsError("Unable to load predictions."); });
    return () => { active = false; };
  }, []);

  const stats = useMemo(() => {
    const settled = predictions
      .filter(p => p.result_status !== "pending")
      .sort((a, b) => (earliestKickoff(a)?.getTime() ?? 0) - (earliestKickoff(b)?.getTime() ?? 0));
    const decided = settled.filter(p => p.result_status !== "void");
    const won = decided.filter(p => p.result_status === "won");

    const winRate = decided.length > 0 ? Math.round((won.length / decided.length) * 100) : 0;
    const totalProfit = settled.reduce((sum, p) => sum + unitProfit(p), 0);
    const roi = settled.length > 0 ? +(totalProfit / settled.length).toFixed(1) : 0;

    let streak = 0;
    for (let i = decided.length - 1; i >= 0; i--) {
      if (decided[i].result_status === "won") streak++;
      else break;
    }

    const byDay = new Map<string, ApiPrediction[]>();
    for (const p of settled) {
      const day = earliestKickoff(p);
      const key = day ? day.toISOString().slice(0, 10) : "unknown";
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key)!.push(p);
    }
    const days = Array.from(byDay.keys()).sort();

    let cumWon = 0;
    let cumDecided = 0;
    let cumProfit = 0;
    let cumCount = 0;
    const trend = days.map(day => {
      for (const p of byDay.get(day)!) {
        if (p.result_status !== "void") {
          cumDecided++;
          if (p.result_status === "won") cumWon++;
        }
        cumProfit += unitProfit(p);
        cumCount++;
      }
      return {
        day: new Date(day).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
        winRate: cumDecided > 0 ? Math.round((cumWon / cumDecided) * 100) : 0,
        roi: cumCount > 0 ? +(cumProfit / cumCount).toFixed(1) : 0,
      };
    });

    const leagueMap = new Map<string, { won: number; decided: number; count: number }>();
    for (const p of settled) {
      const leagues = new Set(p.selections.map(s => s.league));
      for (const league of leagues) {
        const entry = leagueMap.get(league) ?? { won: 0, decided: 0, count: 0 };
        entry.count++;
        if (p.result_status !== "void") {
          entry.decided++;
          if (p.result_status === "won") entry.won++;
        }
        leagueMap.set(league, entry);
      }
    }
    const leaguePerf = Array.from(leagueMap.entries())
      .map(([league, e]) => ({
        league,
        winRate: e.decided > 0 ? Math.round((e.won / e.decided) * 100) : 0,
        predictions: e.count,
      }))
      .sort((a, b) => b.predictions - a.predictions)
      .slice(0, 6);

    return {
      settled,
      todaysPicks: predictions.filter(p => p.result_status === "pending"),
      winRate,
      roi,
      streak,
      totalSettled: settled.length,
      trend,
      leaguePerf,
    };
  }, [predictions]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") !== "callback") return;

    const reference = params.get("reference") ?? params.get("trxref");
    if (!reference) {
      setPaymentNotice({ kind: "error", message: "Payment could not be verified because the reference is missing." });
      return;
    }

    let active = true;
    setPaymentNotice({ kind: "pending", message: "Verifying your payment securely..." });
    void verifyPayment(reference)
      .then(async (payment) => {
        if (!active) return;
        if (payment.status === "pending") {
          setPaymentNotice({
            kind: "pending",
            message: "Payment confirmation is pending. Refresh shortly while Paystack completes processing.",
          });
          return;
        }
        await refreshSubscription();
        setPaymentNotice({
          kind: "success",
          message: `${payment.plan_name} is now active.`,
        });
        window.history.replaceState(null, "", "/dashboard");
      })
      .catch((error) => {
        if (!active) return;
        setPaymentNotice({
          kind: "error",
          message: error instanceof Error ? error.message : "Payment verification failed.",
        });
      });

    return () => { active = false; };
  }, [refreshSubscription]);

  const navItems: { icon: React.ReactNode; label: string; s: DashSection }[] = [
    { icon: <LayoutDashboard size={15} />, label: "Overview", s: "overview" },
    { icon: <History size={15} />, label: "Results", s: "results" },
    { icon: <LineChart size={15} />, label: "Performance", s: "performance" },
    { icon: <ShieldCheck size={15} />, label: "Legal & Privacy", s: "legal" },
  ];

  const [consent, setConsent] = useState<MyConsentData | null>(null);
  const [consentError, setConsentError] = useState("");
  const [isUpdatingMarketing, setIsUpdatingMarketing] = useState(false);

  useEffect(() => {
    if (section !== "legal" || consent || consentError) return;
    let active = true;
    getMyConsent()
      .then(data => { if (active) setConsent(data); })
      .catch((requestError: unknown) => {
        if (!active) return;
        setConsentError(requestError instanceof ApiError ? requestError.message : "Unable to load your legal & privacy record.");
      });
    return () => { active = false; };
  }, [section, consent, consentError]);

  const toggleMarketing = async () => {
    if (!consent) return;
    setIsUpdatingMarketing(true);
    try {
      const updated = await updateMarketingConsent(consent.marketing_consent.status !== "opted_in");
      setConsent({ ...consent, marketing_consent: updated });
    } catch {
      setConsentError("Could not update your marketing preference. Please try again.");
    } finally {
      setIsUpdatingMarketing(false);
    }
  };

  const accessEndsAt = subscription?.status === "grace"
    ? subscription.grace_ends_at
    : subscription?.expires_at;
  const daysLeft = accessEndsAt
    ? Math.max(0, Math.ceil((new Date(accessEndsAt).getTime() - Date.now()) / 86_400_000))
    : 0;
  const expiryPct = subscription
    ? Math.min(100, Math.round((daysLeft / subscription.duration_days) * 100))
    : 0;
  const expiryLabel = accessEndsAt
    ? new Date(accessEndsAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "—";

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
                <p className="font-['Rajdhani',sans-serif] font-bold text-[18px] text-[#D4AF37]">
                  {isLoading ? "Loading..." : subscription?.plan_name ?? "No active plan"}
                </p>
              </div>
              <Chip label="Active" variant="emerald" />
            </div>
            {/* Expiry bar */}
            <div className="mb-2">
              <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                <div className="h-full bg-[#D4AF37]/50 rounded-full" style={{ width: `${expiryPct}%` }} />
              </div>
            </div>
            <p className="font-[JetBrains_Mono,monospace] text-[9px] text-white/25">
              {hasSubscription ? `Expires ${expiryLabel} · ${daysLeft}d left` : "Choose a plan to unlock Lab access"}
            </p>
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
          {paymentNotice && (
            <div className={cn(
              "mb-6 rounded-lg border px-4 py-3 text-[12px]",
              paymentNotice.kind === "success" && "border-emerald-500/25 bg-emerald-500/8 text-emerald-300",
              paymentNotice.kind === "pending" && "border-[#D4AF37]/25 bg-[#D4AF37]/8 text-[#D4AF37]",
              paymentNotice.kind === "error" && "border-rose-500/25 bg-rose-500/8 text-rose-300",
            )} role="status">
              {paymentNotice.message}
            </div>
          )}
          {user && !user.is_email_verified && (
            <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-[#D4AF37]/25 bg-[#D4AF37]/8 px-4 py-3 text-[12px] text-[#D4AF37]" role="status">
              <MailWarning size={15} className="flex-shrink-0" />
              <span className="flex-1">
                {resendState === "sent"
                  ? "Verification email sent — check your inbox."
                  : "Please verify your email address to secure your account."}
              </span>
              {resendState !== "sent" && (
                <button
                  onClick={resendVerification}
                  disabled={resendState === "sending"}
                  className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-widest text-[#D4AF37] underline underline-offset-2 hover:text-[#D4AF37]/80 disabled:opacity-50 cursor-pointer"
                >
                  {resendState === "sending" ? "Sending..." : resendState === "error" ? "Retry" : "Resend email"}
                </button>
              )}
            </div>
          )}
          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <p className="font-[JetBrains_Mono,monospace] text-[9px] text-white/25 uppercase tracking-[0.2em] mb-1">Dashboard · {section}</p>
              <h1 className="font-['Rajdhani',sans-serif] font-bold text-[38px] text-white leading-none">
                {greeting}, <span className="text-[#D4AF37]">{(displayNameFor(user).split(" ")[0]) || "there"}.</span>
              </h1>
              <p className="text-[12px] text-white/35 mt-1">
                {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · {stats.todaysPicks.length} predictions live today
              </p>
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
              { label: "Today's Picks", value: `${stats.todaysPicks.length}`, sub: `${stats.totalSettled} settled all-time`, icon: <Target size={15} />, c: "text-[#D4AF37]" },
              { label: "Win Rate", value: `${stats.winRate}%`, sub: "Won ÷ (won+lost)", icon: <TrendingUp size={15} />, c: "text-emerald-400" },
              { label: "Running ROI", value: `${stats.roi >= 0 ? "+" : ""}${stats.roi}%`, sub: "Flat-stake basis", icon: <Activity size={15} />, c: stats.roi >= 0 ? "text-emerald-400" : "text-rose-400" },
              { label: "Win Streak", value: `${stats.streak}W`, sub: "Consecutive wins", icon: <Flame size={15} />, c: "text-[#D4AF37]" },
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
                    <Chip label={`${stats.trend.length} days tracked`} variant="emerald" />
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={stats.trend} margin={{ top: 2, right: 2, bottom: 0, left: -22 }}>
                      <defs>
                        <linearGradient id="gGold" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={GOLD} stopOpacity={0.25} />
                          <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10, fontFamily: "JetBrains Mono,monospace" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10, fontFamily: "JetBrains Mono,monospace" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                      <Tooltip contentStyle={{ background: "#111C2E", border: "1px solid rgba(212,175,55,0.18)", borderRadius: 6, fontSize: 11, fontFamily: "JetBrains Mono,monospace" }} itemStyle={{ color: GOLD }} labelStyle={{ color: "rgba(255,255,255,0.4)" }} />
                      <Area type="monotone" dataKey="winRate" stroke={GOLD} strokeWidth={1.5} fill="url(#gGold)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Recent results mini */}
                <div className="bg-card border border-[#D4AF37]/8 rounded-lg p-5">
                  <h3 className="font-['Rajdhani',sans-serif] font-bold text-[18px] text-white mb-4">Recent Results</h3>
                  <div className="space-y-3">
                    {stats.settled.length === 0 && (
                      <p className="text-[11px] text-white/25">No settled predictions yet.</p>
                    )}
                    {stats.settled.slice(-7).reverse().map(p => {
                      const profit = unitProfit(p);
                      const kickoff = earliestKickoff(p);
                      return (
                        <div key={p.id} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {p.result_status === "won"
                              ? <CheckCircle2 size={12} className="text-emerald-400 flex-shrink-0" />
                              : p.result_status === "lost"
                              ? <XCircle size={12} className="text-rose-400 flex-shrink-0" />
                              : <Minus size={12} className="text-white/20 flex-shrink-0" />
                            }
                            <div className="min-w-0">
                              <p className="text-[11px] text-white/55 truncate">{p.title}</p>
                              <p className="font-[JetBrains_Mono,monospace] text-[9px] text-white/20">
                                {kickoff ? kickoff.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—"}
                              </p>
                            </div>
                          </div>
                          <span className={cn("font-[JetBrains_Mono,monospace] text-[11px] font-bold flex-shrink-0",
                            profit > 0 ? "text-emerald-400" : profit < 0 ? "text-rose-400" : "text-white/20")}>
                            {profit > 0 ? `+${profit}` : profit === 0 ? "—" : profit}
                          </span>
                        </div>
                      );
                    })}
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
                  <button onClick={() => nav("predictions")} className="font-[JetBrains_Mono,monospace] text-[9px] text-[#D4AF37]/60 hover:text-[#D4AF37] uppercase tracking-widest cursor-pointer">View all →</button>
                </div>
                {predictionsError && <p className="text-[12px] text-rose-400">{predictionsError}</p>}
                {!predictionsError && stats.todaysPicks.length === 0 && (
                  <p className="text-[12px] text-white/30">No live predictions right now — check back soon.</p>
                )}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.todaysPicks.slice(0, 3).map(p => <ApiPredictionCard key={p.id} pred={p} />)}
                </div>
              </div>
            </div>
          )}

          {/* ── Section: Results ────────────────────────────── */}
          {section === "results" && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-['Rajdhani',sans-serif] font-bold text-[26px] text-white">Results Log</h2>
                <div className="flex items-center gap-2">
                  <span className="font-[JetBrains_Mono,monospace] text-[11px] text-emerald-400">{stats.settled.filter(p => p.result_status === "won").length}W</span>
                  <span className="text-white/15">/</span>
                  <span className="font-[JetBrains_Mono,monospace] text-[11px] text-rose-400">{stats.settled.filter(p => p.result_status === "lost").length}L</span>
                  <span className="text-white/15">/</span>
                  <span className="font-[JetBrains_Mono,monospace] text-[11px] text-white/25">{stats.settled.filter(p => p.result_status === "void").length}V</span>
                  <span className="font-[JetBrains_Mono,monospace] text-[9px] text-white/20 ml-1">(all-time)</span>
                </div>
              </div>
              <div className="bg-card border border-[#D4AF37]/8 rounded-lg overflow-hidden">
                {stats.settled.length === 0 && (
                  <p className="text-[12px] text-white/30 px-5 py-6">No settled predictions yet.</p>
                )}
                {stats.settled.slice().reverse().map((p, i) => {
                  const profit = unitProfit(p);
                  const kickoff = earliestKickoff(p);
                  const leagues = Array.from(new Set(p.selections.map(s => s.league))).join(", ");
                  return (
                    <div key={p.id} className={cn(
                      "flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.015] transition-colors",
                      i < stats.settled.length - 1 && "border-b border-white/[0.04]"
                    )}>
                      <span className="font-[JetBrains_Mono,monospace] text-[10px] text-white/25 w-12 flex-shrink-0">
                        {kickoff ? kickoff.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-white/70 truncate">{p.title}</p>
                        <p className="font-[JetBrains_Mono,monospace] text-[9px] text-white/25 mt-0.5">{p.category.name} · {leagues}</p>
                      </div>
                      <span className="font-[JetBrains_Mono,monospace] text-[11px] text-white/40 flex-shrink-0">{combinedOdds(p).toFixed(2)}</span>
                      <div className="flex items-center gap-1.5 w-14 flex-shrink-0">
                        <div className={cn("w-1.5 h-1.5 rounded-full", p.result_status === "won" ? "bg-emerald-500" : p.result_status === "lost" ? "bg-rose-500" : "bg-white/15")} />
                        <span className={cn("font-[JetBrains_Mono,monospace] text-[10px] uppercase", p.result_status === "won" ? "text-emerald-400" : p.result_status === "lost" ? "text-rose-400" : "text-white/20")}>
                          {p.result_status}
                        </span>
                      </div>
                      <span className={cn("font-[JetBrains_Mono,monospace] text-[11px] font-bold w-14 text-right flex-shrink-0",
                        profit > 0 ? "text-emerald-400" : profit < 0 ? "text-rose-400" : "text-white/20")}>
                        {profit > 0 ? `+${profit}u` : profit === 0 ? "VOID" : `${profit}u`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Section: Performance ────────────────────────── */}
          {section === "performance" && (
            <div className="space-y-5">
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { label: "Total Predictions", value: stats.totalSettled.toLocaleString(), sub: "Settled, all-time" },
                  { label: "Overall Win Rate", value: `${stats.winRate}%`, sub: "All markets, all leagues" },
                  { label: "Total ROI", value: `${stats.roi >= 0 ? "+" : ""}${stats.roi}%`, sub: "Flat-stake, 1 unit/pred" },
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
                  <h3 className="font-['Rajdhani',sans-serif] font-bold text-[20px] text-white">Cumulative ROI</h3>
                  <Chip label="Flat stake" variant="ghost" />
                </div>
                {stats.trend.length === 0 ? (
                  <p className="text-[12px] text-white/30 py-10 text-center">Not enough settled predictions yet to chart a trend.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={stats.trend} margin={{ top: 2, right: 2, bottom: 0, left: -22 }}>
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
                )}
              </div>

              {/* League breakdown */}
              <div className="bg-card border border-[#D4AF37]/8 rounded-lg p-5">
                <h3 className="font-['Rajdhani',sans-serif] font-bold text-[20px] text-white mb-5">Win Rate by League</h3>
                <div className="space-y-3">
                  {stats.leaguePerf.length === 0 && (
                    <p className="text-[12px] text-white/30">No settled predictions yet.</p>
                  )}
                  {stats.leaguePerf.map(l => (
                    <div key={l.league} className="flex items-center gap-4">
                      <span className="font-[JetBrains_Mono,monospace] text-[10px] text-white/40 uppercase w-14 flex-shrink-0 truncate">{l.league}</span>
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

          {section === "legal" && (
            <div className="space-y-5">
              {consentError && (
                <p role="alert" className="text-[12px] text-red-400">{consentError}</p>
              )}

              {!consent && !consentError && (
                <p className="text-[12px] text-white/30">Loading your legal &amp; privacy record...</p>
              )}

              {consent && (
                <>
                  <div className="bg-card border border-[#D4AF37]/8 rounded-lg p-5">
                    <h3 className="font-['Rajdhani',sans-serif] font-bold text-[20px] text-white mb-1">Policies You've Accepted</h3>
                    <p className="text-[12px] text-white/35 mb-5">The most recent version of each policy you've agreed to, and when.</p>
                    {consent.acceptances.length === 0 ? (
                      <p className="text-[12px] text-white/30">No policy acceptances on record yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {consent.acceptances.map(a => (
                          <div key={a.policy_type} className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.05] last:border-0">
                            <div className="min-w-0">
                              <p className="text-[13px] text-white/75 truncate">{a.policy_type_display}</p>
                              <p className="font-[JetBrains_Mono,monospace] text-[9px] text-white/25 uppercase tracking-widest">
                                v{a.version} &middot; {new Date(a.accepted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                              </p>
                            </div>
                            <button
                              onClick={() => nav("legal")}
                              className="shrink-0 font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-widest text-[#D4AF37]/60 hover:text-[#D4AF37] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] transition-colors cursor-pointer"
                            >
                              View
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-card border border-[#D4AF37]/8 rounded-lg p-5">
                    <h3 className="font-['Rajdhani',sans-serif] font-bold text-[20px] text-white mb-1">Marketing Communications</h3>
                    <p className="text-[12px] text-white/35 mb-4">
                      {consent.marketing_consent.status === "opted_in"
                        ? "You're currently opted in to marketing emails."
                        : "You're currently opted out of marketing emails."}
                    </p>
                    <button
                      onClick={toggleMarketing}
                      disabled={isUpdatingMarketing}
                      className="font-[JetBrains_Mono,monospace] text-[10px] uppercase tracking-widest text-[#070E1A] bg-[#D4AF37] hover:bg-[#e0bd4a] disabled:opacity-50 rounded-full px-4 py-2 transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                    >
                      {isUpdatingMarketing
                        ? "Updating..."
                        : consent.marketing_consent.status === "opted_in" ? "Opt Out" : "Opt In"}
                    </button>
                  </div>

                  <div className="bg-card border border-[#D4AF37]/8 rounded-lg p-5">
                    <h3 className="font-['Rajdhani',sans-serif] font-bold text-[20px] text-white mb-1">Consent History</h3>
                    <p className="text-[12px] text-white/35 mb-4">A downloadable export of your full consent history is coming soon.</p>
                    <button
                      disabled
                      aria-disabled="true"
                      className="flex items-center gap-1.5 font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-widest text-white/25 border border-white/10 rounded-full px-4 py-2 cursor-not-allowed"
                    >
                      <Download size={12} aria-hidden="true" /> Download (Coming Soon)
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ─── PUBLIC PREDICTIONS PAGE ──────────────────────────────────────────────────
