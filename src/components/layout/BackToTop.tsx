import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "../../app/shared";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className={cn(
        "fixed bottom-6 right-4 sm:right-6 z-40 w-11 h-11 rounded-full border border-[#D4AF37]/25 bg-[#111C2E]/90 backdrop-blur-xl text-[#D4AF37] flex items-center justify-center shadow-lg cursor-pointer transition-all duration-300 hover:bg-[#D4AF37] hover:text-[#070E1A]",
        visible ? "opacity-100" : "opacity-0 pointer-events-none",
      )}
    >
      <ArrowUp size={17} />
    </button>
  );
}
