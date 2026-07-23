import { useMemo, useState } from "react";
import {
  FileText, ShieldCheck, Receipt, AlertTriangle,
  Cookie, Copyright, ListChecks, HeartHandshake, Landmark, BarChart3, Search, History, Mail,
} from "lucide-react";
import { SectionEyebrow } from "../../app/shared";
import { LEGAL_DOCUMENTS } from "../../legal/registry";
import { LEGAL_SUPPORT_EMAIL, LEGAL_EMAIL, LEGAL_PRIVACY_EMAIL } from "../../legal/config";
import { useLegalPageMeta } from "../../legal/useLegalPageMeta";
import type { LegalDocument, PolicySlug } from "../../legal/types";

const ICONS: Record<PolicySlug, typeof FileText> = {
  "terms-of-service": FileText,
  "privacy": ShieldCheck,
  "refund-policy": Receipt,
  "disclaimer": AlertTriangle,
  "responsible-gambling": HeartHandshake,
  "cookies": Cookie,
  "copyright": Copyright,
  "acceptable-use": ListChecks,
  "aml-kyc": Landmark,
  "methodology": BarChart3,
};

function matches(doc: LegalDocument, query: string): boolean {
  const q = query.toLowerCase();
  if (doc.title.toLowerCase().includes(q)) return true;
  if (doc.summary.toLowerCase().includes(q)) return true;
  return doc.sections.some(section => {
    if (section.heading.toLowerCase().includes(q)) return true;
    return section.blocks.some(block => {
      if (block.type === "callout") return block.text.toLowerCase().includes(q);
      return block.items.some(item => item.toLowerCase().includes(q));
    });
  });
}

export default function LegalCentrePage({ onOpen, onOpenRoute }: { onOpen: (slug: string) => void; onOpenRoute: (path: string) => void }) {
  const [query, setQuery] = useState("");

  useLegalPageMeta({
    title: "Legal Centre | Bet Lab",
    description: "Every Bet Lab policy in one place: Terms of Service, Privacy Policy, Refund Policy, Disclaimer and Risk Disclosure, and more.",
    path: "/legal",
    breadcrumb: [{ name: "Legal Centre", path: "/legal" }],
  });

  const visibleDocuments = useMemo(
    () => (query.trim() ? LEGAL_DOCUMENTS.filter(doc => matches(doc, query.trim())) : LEGAL_DOCUMENTS),
    [query],
  );

  return (
    <div className="pt-[60px]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 pb-24">
        <div className="text-center mb-10">
          <SectionEyebrow>Legal &amp; Policies</SectionEyebrow>
          <h1 className="font-['Rajdhani',sans-serif] font-bold text-[44px] sm:text-[56px] text-white mb-4">LEGAL CENTRE</h1>
          <p className="text-white max-w-xl mx-auto text-[14px]">
            Every policy governing your use of Bet Lab, in one place. Bet Lab is a football analysis subscription
            service, not a bookmaker - see our Disclaimer and Risk Disclosure for details.
          </p>
        </div>

        <div className="max-w-md mx-auto mb-10 relative">
          <Search size={14} aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search policies by title, keyword or heading..."
            aria-label="Search legal policies"
            className="w-full bg-card border border-[#D4AF37]/12 rounded-lg pl-10 pr-4 py-2.5 text-[16px] text-white placeholder-white/25 focus:outline-none focus-visible:border-[#D4AF37]/60 transition-colors"
          />
        </div>

        <div aria-live="polite" className="sr-only">
          {query.trim() && `${visibleDocuments.length} ${visibleDocuments.length === 1 ? "policy matches" : "policies match"} "${query}"`}
        </div>

        {visibleDocuments.length === 0 && (
          <p className="text-center text-[16px] text-white mb-14">No policies match &quot;{query}&quot;.</p>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-14">
          {visibleDocuments.map(doc => {
            const Icon = ICONS[doc.slug];
            return (
              <button
                key={doc.slug}
                onClick={() => onOpen(doc.slug)}
                className="text-left bg-card border border-[#D4AF37]/8 rounded-lg p-5 hover:border-[#D4AF37]/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] transition-all cursor-pointer group"
              >
                <div className="w-9 h-9 rounded bg-[#D4AF37]/10 border border-[#D4AF37]/15 flex items-center justify-center text-[#D4AF37] mb-4 group-hover:bg-[#D4AF37]/18 transition-colors">
                  <Icon size={16} aria-hidden="true" />
                </div>
                <h3 className="font-['Rajdhani',sans-serif] font-bold text-[17px] text-white mb-1.5">{doc.shortTitle}</h3>
                <p className="text-[16px] text-white leading-relaxed mb-3">{doc.summary}</p>
                <p className="font-[JetBrains_Mono,monospace] text-[11px] text-white uppercase tracking-widest">
                  v{doc.version} &middot; {new Date(doc.effectiveDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-14">
          <button
            onClick={() => onOpenRoute("/legal/changes")}
            className="flex items-center gap-2 font-[JetBrains_Mono,monospace] text-[12px] uppercase tracking-widest text-white hover:text-[#D4AF37] transition-colors cursor-pointer border border-white/10 hover:border-[#D4AF37]/30 rounded-full px-4 py-2"
          >
            <History size={12} aria-hidden="true" /> Policy Change Log
          </button>
          <button
            onClick={() => onOpenRoute("/legal/contact")}
            className="flex items-center gap-2 font-[JetBrains_Mono,monospace] text-[12px] uppercase tracking-widest text-white hover:text-[#D4AF37] transition-colors cursor-pointer border border-white/10 hover:border-[#D4AF37]/30 rounded-full px-4 py-2"
          >
            <Mail size={12} aria-hidden="true" /> Legal Contact Form
          </button>
        </div>

        <div className="max-w-lg mx-auto text-center bg-card border border-[#D4AF37]/10 rounded-lg p-6">
          <p className="font-[JetBrains_Mono,monospace] text-[11px] text-white uppercase tracking-widest mb-2">Questions</p>
          <p className="text-[16px] text-white leading-relaxed">
            Support: {LEGAL_SUPPORT_EMAIL}<br />
            Legal: {LEGAL_EMAIL}<br />
            Privacy: {LEGAL_PRIVACY_EMAIL}
          </p>
        </div>
      </div>
    </div>
  );
}
