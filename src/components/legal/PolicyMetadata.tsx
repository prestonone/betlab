export default function PolicyMetadata({ version, effectiveDate }: { version: string; effectiveDate: string }) {
  const formatted = new Date(effectiveDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <span className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-widest text-[#D4AF37] border border-[#D4AF37]/25 bg-[#D4AF37]/8 px-2.5 py-1 rounded-full">
        Version {version}
      </span>
      <span className="font-[JetBrains_Mono,monospace] text-[11px] uppercase tracking-widest text-white border border-white/10 px-2.5 py-1 rounded-full">
        Effective {formatted}
      </span>
      <span className="font-[JetBrains_Mono,monospace] text-[11px] uppercase tracking-widest text-white border border-white/10 px-2.5 py-1 rounded-full">
        Last Updated {formatted}
      </span>
      <span className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-widest text-emerald-400 border border-emerald-500/25 bg-emerald-500/8 px-2.5 py-1 rounded-full">
        Current
      </span>
    </div>
  );
}
