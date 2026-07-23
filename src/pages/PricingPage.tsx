import { useEffect, useState } from "react";
import { Check, ChevronDown, Minus, X } from "lucide-react";
import ConsentCheckbox from "../components/legal/ConsentCheckbox";
import PolicyLink from "../components/legal/PolicyLink";
import { Page, cn, GoldBtn, SectionEyebrow } from "../app/shared";
import { initializePayment } from "../services/payments";
import { getPlans, setBillingCountry } from "../services/subscriptions";
import type { Plan } from "../types/subscriptions";

const PLAN_MARKETING: Record<string, { period: string; inc: string[]; exc: string[]; highlight: boolean }> = {
  "starter-pass": {
    period: "/day",
    inc: ["All daily Lab picks", "Banker and Rollover", "Results access", "Instant activation"],
    exc: ["Weekend Mega", "Monthly performance dashboard"],
    highlight: false,
  },
  "weekly-lab": {
    period: "/week",
    inc: ["All prediction categories", "Daily analysis notes", "Sure 2 and Sure 5", "Rollover updates", "Complete results log"],
    exc: ["Monthly performance dashboard"],
    highlight: true,
  },
  "pro-lab": {
    period: "/month",
    inc: ["Everything in Weekly Lab", "Weekend Mega and Jackpot", "Performance dashboard", "Priority notifications", "Best member value"],
    exc: ["Quarterly performance report"],
    highlight: false,
  },
  "quarterly-elite": {
    period: "/quarter",
    inc: ["Everything in Monthly Lab", "Quarterly performance report", "Early access to new markets", "Priority support"],
    exc: ["Direct analyst access"],
    highlight: false,
  },
  "half-year-elite": {
    period: "/6 months",
    inc: ["Everything in Quarterly Elite", "Exclusive mid-season briefings", "Direct analyst access", "Locked-in renewal rate"],
    exc: ["Founding member badge"],
    highlight: false,
  },
  "founders-circle": {
    period: "/year",
    inc: ["Everything in Half-Year Elite", "Full year of Lab access", "Founding member badge", "Lifetime price lock", "Direct line to the analyst desk"],
    exc: [],
    highlight: false,
  },
};

export default function PricingPage({ nav, authed }: { nav: (p: Page) => void; authed: boolean }) {
  const [checkoutPlan, setCheckoutPlan] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [apiPlans, setApiPlans] = useState<Plan[]>([]);
  const [plansError, setPlansError] = useState("");
  const [pendingPlan, setPendingPlan] = useState<{ code: string; name: string } | null>(null);
  const [refundAccepted, setRefundAccepted] = useState(false);

  useEffect(() => {
    let active = true;
    getPlans("NG")
      .then(data => { if (active) setApiPlans(data); })
      .catch(() => { if (active) setPlansError("Unable to load current pricing."); });
    return () => { active = false; };
  }, []);

  const checkout = async (code: string, name: string, acceptedRefundPolicy = false) => {
    if (!authed) {
      sessionStorage.setItem("betlab_checkout_plan", code);
      sessionStorage.setItem("betlab_checkout_plan_name", name);
      nav("register");
      return;
    }

    setCheckoutPlan(code);
    setCheckoutError("");
    try {
      await setBillingCountry("NG");
      const payment = await initializePayment(code, acceptedRefundPolicy);
      window.location.assign(payment.authorization_url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start checkout.";
      if (message.includes("Refund and Subscription Policy") && !acceptedRefundPolicy) {
        setCheckoutPlan("");
        setPendingPlan({ code, name });
        return;
      }
      setCheckoutError(message);
      setCheckoutPlan("");
    }
  };

  const confirmRefundAndCheckout = () => {
    if (!pendingPlan || !refundAccepted) return;
    const { code, name } = pendingPlan;
    setPendingPlan(null);
    setRefundAccepted(false);
    void checkout(code, name, true);
  };

  const plans = apiPlans
    .filter(p => p.code in PLAN_MARKETING)
    .map(p => ({
      code: p.code,
      name: p.name,
      price: `${p.currency_symbol}${Math.round(parseFloat(p.price)).toLocaleString()}`,
      picks: `${p.duration_days}-day access`,
      ...PLAN_MARKETING[p.code],
    }));

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
          <p className="text-white/40 mb-8 text-[14px]">From daily access to a full year of membership. Payments will be processed securely in Nigerian naira.</p>

        </div>

        {plansError && (
          <p role="alert" className="text-center text-[12px] text-rose-300 mb-8">{plansError}</p>
        )}
        {!plansError && plans.length === 0 && (
          <p className="text-center text-[12px] text-white/35 mb-8">Loading pricing...</p>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-20">
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
                    ? <GoldBtn onClick={() => void checkout(plan.code, plan.name)} full size="md">{checkoutPlan === plan.code ? "Opening checkout..." : "Get Lab Access"}</GoldBtn>
                    : <GoldBtn onClick={() => void checkout(plan.code, plan.name)} full size="md" outline>{checkoutPlan === plan.code ? "Opening checkout..." : "Get Lab Access"}</GoldBtn>
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

        {checkoutError && (
          <p role="alert" className="-mt-14 mb-16 text-center text-[12px] text-rose-300">
            {checkoutError}
          </p>
        )}

        {pendingPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setPendingPlan(null)}>
            <div className="bg-[#111C2E] border border-[#D4AF37]/20 rounded-xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-['Rajdhani',sans-serif] font-bold text-[20px] text-white">One more thing</h3>
                <button onClick={() => setPendingPlan(null)} className="text-white/30 hover:text-white/60 cursor-pointer"><X size={16} /></button>
              </div>
              <p className="text-[13px] text-white/60 mb-4">Before we take you to checkout for {pendingPlan.name}, please confirm:</p>
              <ConsentCheckbox id="pricing-refund-consent" checked={refundAccepted} onChange={setRefundAccepted}>
                I have reviewed the <PolicyLink slug="refund-policy">Refund and Subscription Policy</PolicyLink> and understand the applicable billing, cancellation and refund terms.
              </ConsentCheckbox>
              <GoldBtn onClick={confirmRefundAndCheckout} full size="md" className={cn("mt-5", !refundAccepted && "opacity-40 pointer-events-none")}>
                Continue to Checkout
              </GoldBtn>
            </div>
          </div>
        )}

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
          <p className="text-[13px] text-white/60 leading-relaxed pt-3">{a}</p>
        </div>
      )}
    </div>
  );
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
