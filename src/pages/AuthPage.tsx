import React, { useEffect, useState } from "react";
import { ArrowRight, Lock, Mail, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import AnimatedLogoMark from "../components/AnimatedLogoMark";
import ConsentCheckbox from "../components/legal/ConsentCheckbox";
import PolicyLink from "../components/legal/PolicyLink";
import ResponsibleUseWarning from "../components/legal/ResponsibleUseWarning";
import { Page, cn, GoldBtn } from "../app/shared";
import { useAuth } from "../contexts/AuthContext";
import { AuthApiError, requestPasswordReset } from "../services/auth";
import { initializePayment } from "../services/payments";
import { getPlans, setBillingCountry } from "../services/subscriptions";
import type { Plan } from "../types/subscriptions";

export default function AuthPage({ mode, nav }: {
  mode: "login" | "register";
  nav: (p: Page) => void;
}) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<"login" | "register">(mode);
  const [step, setStep] = useState(1);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", pass: "", plan: "weekly-lab" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [consent, setConsent] = useState({
    acceptedTerms: false,
    acknowledgedPrivacy: false,
    confirmedAgeAndRisk: false,
    acceptedRefundPolicy: false,
    marketingConsent: false,
  });

  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansError, setPlansError] = useState("");

  useEffect(() => {
    let active = true;
    getPlans("NG")
      .then(data => { if (active) setPlans(data); })
      .catch(() => { if (active) setPlansError("Unable to load plans."); });
    return () => { active = false; };
  }, []);

  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

  const submitForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotSubmitting(true);

    try {
      await requestPasswordReset(forgotEmail.trim());
      setForgotSent(true);
    } catch (requestError) {
      setForgotError(
        requestError instanceof AuthApiError || requestError instanceof Error
          ? requestError.message
          : "Unable to connect to Bet Lab. Please confirm the backend is running.",
      );
    } finally {
      setForgotSubmitting(false);
    }
  };

  const createAccount = async () => {
    const username =
      form.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "") ||
      form.email
        .split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_") ||
      "member";

    await register({
      username,
      email: form.email.trim(),
      password: form.pass,
      password_confirm: form.pass,
      accepted_terms: consent.acceptedTerms,
      acknowledged_privacy: consent.acknowledgedPrivacy,
      confirmed_age_and_risk: consent.confirmedAgeAndRisk,
      marketing_consent: consent.marketingConsent,
    });
  };

  const mandatoryConsentGiven = consent.acceptedTerms && consent.acknowledgedPrivacy && consent.confirmedAgeAndRisk;

  const go = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (tab === "register" && step === 1) {
      setStep(2);
      return;
    }

    setIsSubmitting(true);

    try {
      if (tab === "login") {
        await login({
          email: form.email.trim(),
          password: form.pass,
        });

        const storedPlan = sessionStorage.getItem("betlab_checkout_plan");
        if (storedPlan) {
          await setBillingCountry("NG");
          const payment = await initializePayment(storedPlan);
          sessionStorage.removeItem("betlab_checkout_plan");
          sessionStorage.removeItem("betlab_checkout_plan_name");
          window.location.assign(payment.authorization_url);
          return;
        }

        nav("dashboard");
      } else {
        if (!mandatoryConsentGiven) {
          setError("Please accept the Terms, Privacy Policy, and Risk Disclosure before continuing.");
          setIsSubmitting(false);
          return;
        }
        if (!consent.acceptedRefundPolicy) {
          setError("Please review and acknowledge the Refund and Subscription Policy before checking out.");
          setIsSubmitting(false);
          return;
        }

        await createAccount();
        await setBillingCountry("NG");
        const payment = await initializePayment(form.plan, true);
        window.location.assign(payment.authorization_url);
      }
    } catch (requestError) {
      if (requestError instanceof AuthApiError || requestError instanceof Error) {
        setError(requestError.message);
      } else {
        setError(
          "Unable to connect to Bet Lab. Please confirm the backend is running.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const continueFree = async () => {
    setError("");

    if (!mandatoryConsentGiven) {
      setError("Please accept the Terms, Privacy Policy, and Risk Disclosure before continuing.");
      return;
    }

    setIsSubmitting(true);

    try {
      await createAccount();
      sessionStorage.removeItem("betlab_checkout_plan");
      sessionStorage.removeItem("betlab_checkout_plan_name");
      nav("dashboard");
    } catch (requestError) {
      if (requestError instanceof AuthApiError || requestError instanceof Error) {
        setError(requestError.message);
      } else {
        setError(
          "Unable to connect to Bet Lab. Please confirm the backend is running.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-[60px] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <AnimatedLogoMark size={48} radius={10} className="mx-auto mb-4" />
          <h1 className="font-['Rajdhani',sans-serif] font-bold text-[36px] text-white mb-1">
            {tab === "login" ? "WELCOME BACK" : "JOIN BET LAB"}
          </h1>
          <p className="text-[15px] text-white">
            {tab === "login" ? "Access your intelligence feed" : "Simple signup · Secure payment"}
          </p>
        </div>

        {/* Tab toggle */}
        {!showForgot && (
          <div className="flex bg-card border border-[#D4AF37]/12 rounded-lg p-1 mb-6">
            {(["login", "register"] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setStep(1); setError(""); }} className={cn("flex-1 py-2 rounded text-[16px] font-medium transition-all capitalize cursor-pointer", tab === t ? "bg-[#D4AF37] text-[#070E1A]" : "text-white hover:text-white")}>
                {t === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>
        )}

        {showForgot ? (
          <div className="bg-card border border-[#D4AF37]/12 rounded-xl p-7">
            {forgotSent ? (
              <div className="text-center py-2">
                <div className="w-11 h-11 rounded-full bg-emerald-500/12 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={20} className="text-emerald-400" />
                </div>
                <p className="font-['Rajdhani',sans-serif] font-bold text-white text-lg mb-1">Check your email</p>
                <p className="text-[15px] text-white mb-5">If an account exists for that address, a reset link is on its way.</p>
                <button
                  type="button"
                  onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail(""); }}
                  className="text-[13px] text-[#D4AF37]/60 hover:text-[#D4AF37] cursor-pointer"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={submitForgot} className="space-y-4">
                <div>
                  <p className="font-['Rajdhani',sans-serif] font-bold text-[20px] text-white mb-1">Reset your password</p>
                  <p className="text-[15px] text-white mb-4">Enter your account email and we&apos;ll send you a reset link.</p>
                  <label className="block font-[JetBrains_Mono,monospace] text-[11px] uppercase tracking-widest text-white mb-1.5">Email</label>
                  <div className="relative">
                    <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white" />
                    <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required placeholder="you@example.com"
                      className="w-full bg-[#162036] border border-[#D4AF37]/12 rounded pl-9 pr-3.5 py-2.5 text-[16px] text-white placeholder-white/20 focus:outline-none focus:border-[#D4AF37]/45 transition-colors" />
                  </div>
                </div>

                {forgotError && (
                  <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-400/20 bg-red-400/5 px-3.5 py-3">
                    <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-400" />
                    <p className="text-[12px] leading-relaxed text-red-300">{forgotError}</p>
                  </div>
                )}

                <GoldBtn full size="md">
                  {forgotSubmitting ? "Please wait..." : "Send Reset Link"}
                  {!forgotSubmitting && <ArrowRight size={14} />}
                </GoldBtn>

                <button
                  type="button"
                  onClick={() => setShowForgot(false)}
                  className="w-full text-center text-[14px] text-white hover:text-[#D4AF37] cursor-pointer"
                >
                  Back to sign in
                </button>
              </form>
            )}
          </div>
        ) : (
        <div className="bg-card border border-[#D4AF37]/12 rounded-xl p-7">
          <form onSubmit={go} className="space-y-4">
            {tab === "register" && step === 1 && (
              <div>
                <label className="block font-[JetBrains_Mono,monospace] text-[11px] uppercase tracking-widest text-white mb-1.5">Full Name</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Your full name"
                  className="w-full bg-[#162036] border border-[#D4AF37]/12 rounded px-3.5 py-2.5 text-[16px] text-white placeholder-white/20 focus:outline-none focus:border-[#D4AF37]/45 transition-colors" />
              </div>
            )}
            {(tab === "login" || step === 1) && (
              <div>
                <label className="block font-[JetBrains_Mono,monospace] text-[11px] uppercase tracking-widest text-white mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white" />
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="you@example.com"
                    className="w-full bg-[#162036] border border-[#D4AF37]/12 rounded pl-9 pr-3.5 py-2.5 text-[16px] text-white placeholder-white/20 focus:outline-none focus:border-[#D4AF37]/45 transition-colors" />
                </div>
              </div>
            )}
            {(tab === "login" || step === 1) && (
              <div>
                <label className="block font-[JetBrains_Mono,monospace] text-[11px] uppercase tracking-widest text-white mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white" />
                  <input type={showPass ? "text" : "password"} value={form.pass} onChange={e => setForm({ ...form, pass: e.target.value })} required placeholder="••••••••"
                    className="w-full bg-[#162036] border border-[#D4AF37]/12 rounded pl-9 pr-9 py-2.5 text-[16px] text-white placeholder-white/20 focus:outline-none focus:border-[#D4AF37]/45 transition-colors" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white hover:text-[#D4AF37] cursor-pointer">
                    {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
            )}

            {tab === "register" && step === 2 && (
              <div className="space-y-3">
                <p className="font-['Rajdhani',sans-serif] font-bold text-[20px] text-white">Select Your Plan</p>
                {plansError && (
                  <p className="text-[12px] text-rose-400">{plansError}</p>
                )}
                {!plansError && plans.length === 0 && (
                  <p className="text-[15px] text-white">Loading plans...</p>
                )}
                {plans.map(p => (
                  <label key={p.code} className={cn("flex items-center gap-3.5 p-3.5 rounded-lg border cursor-pointer transition-all", form.plan === p.code ? "border-[#D4AF37]/40 bg-[#D4AF37]/5" : "border-[#D4AF37]/8 hover:border-[#D4AF37]/20")}>
                    <input type="radio" name="plan" value={p.code} checked={form.plan === p.code} onChange={() => setForm({ ...form, plan: p.code })} className="accent-[#D4AF37]" />
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <span className="font-['Rajdhani',sans-serif] font-bold text-white text-[16px]">{p.name}</span>
                        <p className="font-[JetBrains_Mono,monospace] text-[12px] text-white mt-0.5 uppercase">{p.duration_days}-day access</p>
                      </div>
                      <span className="font-['Rajdhani',sans-serif] font-bold text-[#D4AF37] text-[16px]">
                        {p.currency_symbol}{Math.round(parseFloat(p.price)).toLocaleString()}
                      </span>
                    </div>
                  </label>
                ))}
                <p className="font-[JetBrains_Mono,monospace] text-[11px] text-white text-center pt-1 uppercase tracking-widest">Access begins after payment verification</p>

                <ResponsibleUseWarning />

                <div className="space-y-2.5 pt-2 border-t border-white/[0.05]">
                  <ConsentCheckbox
                    id="consent-all"
                    checked={consent.acceptedTerms && consent.acknowledgedPrivacy && consent.confirmedAgeAndRisk}
                    onChange={v => setConsent({ ...consent, acceptedTerms: v, acknowledgedPrivacy: v, confirmedAgeAndRisk: v })}
                  >
                    I confirm that I am at least 18 years old and I have read and agree to the{" "}
                    <PolicyLink slug="terms-of-service">Terms of Service</PolicyLink>,{" "}
                    <PolicyLink slug="privacy">Privacy Policy</PolicyLink>, and{" "}
                    <PolicyLink slug="disclaimer">Disclaimer and Risk Disclosure</PolicyLink>.
                  </ConsentCheckbox>

                  <ConsentCheckbox
                    id="consent-refund"
                    checked={consent.acceptedRefundPolicy}
                    onChange={v => setConsent({ ...consent, acceptedRefundPolicy: v })}
                  >
                    I have reviewed the <PolicyLink slug="refund-policy">Refund and Subscription Policy</PolicyLink> and understand the applicable billing, cancellation and refund terms.
                    <span className="text-white"> (required only if paying now)</span>
                  </ConsentCheckbox>

                  <ConsentCheckbox
                    id="consent-marketing"
                    checked={consent.marketingConsent}
                    onChange={v => setConsent({ ...consent, marketingConsent: v })}
                    required={false}
                  >
                    I would like to receive product updates, offers and football-insight emails from Bet Lab.
                  </ConsentCheckbox>
                </div>
              </div>
            )}

            {tab === "login" && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-3 h-3 accent-[#D4AF37]" />
                  <span className="text-[14px] text-white">Remember me</span>
                </label>
                <button type="button" onClick={() => setShowForgot(true)} className="text-[13px] text-[#D4AF37]/60 hover:text-[#D4AF37] cursor-pointer">Forgot password?</button>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-red-400/20 bg-red-400/5 px-3.5 py-3"
              >
                <AlertCircle
                  size={14}
                  className="mt-0.5 shrink-0 text-red-400"
                />
                <p className="text-[12px] leading-relaxed text-red-300">
                  {error}
                </p>
              </div>
            )}

            <GoldBtn full size="md">
              {isSubmitting
                ? "Please wait..."
                : tab === "login"
                  ? "Sign In"
                  : step === 1
                    ? "Continue"
                    : "Create Account & Pay"}
              {!isSubmitting && <ArrowRight size={14} />}
            </GoldBtn>

            {tab === "register" && step === 2 && (
              <button
                type="button"
                onClick={() => void continueFree()}
                disabled={isSubmitting}
                className="w-full text-center text-[14px] text-white hover:text-[#D4AF37] transition-colors cursor-pointer disabled:opacity-50"
              >
                Continue for free instead
              </button>
            )}
          </form>
          <p className="mt-5 text-center font-[JetBrains_Mono,monospace] text-[11px] text-white uppercase tracking-widest">Secure authentication powered by Bet Lab</p>
        </div>
        )}
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
