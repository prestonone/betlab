import type { ReactNode } from "react";
import type { PolicySlug } from "../../legal/types";

export default function PolicyLink({ slug, children }: { slug: PolicySlug; children: ReactNode }) {
  return (
    <a
      href={`/legal/${slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#D4AF37] underline underline-offset-2 hover:text-[#e8c765] transition-colors"
    >
      {children}
    </a>
  );
}
