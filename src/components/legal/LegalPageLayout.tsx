import { ArrowLeft, Printer } from "lucide-react";
import { useEffect } from "react";
import LegalSection from "./LegalSection";
import LegalTableOfContents from "./LegalTableOfContents";
import PolicyMetadata from "./PolicyMetadata";
import { SectionEyebrow } from "../../app/shared";
import type { LegalDocument } from "../../legal/types";

export default function LegalPageLayout({ doc, onBack }: { doc: LegalDocument; onBack: () => void }) {
  useEffect(() => {
    document.title = `${doc.title} | Bet Lab`;
  }, [doc.title]);

  return (
    <div className="pt-[60px] print:pt-0">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 print:py-0">
        <button
          onClick={onBack}
          className="print:hidden flex items-center gap-1.5 text-[11px] text-white/35 hover:text-[#D4AF37] transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft size={13} /> Back to Legal Centre
        </button>

        <SectionEyebrow>Legal &amp; Policies</SectionEyebrow>
        <h1 className="font-['Rajdhani',sans-serif] font-bold text-[36px] sm:text-[44px] text-white leading-tight mb-3">
          {doc.title}
        </h1>
        <p className="text-white/45 text-[14px] max-w-2xl mb-4">{doc.summary}</p>
        <div className="flex items-center gap-3 mb-10">
          <PolicyMetadata version={doc.version} effectiveDate={doc.effectiveDate} />
          <button
            onClick={() => window.print()}
            className="print:hidden flex items-center gap-1.5 font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-widest text-white/35 hover:text-white/70 transition-colors cursor-pointer"
          >
            <Printer size={12} /> Print
          </button>
        </div>

        <div className="grid lg:grid-cols-[220px_1fr] gap-10">
          <LegalTableOfContents sections={doc.sections} />
          <div className="min-w-0">
            {doc.sections.map(section => (
              <LegalSection key={section.id} section={section} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
