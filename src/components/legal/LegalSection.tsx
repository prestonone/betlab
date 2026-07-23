import LegalCallout from "./LegalCallout";
import type { LegalSectionData } from "../../legal/types";

export default function LegalSection({ section }: { section: LegalSectionData }) {
  return (
    <section id={section.id} className="scroll-mt-24 mb-9">
      <h2 className="font-['Rajdhani',sans-serif] font-bold text-[22px] text-white mb-3 pb-2 border-b border-white/[0.06]">
        {section.heading}
      </h2>
      {section.blocks.map((block, i) => {
        if (block.type === "paragraphs") {
          return (
            <div key={i} className="space-y-3 mb-3">
              {block.items.map((p, j) => (
                <p key={j} className="text-[16px] leading-relaxed text-white">{p}</p>
              ))}
            </div>
          );
        }
        if (block.type === "list") {
          const Tag = block.ordered ? "ol" : "ul";
          return (
            <Tag key={i} className={block.ordered ? "list-decimal pl-5 space-y-1.5 mb-3" : "list-disc pl-5 space-y-1.5 mb-3"}>
              {block.items.map((item, j) => (
                <li key={j} className="text-[16px] leading-relaxed text-white">{item}</li>
              ))}
            </Tag>
          );
        }
        return <LegalCallout key={i} variant={block.variant} text={block.text} />;
      })}
    </section>
  );
}
