import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import AnimatedLogoMark from "../AnimatedLogoMark";
import { cn } from "../../app/shared";
import type { PolicySlug } from "../../legal/types";

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

function FooterToggle({ id, label, open, onToggle }: { id: string; label: string; open: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={id}
      className="flex items-center gap-1.5 w-full font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-[0.2em] text-[#D4AF37] mb-4 cursor-pointer"
    >
      {label}
      <ChevronDown size={11} className={cn("transition-transform duration-200", open && "rotate-180")} />
    </button>
  );
}

export default function Footer({ nav }: { nav: (p: Page) => void }) {
  const navigate = useNavigate();
  const [platformOpen, setPlatformOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const goToPolicy = (slug: PolicySlug) => {
    navigate(`/legal/${slug}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const columns: { title: string; id: string; open: boolean; setOpen: (v: boolean) => void; links: [string, Page][] }[] = [
    { title: "Platform", id: "footer-platform-links", open: platformOpen, setOpen: setPlatformOpen, links: [["Home", "home"], ["Predictions", "predictions"], ["Live Scores", "results"], ["Pricing", "pricing"]] },
    { title: "Company", id: "footer-company-links", open: companyOpen, setOpen: setCompanyOpen, links: [["About", "about"], ["Contact", "contact"], ["Legal Centre", "legal"]] },
  ];

  return (
    <footer className="border-t border-[#D4AF37]/8 mt-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid sm:grid-cols-2 lg:grid-cols-5 gap-10">
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <AnimatedLogoMark size={24} radius={4} />
            <span className="font-['Rajdhani',sans-serif] font-bold text-[18px] text-white tracking-wide">BET<span className="text-[#D4AF37]">LAB</span></span>
          </div>
          <p className="text-[16px] text-white leading-relaxed mb-4">Premium football intelligence platform. Data-driven predictions for serious analysts.</p>
          <p className="text-[16px] font-[JetBrains_Mono,monospace] text-white leading-relaxed">Bet Lab is a sports analytics subscription service. We are not a bookmaker. Please gamble responsibly. 18+ only.</p>
        </div>
        {columns.map(col => (
          <div key={col.title}>
            <FooterToggle id={col.id} label={col.title} open={col.open} onToggle={() => col.setOpen(!col.open)} />
            {col.open && (
              <ul id={col.id} className="space-y-2.5 animate-fade-in">
                {col.links.map(([label, p]) => (
                  <li key={label}><button onClick={() => nav(p)} className="text-[16px] text-white hover:text-[#D4AF37] transition-colors cursor-pointer">{label}</button></li>
                ))}
              </ul>
            )}
          </div>
        ))}
        <div className="lg:col-span-2">
          <FooterToggle id="footer-legal-links" label="Legal & Policies" open={legalOpen} onToggle={() => setLegalOpen(!legalOpen)} />
          {legalOpen && (
            <ul id="footer-legal-links" className="grid grid-cols-2 gap-x-4 gap-y-2.5 animate-fade-in">
              {(
                [
                  ["Terms of Service", "terms-of-service"],
                  ["Privacy Policy", "privacy"],
                  ["Refund & Subscription", "refund-policy"],
                  ["Disclaimer & Risk Disclosure", "disclaimer"],
                  ["Responsible Gambling", "responsible-gambling"],
                  ["Cookie Policy", "cookies"],
                  ["Copyright Policy", "copyright"],
                  ["Acceptable Use", "acceptable-use"],
                  ["AML/KYC Statement", "aml-kyc"],
                  ["Prediction Methodology", "methodology"],
                ] as [string, PolicySlug][]
              ).map(([label, slug]) => (
                <li key={slug}>
                  <button onClick={() => goToPolicy(slug)} className="text-[16px] text-white hover:text-[#D4AF37] transition-colors cursor-pointer text-left">
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="border-t border-[#D4AF37]/8 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-[JetBrains_Mono,monospace] text-[14px] text-white">© 2026 Bet Lab Intelligence Ltd. All rights reserved.</p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-[JetBrains_Mono,monospace] text-[14px] text-white">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
