import { useEffect, useMemo, useState } from "react";
import { Bell, LogOut, Menu, X } from "lucide-react";
import { Page, cn, GoldBtn, displayNameFor, initialsFor } from "../../app/shared";
import AnimatedLogoMark from "../AnimatedLogoMark";
import { useAuth } from "../../contexts/AuthContext";
import { useCurrentSubscription } from "../../hooks/useCurrentSubscription";
import { getPredictions, type Prediction as ApiPrediction } from "../../services/predictions";

function timeAgo(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days}d ago`;
}

function referenceTime(pred: ApiPrediction): Date | null {
  if (pred.settled_at) return new Date(pred.settled_at);
  const times = pred.selections
    .map(s => new Date(s.match_time))
    .filter(d => !Number.isNaN(d.getTime()));
  return times.length ? new Date(Math.max(...times.map(d => d.getTime()))) : null;
}

export default function Navbar({ page, nav, authed, setAuthed }: {
  page: Page; nav: (p: Page) => void;
  authed: boolean; setAuthed: (v: boolean) => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const { user } = useAuth();
  const { subscription, hasSubscription } = useCurrentSubscription(authed);
  const displayName = displayNameFor(user);
  const initials = initialsFor(displayName || "?");
  const planLabel = hasSubscription && subscription ? subscription.plan_name : "No active plan";

  const [predictions, setPredictions] = useState<ApiPrediction[]>([]);

  useEffect(() => {
    if (!authed) return;
    let active = true;
    getPredictions().then(data => { if (active) setPredictions(data); }).catch(() => {});
    return () => { active = false; };
  }, [authed]);

  const notifications = useMemo(() => {
    const items: { icon: string; text: string; at: Date | null }[] = [];

    const settledRecent = predictions
      .filter(p => p.result_status === "won" || p.result_status === "lost")
      .sort((a, b) => (referenceTime(b)?.getTime() ?? 0) - (referenceTime(a)?.getTime() ?? 0))
      .slice(0, 3);
    for (const p of settledRecent) {
      items.push({
        icon: p.result_status === "won" ? "✅" : "⚠️",
        text: `${p.title} confirmed: ${p.result_status.toUpperCase()}`,
        at: referenceTime(p),
      });
    }

    const liveToday = predictions.filter(p => p.result_status === "pending").length;
    if (liveToday > 0) {
      items.push({ icon: "📊", text: `${liveToday} prediction${liveToday === 1 ? "" : "s"} live right now`, at: null });
    }

    if (hasSubscription && subscription) {
      items.push({ icon: "🏆", text: `${subscription.plan_name} membership is active`, at: null });
    }

    return items
      .sort((a, b) => (b.at?.getTime() ?? 0) - (a.at?.getTime() ?? 0))
      .slice(0, 6)
      .map(item => ({
        ...item,
        time: item.at ? timeAgo(item.at) : "",
        unread: item.at ? Date.now() - item.at.getTime() < 24 * 60 * 60 * 1000 : false,
      }));
  }, [predictions, hasSubscription, subscription]);

  const unread = notifications.filter(n => n.unread).length;

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
              page === l.p ? "text-[#D4AF37]" : "text-white hover:text-[#D4AF37]"
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
                <button onClick={() => setNotifOpen(!notifOpen)} className="relative w-8 h-8 flex items-center justify-center rounded border border-[#D4AF37]/15 text-white hover:text-[#D4AF37] hover:border-[#D4AF37]/35 transition-all cursor-pointer">
                  <Bell size={14} />
                  {unread > 0 && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-[#111C2E] border border-[#D4AF37]/15 rounded-lg shadow-2xl overflow-hidden z-50">
                    <div className="px-4 py-2.5 border-b border-white/[0.05] flex items-center justify-between">
                      <span className="font-[JetBrains_Mono,monospace] text-[10px] text-[#D4AF37] uppercase tracking-widest">Notifications</span>
                      {unread > 0 && <span className="font-[JetBrains_Mono,monospace] text-[13px] text-white">{unread} unread</span>}
                    </div>
                    {notifications.length === 0 && (
                      <p className="px-4 py-6 text-[15px] text-white text-center">Nothing new right now.</p>
                    )}
                    {notifications.map((n, i) => (
                      <div key={i} className={cn("px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer flex gap-3", n.unread && "bg-[#D4AF37]/[0.03]")}>
                        <span className="text-sm mt-0.5 flex-shrink-0">{n.icon}</span>
                        <div>
                          <p className="text-[15px] text-white leading-snug">{n.text}</p>
                          {n.time && <p className="font-[JetBrains_Mono,monospace] text-[13px] text-white mt-1">{n.time}</p>}
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
                  <p className="text-[15px] font-medium text-white leading-none">{displayName.split(" ")[0]}</p>
                  <p className="font-[JetBrains_Mono,monospace] text-[9px] text-[#D4AF37] mt-0.5">{planLabel}</p>
                </div>
                <button onClick={() => { setAuthed(false); nav("home"); }} className="ml-1 text-white hover:text-[#D4AF37] transition-colors cursor-pointer">
                  <LogOut size={13} />
                </button>
              </div>
            </>
          ) : (
            <>
              <button onClick={() => nav("login")} className="text-[16px] text-white hover:text-white transition-colors cursor-pointer">Sign In</button>
              <GoldBtn onClick={() => nav("register")} size="sm">Get Access</GoldBtn>
            </>
          )}

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-white hover:text-white transition-colors cursor-pointer ml-1">
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
                className={cn("text-left px-3 py-2.5 rounded text-[16px] transition-colors", page === l.p ? "text-[#D4AF37] bg-[#D4AF37]/8" : "text-white hover:text-white hover:bg-white/[0.03]")}>
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
