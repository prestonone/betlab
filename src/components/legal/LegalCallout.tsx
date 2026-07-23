import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import { cn } from "../../app/shared";
import type { LegalCalloutBlock } from "../../legal/types";

const VARIANT_STYLES: Record<LegalCalloutBlock["variant"], { border: string; bg: string; text: string; icon: typeof Info }> = {
  info: { border: "border-[#D4AF37]/25", bg: "bg-[#D4AF37]/[0.06]", text: "text-[#D4AF37]", icon: Info },
  warning: { border: "border-amber-500/30", bg: "bg-amber-500/[0.07]", text: "text-amber-400", icon: AlertTriangle },
  danger: { border: "border-rose-500/30", bg: "bg-rose-500/[0.07]", text: "text-rose-400", icon: ShieldAlert },
};

export default function LegalCallout({ variant, text }: { variant: LegalCalloutBlock["variant"]; text: string }) {
  const s = VARIANT_STYLES[variant];
  const Icon = s.icon;

  return (
    <div className={cn("flex items-start gap-3 rounded-lg border px-4 py-3.5 my-4", s.border, s.bg)}>
      <Icon size={16} aria-hidden="true" className={cn("mt-0.5 flex-shrink-0", s.text)} />
      <p className="text-[13px] leading-relaxed text-white/75">{text}</p>
    </div>
  );
}
