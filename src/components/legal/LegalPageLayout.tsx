import { ArrowLeft, Download } from "lucide-react";
import LegalSection from "./LegalSection";
import LegalTableOfContents from "./LegalTableOfContents";
import PolicyMetadata from "./PolicyMetadata";
import { SectionEyebrow } from "../../app/shared";
import { useLegalPageMeta } from "../../legal/useLegalPageMeta";
import type { LegalDocument } from "../../legal/types";

// Stopgap PDF export: triggers the browser's native print dialog, which every
// modern browser can "Save as PDF" from directly. Kept as its own named
// function (not inlined) so a real server-rendered PDF endpoint can replace
// the body of this function later without touching the button that calls it.
function downloadPdf() {
  window.print();
}

export default function LegalPageLayout({ doc, onBack }: { doc: LegalDocument; onBack: () => void }) {
  useLegalPageMeta({
    title: `${doc.title} | Bet Lab`,
    description: doc.summary,
    path: `/legal/${doc.slug}`,
    modifiedDate: doc.effectiveDate,
    breadcrumb: [
      { name: "Legal Centre", path: "/legal" },
      { name: doc.shortTitle, path: `/legal/${doc.slug}` },
    ],
  });

  return (
    <div className="pt-[60px] print:pt-0">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 print:py-0 legal-print-surface">
        <button
          onClick={onBack}
          className="print:hidden flex items-center gap-1.5 text-[11px] text-white/35 hover:text-[#D4AF37] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft size={13} aria-hidden="true" /> Back to Legal Centre
        </button>

        <SectionEyebrow>Legal &amp; Policies</SectionEyebrow>
        <h1 className="font-['Rajdhani',sans-serif] font-bold text-[36px] sm:text-[44px] text-white leading-tight mb-3">
          {doc.title}
        </h1>
        <p className="text-white/60 text-[14px] max-w-2xl mb-4">{doc.summary}</p>
        <div className="flex items-center gap-3 mb-10">
          <PolicyMetadata version={doc.version} effectiveDate={doc.effectiveDate} />
          <button
            onClick={downloadPdf}
            aria-label="Download this policy as a PDF"
            className="print:hidden flex items-center gap-1.5 font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-widest text-white/35 hover:text-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] transition-colors cursor-pointer"
          >
            <Download size={12} aria-hidden="true" /> Download PDF
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
