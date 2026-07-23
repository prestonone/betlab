import { useNavigate } from "react-router-dom";
import AnimatedLogoMark from "../AnimatedLogoMark";

type Page =
  | "home"
  | "pricing"
  | "login"
  | "register"
  | "dashboard"
  | "predictions"
  | "results"
  | "about"
  | "contact"
  | "legal";

export default function Footer({ nav }: { nav: (p: Page) => void }) {
  const navigate = useNavigate();
  const goToPolicy = (slug: string) => {
    navigate(`/legal/${slug}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="border-t border-[#D4AF37]/8 mt-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid sm:grid-cols-2 lg:grid-cols-5 gap-10">
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <AnimatedLogoMark size={24} radius={4} />
            <span className="font-['Rajdhani',sans-serif] font-bold text-[18px] text-white tracking-wide">BET<span className="text-[#D4AF37]">LAB</span></span>
          </div>
          <p className="text-[12px] text-white/35 leading-relaxed mb-4">Premium football intelligence platform. Data-driven predictions for serious analysts.</p>
          <p className="text-[10px] font-[JetBrains_Mono,monospace] text-white/20 leading-relaxed">Bet Lab is a sports analytics subscription service. We are not a bookmaker. Please gamble responsibly. 18+ only.</p>
        </div>
        {[
          { title: "Platform", links: [["Home", "home"], ["Predictions", "predictions"], ["Live Scores", "results"], ["Pricing", "pricing"]] as [string, Page][] },
          { title: "Company", links: [["About", "about"], ["Contact", "contact"], ["Legal Centre", "legal"]] as [string, Page][] },
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
        <div className="lg:col-span-2">
          <h4 className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-[0.2em] text-[#D4AF37] mb-4">Legal &amp; Policies</h4>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
            {[
              ["Terms of Service", "terms-of-service"],
              ["Terms of Use", "terms-of-use"],
              ["Privacy Policy", "privacy"],
              ["Refund & Subscription", "refund-policy"],
              ["Disclaimer", "disclaimer"],
              ["Risk Disclosure", "risk-disclosure"],
              ["Responsible Gambling", "responsible-gambling"],
              ["Cookie Policy", "cookies"],
              ["Copyright Policy", "copyright"],
              ["Acceptable Use", "acceptable-use"],
              ["AML/KYC Statement", "aml-kyc"],
              ["Prediction Methodology", "methodology"],
            ].map(([label, slug]) => (
              <li key={slug}>
                <button onClick={() => goToPolicy(slug)} className="text-[12px] text-white/35 hover:text-white/75 transition-colors cursor-pointer text-left">
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>
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
