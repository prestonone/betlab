import React, { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Settings, Menu, X, Target, Activity, CheckCircle2, XCircle, Minus, Flame, LayoutDashboard, LineChart, History, MailWarning } from "lucide-react";
import { Page, DashSection, PREDICTIONS, RESULTS, PERF_DATA, LEAGUE_PERF, USER, cn, GOLD, Chip, PredCard } from "../app/shared";
import { useAuth } from "../contexts/AuthContext";
import { useCurrentSubscription } from "../hooks/useCurrentSubscription";
import { resendVerificationEmail } from "../services/auth";
import { verifyPayment } from "../services/payments";

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
  ];

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
                  <button onClick={() => nav("predictions")} className="font-[JetBrains_Mono,monospace] text-[9px] text-[#D4AF37]/60 hover:text-[#D4AF37] uppercase tracking-widest cursor-pointer">View all →</button>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {PREDICTIONS.slice(0, 3).map(p => <PredCard key={p.id} pred={p} />)}
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
