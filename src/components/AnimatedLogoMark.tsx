export default function AnimatedLogoMark({ size = 32, radius = 7, className = "" }: { size?: number; radius?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} style={{ display: "block", flexShrink: 0 }}>
      <rect width="32" height="32" rx={radius} fill="#D4AF37" />
      <rect className="logo-bar logo-bar-1" x="8" y="17" width="4" height="8" rx="1.5" fill="#070E1A" />
      <rect className="logo-bar logo-bar-2" x="14" y="12" width="4" height="13" rx="1.5" fill="#070E1A" />
      <rect className="logo-bar logo-bar-3" x="20" y="7" width="4" height="18" rx="1.5" fill="#070E1A" />
    </svg>
  );
}
