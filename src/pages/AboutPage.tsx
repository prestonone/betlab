import { Shield, Award, Activity, AlertCircle } from "lucide-react";
import { Page, SectionEyebrow } from "../app/shared";

export default function AboutPage({ nav }: { nav: (p: Page) => void }) {
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
          <p className="text-white/60 max-w-2xl text-[15px] leading-relaxed">
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
              <p className="text-[13px] text-white/55 leading-relaxed">{v.desc}</p>
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
                  <p className="text-[13px] text-white/55 leading-relaxed">{t.bio}</p>
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
            <p className="text-[13px] text-white/50 leading-relaxed">
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
