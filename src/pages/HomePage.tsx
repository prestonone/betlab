import { useEffect, useState } from "react";
import { TrendingUp, Shield, Star, Check, Target, Users, Award, ArrowRight, Lock, Activity, ChevronRight, CheckCircle2 } from "lucide-react";
import { Page, PREDICTIONS, TESTIMONIALS, cn, useCounter, GoldBtn, SectionEyebrow, LiveTicker, PredCard } from "../app/shared";
import FootballAnimation from "../components/FootballAnimation";
import { getPlans } from "../services/subscriptions";
import type { Plan } from "../types/subscriptions";

const PLAN_MARKETING: Record<string, { sub: string; features: string[]; highlight: boolean }> = {
  "starter-pass": { sub: "/day", features: ["All daily Lab picks", "Banker and Rollover", "Results access", "Instant activation"], highlight: false },
  "weekly-lab": { sub: "/week", features: ["All prediction categories", "Daily analysis notes", "Priority updates", "Complete results log"], highlight: true },
  "pro-lab": { sub: "/month", features: ["Everything in Weekly Lab", "Weekend Mega and Jackpot", "Performance dashboard", "Best member value"], highlight: false },
};

export default function HomePage({ nav, authed }: { nav: (p: Page) => void; authed: boolean }) {
  const goToAccess = () => nav(authed ? "pricing" : "register");
  const wins = useCounter(6, 1200);
  const members = useCounter(3, 1200);

  const [apiPlans, setApiPlans] = useState<Plan[]>([]);

  useEffect(() => {
    let active = true;
    getPlans("NG").then(data => { if (active) setApiPlans(data); }).catch(() => {});
    return () => { active = false; };
  }, []);

  const features = [
    { icon: <Activity size={20} />, title: "Statistical Modelling", desc: "50+ variables per prediction — xG, press intensity, set-piece efficiency, travel fatigue, squad depth and form cycles." },
    { icon: <Target size={20} />, title: "Value Identification", desc: "Daily selections focus on markets where form, matchup context and available statistics support a clear position." },
    { icon: <Shield size={20} />, title: "Analyst Verification", desc: "Every selection is reviewed by the football analyst before publication. No automatic or unverified releases." },
    { icon: <Award size={20} />, title: "Full Accountability", desc: "Every prediction is logged permanently — wins and losses. No cherry-picking, no revisionism. Our record is fully public." },
    { icon: <Users size={20} />, title: "Coverage Depth", desc: "Coverage follows the strongest available fixtures across major leagues and competitions, rather than forcing picks every day." },
    { icon: <TrendingUp size={20} />, title: "Live Performance Tracking", desc: "Real-time ROI tracking, win rate trends and personal performance benchmarks in your subscriber dashboard." },
  ];

  const plans = apiPlans
    .filter(p => p.code in PLAN_MARKETING)
    .map(p => ({
      name: p.name,
      price: `${p.currency_symbol}${Math.round(parseFloat(p.price)).toLocaleString()}`,
      picks: `${p.duration_days}-day access`,
      ...PLAN_MARKETING[p.code],
    }));

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-[60px]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0B1220]" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent" />
        </div>

        <FootballAnimation />

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

              <p className="text-white text-[16px] leading-relaxed mb-8 max-w-[500px] animate-fade-up delay-200">
                Curated football predictions for members who want clear, disciplined daily selections. Every prediction is backed by deep statistical modelling and expert verification—not gut feeling or punditry.
              </p>

              <div className="flex flex-wrap gap-3 mb-14 animate-fade-up delay-300">
                <GoldBtn onClick={goToAccess} size="lg">
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
                      <p className="font-[JetBrains_Mono,monospace] text-[11px] text-white uppercase tracking-widest mt-1.5">{s.label}</p>
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
                <div className="absolute top-0 right-2 w-[340px] pointer-events-none animate-fan-back">
                  <PredCard pred={PREDICTIONS[2]} />
                </div>
                {/* Mid card */}
                <div className="absolute top-14 right-0 w-[340px] pointer-events-none animate-fan-mid">
                  <PredCard pred={PREDICTIONS[1]} />
                </div>
                {/* Front card */}
                <div className="absolute top-24 right-4 w-[350px] z-10 animate-fan-front">
                  <PredCard pred={PREDICTIONS[0]} />
                </div>
                {/* Result badge */}
                <div className="absolute bottom-14 right-0 z-20 bg-[#111C2E] border border-[#D4AF37]/20 rounded-lg px-4 py-2.5 shadow-2xl flex items-center gap-3">
                  <CheckCircle2 size={15} className="text-emerald-400" />
                  <div>
                    <p className="font-[JetBrains_Mono,monospace] text-[11px] text-white uppercase tracking-widest">Yesterday&apos;s record</p>
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
          <p className="text-white max-w-lg mx-auto text-[14px] leading-relaxed">
            We treat football prediction as a serious analytical discipline — building models that surface genuine edge, not noise.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div key={i} className="bg-card border border-[#D4AF37]/8 rounded-lg p-6 group hover:border-[#D4AF37]/20 transition-all duration-200 hover:bg-[#111C2E]">
              <div className="w-9 h-9 rounded bg-[#D4AF37]/10 border border-[#D4AF37]/15 flex items-center justify-center text-[#D4AF37] mb-4 group-hover:bg-[#D4AF37]/18 transition-colors">
                {f.icon}
              </div>
              <h3 className="font-['Rajdhani',sans-serif] font-bold text-[20px] text-white mb-1.5">{f.title}</h3>
              <p className="text-[16px] text-white leading-relaxed">{f.desc}</p>
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
            <p className="text-[15px] text-white mb-4 font-[JetBrains_Mono,monospace]">+ 3 more predictions available to subscribers today</p>
            <GoldBtn onClick={goToAccess} size="md">
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
          <p className="text-white max-w-md mx-auto text-[16px]">Choose the access period that works for you. Payments will be secured with Paystack.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((plan, i) => (
            <div key={i} className={cn(
              "relative border rounded-lg overflow-hidden transition-all duration-200",
              plan.highlight
                ? "bg-gradient-to-b from-[#1A2A45] to-[#111C2E] border-[#D4AF37]/40 shadow-[0_0_50px_rgba(212,175,55,0.1)]"
                : "bg-card border-[#D4AF37]/8 hover:border-[#D4AF37]/20"
            )}>
              {plan.highlight && <div className="h-[2px] bg-gradient-to-r from-[#D4AF37]/40 via-[#D4AF37] to-[#D4AF37]/40" />}
              <div className="p-7">
                {plan.highlight && (
                  <div className="mb-3">
                    <span className="font-[JetBrains_Mono,monospace] text-[11px] uppercase tracking-widest text-[#D4AF37] border border-[#D4AF37]/25 bg-[#D4AF37]/8 px-2.5 py-1 rounded-full">Most Popular</span>
                  </div>
                )}
                <h3 className="font-['Rajdhani',sans-serif] font-bold text-[24px] text-white mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="font-['Rajdhani',sans-serif] font-bold text-[42px] text-[#D4AF37] leading-none">{plan.price}</span>
                  <span className="text-white text-[15px]">{plan.sub}</span>
                </div>
                <p className="font-[JetBrains_Mono,monospace] text-[12px] text-white mb-7 uppercase tracking-wider">{plan.picks}</p>
                <ul className="space-y-2.5 mb-7">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-[16px] text-white">
                      <Check size={12} className="text-[#D4AF37] flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                {plan.highlight
                  ? <GoldBtn onClick={goToAccess} full size="md">Get Lab Access</GoldBtn>
                  : <GoldBtn onClick={goToAccess} full size="md" outline>Get Lab Access</GoldBtn>
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
                <p className="text-[16px] text-white leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/[0.04]">
                  <div className="w-8 h-8 rounded-full bg-[#D4AF37]/12 border border-[#D4AF37]/22 flex items-center justify-center">
                    <span className="font-bold text-[#D4AF37] text-[12px]">{t.avatar}</span>
                  </div>
                  <div>
                    <p className="text-[16px] font-medium text-white">{t.name}</p>
                    <p className="font-[JetBrains_Mono,monospace] text-[12px] text-white mt-0.5">{t.role}</p>
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
          <p className="text-white mb-8 max-w-md mx-auto text-[14px]">Create an account, choose an access plan and receive carefully selected daily football picks in one simple dashboard.</p>
          <GoldBtn onClick={goToAccess} size="lg">
            {authed ? "Choose Your Plan" : "Create Your Account"} <ArrowRight size={16} />
          </GoldBtn>
        </div>
      </section>
    </div>
  );
}

// ─── PRICING PAGE ─────────────────────────────────────────────────────────────
