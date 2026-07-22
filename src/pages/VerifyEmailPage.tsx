import { useEffect, useState } from "react";
import { ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import AnimatedLogoMark from "../components/AnimatedLogoMark";
import { Page, GoldBtn } from "../app/shared";
import { AuthApiError, verifyEmail } from "../services/auth";
import { useAuth } from "../contexts/AuthContext";

export default function VerifyEmailPage({ nav }: { nav: (p: Page) => void }) {
  const { isAuthenticated, restoreSession } = useAuth();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const uid = params.get("uid") ?? "";
    const token = params.get("token") ?? "";

    if (!uid || !token) {
      setStatus("error");
      setError("This verification link is missing information.");
      return;
    }

    let active = true;
    verifyEmail({ uid, token })
      .then(async () => {
        if (!active) return;
        if (isAuthenticated) await restoreSession();
        setStatus("success");
      })
      .catch((requestError) => {
        if (!active) return;
        setStatus("error");
        setError(
          requestError instanceof AuthApiError || requestError instanceof Error
            ? requestError.message
            : "Unable to connect to Bet Lab. Please confirm the backend is running.",
        );
      });

    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen pt-[60px] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <AnimatedLogoMark size={48} radius={10} className="mx-auto mb-4" />
          <h1 className="font-['Rajdhani',sans-serif] font-bold text-[36px] text-white mb-1">EMAIL VERIFICATION</h1>
        </div>

        <div className="bg-card border border-[#D4AF37]/12 rounded-xl p-7 text-center">
          {status === "verifying" && (
            <>
              <div className="w-8 h-8 border-2 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin mx-auto mb-4" />
              <p className="font-[JetBrains_Mono,monospace] text-[10px] text-white/35 uppercase tracking-widest">Verifying your email</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-11 h-11 rounded-full bg-emerald-500/12 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={20} className="text-emerald-400" />
              </div>
              <p className="font-['Rajdhani',sans-serif] font-bold text-white text-lg mb-1">Email verified</p>
              <p className="text-[12px] text-white/40 mb-5">Your account is fully set up.</p>
              <GoldBtn full size="md" onClick={() => nav(isAuthenticated ? "dashboard" : "login")}>
                {isAuthenticated ? "Go to dashboard" : "Go to sign in"} <ArrowRight size={14} />
              </GoldBtn>
            </>
          )}

          {status === "error" && (
            <>
              <div className="flex items-start gap-2 rounded-lg border border-red-400/20 bg-red-400/5 px-3.5 py-3 text-left mb-5">
                <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-400" />
                <p className="text-[12px] leading-relaxed text-red-300">{error}</p>
              </div>
              <GoldBtn full size="md" outline onClick={() => nav(isAuthenticated ? "dashboard" : "login")}>
                {isAuthenticated ? "Go to dashboard" : "Go to sign in"}
              </GoldBtn>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
