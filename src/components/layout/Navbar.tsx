import { useState } from "react";
import { Bell, LogOut, Menu, X } from "lucide-react";
import { Page, NOTIFICATIONS, cn, GoldBtn, displayNameFor, initialsFor } from "../../app/shared";
import AnimatedLogoMark from "../AnimatedLogoMark";
import { useAuth } from "../../contexts/AuthContext";
import { useCurrentSubscription } from "../../hooks/useCurrentSubscription";

export default function Navbar({ page, nav, authed, setAuthed }: {
  page: Page; nav: (p: Page) => void;
  authed: boolean; setAuthed: (v: boolean) => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const unread = NOTIFICATIONS.filter(n => n.unread).length;

  const { user } = useAuth();
  const { subscription, hasSubscription } = useCurrentSubscription(authed);
  const displayName = displayNameFor(user);
  const initials = initialsFor(displayName || "?");
  const planLabel = hasSubscription && subscription ? subscription.plan_name : "No active plan";

  const links = authed
    ? [{ label: "Dashboard", p: "dashboard" as Page }, { label: "Predictions", p: "predictions" as Page }, { label: "Live Scores", p: "results" as Page }]
    : [{ label: "Home", p: "home" as Page }, { label: "Predictions", p: "predictions" as Page }, { label: "Pricing", p: "pricing" as Page }, { label: "Live Scores", p: "results" as Page }, { label: "About", p: "about" as Page }];

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-[60px] border-b border-[#D4AF37]/8 bg-[#0B1220]/92 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-6">
        {/* Logo */}
        <button onClick={() => nav("home")} className="flex items-center gap-2.5 cursor-pointer flex-shrink-0">
          <AnimatedLogoMark size={28} radius={5} />
          <span className="font-['Rajdhani',sans-serif] font-bold text-[20px] tracking-[0.05em] text-white">
            BET<span className="text-[#D4AF37]">LAB</span>
          </span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-5">
          {links.map(l => (
            <button key={l.p} onClick={() => nav(l.p)} className={cn(
              "text-[13px] transition-colors cursor-pointer relative py-1",
              page === l.p ? "text-[#D4AF37]" : "text-white/50 hover:text-white/85"
            )}>
              {l.label}
              {page === l.p && <span className="absolute bottom-0 inset-x-0 h-px bg-[#D4AF37]/60" />}
            </button>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2.5">
          {authed ? (
            <>
              {/* Notifications */}
              <div className="relative">
                <button onClick={() => setNotifOpen(!notifOpen)} className="relative w-8 h-8 flex items-center justify-center rounded border border-[#D4AF37]/15 text-white/40 hover:text-[#D4AF37] hover:border-[#D4AF37]/35 transition-all cursor-pointer">
                  <Bell size={14} />
                  {unread > 0 && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-[#111C2E] border border-[#D4AF37]/15 rounded-lg shadow-2xl overflow-hidden z-50">
                    <div className="px-4 py-2.5 border-b border-white/[0.05] flex items-center justify-between">
                      <span className="font-[JetBrains_Mono,monospace] text-[10px] text-[#D4AF37] uppercase tracking-widest">Notifications</span>
                      {unread > 0 && <span className="font-[JetBrains_Mono,monospace] text-[10px] text-white/30">{unread} unread</span>}
                    </div>
                    {NOTIFICATIONS.map((n, i) => (
                      <div key={i} className={cn("px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer flex gap-3", n.unread && "bg-[#D4AF37]/[0.03]")}>
                        <span className="text-sm mt-0.5 flex-shrink-0">{n.icon}</span>
                        <div>
                          <p className="text-[12px] text-white/75 leading-snug">{n.text}</p>
                          <p className="font-[JetBrains_Mono,monospace] text-[10px] text-white/25 mt-1">{n.time}</p>
                        </div>
                        {n.unread && <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] flex-shrink-0 mt-1.5 ml-auto" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* User pill */}
              <div className="flex items-center gap-2.5 pl-2.5 border-l border-white/8">
                <div className="w-7 h-7 rounded-full bg-[#D4AF37]/18 border border-[#D4AF37]/30 flex items-center justify-center">
                  <span className="text-[#D4AF37] text-[10px] font-bold">{initials}</span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-[12px] font-medium text-white leading-none">{displayName.split(" ")[0]}</p>
                  <p className="font-[JetBrains_Mono,monospace] text-[9px] text-[#D4AF37] mt-0.5">{planLabel}</p>
                </div>
                <button onClick={() => { setAuthed(false); nav("home"); }} className="ml-1 text-white/25 hover:text-white/60 transition-colors cursor-pointer">
                  <LogOut size={13} />
                </button>
              </div>
            </>
          ) : (
            <>
              <button onClick={() => nav("login")} className="text-[13px] text-white/50 hover:text-white transition-colors cursor-pointer">Sign In</button>
              <GoldBtn onClick={() => nav("register")} size="sm">Get Access</GoldBtn>
            </>
          )}

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-white/50 hover:text-white transition-colors cursor-pointer ml-1">
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#D4AF37]/8 bg-[#0B1220]">
          <nav className="px-4 py-3 flex flex-col gap-0.5">
            {links.map(l => (
              <button key={l.p} onClick={() => { nav(l.p); setMobileOpen(false); }}
                className={cn("text-left px-3 py-2.5 rounded text-[13px] transition-colors", page === l.p ? "text-[#D4AF37] bg-[#D4AF37]/8" : "text-white/60 hover:text-white hover:bg-white/[0.03]")}>
                {l.label}
              </button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
