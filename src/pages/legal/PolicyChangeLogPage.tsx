import { useEffect, useState } from "react";
import { ArrowLeft, History } from "lucide-react";
import { SectionEyebrow } from "../../app/shared";
import { useLegalPageMeta } from "../../legal/useLegalPageMeta";
import { LEGAL_DOCUMENT_BY_SLUG } from "../../legal/registry";
import { getPolicyChangeLog, type PolicyChangeLogEntry } from "../../services/legal";
import { ApiError } from "../../services/api";

export default function PolicyChangeLogPage({ onBack, onOpenPolicy }: {
  onBack: () => void;
  onOpenPolicy: (slug: string) => void;
}) {
  const [entries, setEntries] = useState<PolicyChangeLogEntry[] | null>(null);
  const [error, setError] = useState("");

  useLegalPageMeta({
    title: "Policy Change Log | Bet Lab",
    description: "A full history of every version of every Bet Lab policy, including what changed and when.",
    path: "/legal/changes",
    breadcrumb: [
      { name: "Legal Centre", path: "/legal" },
      { name: "Policy Change Log", path: "/legal/changes" },
    ],
  });

  useEffect(() => {
    let active = true;
    getPolicyChangeLog()
      .then(data => { if (active) setEntries(data); })
      .catch((requestError: unknown) => {
        if (!active) return;
        setError(requestError instanceof ApiError ? requestError.message : "Unable to load the policy change log.");
      });
    return () => { active = false; };
  }, []);

  return (
    <div className="pt-[60px]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 pb-24">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[11px] text-white/35 hover:text-[#D4AF37] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft size={13} aria-hidden="true" /> Back to Legal Centre
        </button>

        <SectionEyebrow>Legal &amp; Policies</SectionEyebrow>
        <h1 className="font-['Rajdhani',sans-serif] font-bold text-[36px] sm:text-[44px] text-white leading-tight mb-3">
          Policy Change Log
        </h1>
        <p className="text-white/45 text-[14px] max-w-2xl mb-10">
          Every version of every Bet Lab policy, newest first, with a summary of what changed. This log is generated
          directly from our records - nothing here is edited after the fact.
        </p>

        {error && (
          <p className="text-[13px] text-red-400 mb-8">{error}</p>
        )}

        {!entries && !error && (
          <p className="text-[13px] text-white/35">Loading change log...</p>
        )}

        {entries && entries.length === 0 && (
          <p className="text-[13px] text-white/35">No policy versions have been published yet.</p>
        )}

        {entries && entries.length > 0 && (
          <div className="space-y-3">
            {entries.map(entry => {
              const slug = policySlugFor(entry.policy_type);
              const isLinkable = Boolean(slug && LEGAL_DOCUMENT_BY_SLUG[slug as keyof typeof LEGAL_DOCUMENT_BY_SLUG]);
              return (
              <button
                key={`${entry.policy_type}-${entry.version}`}
                onClick={() => isLinkable && onOpenPolicy(slug)}
                disabled={!isLinkable}
                className="w-full text-left bg-card border border-[#D4AF37]/8 rounded-lg p-5 hover:border-[#D4AF37]/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] transition-all disabled:cursor-default disabled:hover:border-[#D4AF37]/8 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="font-['Rajdhani',sans-serif] font-bold text-[16px] text-white">
                    {entry.policy_type_display}
                  </h3>
                  <div className="flex items-center gap-2 shrink-0">
                    {entry.is_material_change && (
                      <span className="font-[JetBrains_Mono,monospace] text-[8px] uppercase tracking-widest text-amber-400 border border-amber-500/25 bg-amber-500/8 px-2 py-0.5 rounded-full">
                        Material Change
                      </span>
                    )}
                    {entry.is_active ? (
                      <span className="font-[JetBrains_Mono,monospace] text-[8px] uppercase tracking-widest text-emerald-400 border border-emerald-500/25 bg-emerald-500/8 px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    ) : (
                      <span className="font-[JetBrains_Mono,monospace] text-[8px] uppercase tracking-widest text-white/30 border border-white/10 px-2 py-0.5 rounded-full">
                        Superseded
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-[12px] text-white/40 leading-relaxed mb-2">{entry.change_summary}</p>
                <p className="font-[JetBrains_Mono,monospace] text-[9px] text-white/25 uppercase tracking-widest">
                  v{entry.version} &middot; {new Date(entry.effective_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-2 mt-10 text-white/25">
          <History size={12} aria-hidden="true" />
          <p className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-widest">
            Sourced live from our policy records
          </p>
        </div>
      </div>
    </div>
  );
}

function policySlugFor(policyType: string): string {
  return policyType.replace(/_/g, "-");
}
