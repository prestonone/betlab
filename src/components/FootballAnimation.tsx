import { useState } from "react";

export default function FootballAnimation() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      <span
        onAnimationEnd={() => setVisible(false)}
        className="animate-football-flight absolute top-0 left-0 text-[40px] leading-none"
        style={{ filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.35))" }}
      >
        ⚽
      </span>
    </div>
  );
}
