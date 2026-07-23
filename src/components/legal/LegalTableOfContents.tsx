import { cn } from "../../app/shared";
import type { LegalSectionData } from "../../legal/types";

export default function LegalTableOfContents({ sections }: { sections: LegalSectionData[] }) {
  return (
    <nav aria-label="Table of contents" className={cn(
      "print:hidden lg:sticky lg:top-[84px] bg-card border border-[#D4AF37]/10 rounded-lg p-4 lg:max-h-[calc(100vh-110px)] lg:overflow-y-auto",
    )}>
      <p className="font-[JetBrains_Mono,monospace] text-[11px] uppercase tracking-widest text-white mb-3">On this page</p>
      <ul className="space-y-1">
        {sections.map(s => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className="block text-[15px] text-white hover:text-[#D4AF37] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] transition-colors py-1 leading-snug"
            >
              {s.heading}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
