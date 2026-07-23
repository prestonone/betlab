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
      <span className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-widest text-white/40 border border-white/10 px-2.5 py-1 rounded-full">
        Effective {formatted}
      </span>
    </div>
  );
}
