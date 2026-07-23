import { useEffect } from "react";
import {
  FileText, ScrollText, ShieldCheck, Receipt, AlertTriangle,
  Gauge, Cookie, Copyright, ListChecks, HeartHandshake, Landmark, BarChart3,
} from "lucide-react";
import { SectionEyebrow } from "../../app/shared";
import { LEGAL_DOCUMENTS } from "../../legal/registry";
import { LEGAL_SUPPORT_EMAIL, LEGAL_EMAIL, LEGAL_PRIVACY_EMAIL } from "../../legal/config";
import type { PolicySlug } from "../../legal/types";

const ICONS: Record<PolicySlug, typeof FileText> = {
  "terms-of-service": FileText,
  "terms-of-use": ScrollText,
  "privacy": ShieldCheck,
  "refund-policy": Receipt,
  "disclaimer": AlertTriangle,
  "risk-disclosure": Gauge,
  "responsible-gambling": HeartHandshake,
  "cookies": Cookie,
  "copyright": Copyright,
  "acceptable-use": ListChecks,
  "aml-kyc": Landmark,
  "methodology": BarChart3,
};

export default function LegalCentrePage({ onOpen }: { onOpen: (slug: string) => void }) {
  useEffect(() => {
    document.title = "Legal Centre | Bet Lab";
  }, []);

  return (
    <div className="pt-[60px]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 pb-24">
        <div className="text-center mb-12">
          <SectionEyebrow>Legal &amp; Policies</SectionEyebrow>
          <h1 className="font-['Rajdhani',sans-serif] font-bold text-[44px] sm:text-[56px] text-white mb-4">LEGAL CENTRE</h1>
          <p className="text-white/40 max-w-xl mx-auto text-[14px]">
            Every policy governing your use of Bet Lab, in one place. Bet Lab is a football analysis subscription
            service, not a bookmaker - see our Disclaimer and Risk Disclosure for details.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-14">
          {LEGAL_DOCUMENTS.map(doc => {
            const Icon = ICONS[doc.slug];
            return (
              <button
                key={doc.slug}
                onClick={() => onOpen(doc.slug)}
                className="text-left bg-card border border-[#D4AF37]/8 rounded-lg p-5 hover:border-[#D4AF37]/25 transition-all cursor-pointer group"
              >
                <div className="w-9 h-9 rounded bg-[#D4AF37]/10 border border-[#D4AF37]/15 flex items-center justify-center text-[#D4AF37] mb-4 group-hover:bg-[#D4AF37]/18 transition-colors">
                  <Icon size={16} />
                </div>
                <h3 className="font-['Rajdhani',sans-serif] font-bold text-[17px] text-white mb-1.5">{doc.shortTitle}</h3>
                <p className="text-[11.5px] text-white/35 leading-relaxed mb-3">{doc.summary}</p>
                <p className="font-[JetBrains_Mono,monospace] text-[9px] text-white/25 uppercase tracking-widest">
                  v{doc.version} &middot; {new Date(doc.effectiveDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </button>
            );
          })}
        </div>

        <div className="max-w-lg mx-auto text-center bg-card border border-[#D4AF37]/10 rounded-lg p-6">
          <p className="font-[JetBrains_Mono,monospace] text-[9px] text-white/25 uppercase tracking-widest mb-2">Questions</p>
          <p className="text-[12px] text-white/45 leading-relaxed">
            Support: {LEGAL_SUPPORT_EMAIL}<br />
            Legal: {LEGAL_EMAIL}<br />
            Privacy: {LEGAL_PRIVACY_EMAIL}
          </p>
        </div>
      </div>
    </div>
  );
}
