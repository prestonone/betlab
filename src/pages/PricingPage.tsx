import { useState } from "react";
import { Check, ChevronDown, Minus } from "lucide-react";
import { Page, cn, GoldBtn, SectionEyebrow } from "../app/shared";
import { initializePayment } from "../services/payments";
import { setBillingCountry } from "../services/subscriptions";

export default function PricingPage({ nav, authed }: { nav: (p: Page) => void; authed: boolean }) {
  const [checkoutPlan, setCheckoutPlan] = useState("");
  const [checkoutError, setCheckoutError] = useState("");

  const checkout = async (code: string, name: string) => {
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
      const payment = await initializePayment(code);
      window.location.assign(payment.authorization_url);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Unable to start checkout.");
      setCheckoutPlan("");
    }
  };

  const plans = [
    {
      code: "starter-pass", name: "Daily Pass", price: "₦1,000", period: "/day", picks: "24-hour access",
      inc: ["All daily Lab picks", "Banker and Rollover", "Results access", "Instant activation"],
      exc: ["Weekend Mega", "Monthly performance dashboard"], highlight: false,
    },
    {
      code: "weekly-lab", name: "Weekly Lab", price: "₦3,500", period: "/week", picks: "7-day access",
      inc: ["All prediction categories", "Daily analysis notes", "Sure 2 and Sure 5", "Rollover updates", "Complete results log"],
      exc: ["Monthly performance dashboard"], highlight: true,
    },
    {
      code: "pro-lab", name: "Monthly Lab", price: "₦10,000", period: "/month", picks: "30-day access",
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
