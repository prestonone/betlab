import { useState } from "react";
import { ArrowRight, AlertCircle, CheckCircle2, MailX } from "lucide-react";
import AnimatedLogoMark from "../components/AnimatedLogoMark";
import { Page, GoldBtn } from "../app/shared";
import { ApiError } from "../services/api";
import { confirmUnsubscribe } from "../services/legal";

export default function UnsubscribePage({ nav }: { nav: (p: Page) => void }) {
  const params = new URLSearchParams(window.location.search);
  const uid = params.get("uid") ?? "";
  const token = params.get("token") ?? "";

  const [status, setStatus] = useState<"confirm" | "submitting" | "success" | "error">("confirm");
  const [error, setError] = useState("");

  const invalidLink = !uid || !token;

  // Deliberately not fired automatically on mount: some email clients and
  // corporate link scanners prefetch links inside emails before a human
  // clicks them. Requiring an explicit click here means only a real click
  // ever triggers the unsubscribe POST.
  const submit = async () => {
    setStatus("submitting");
    setError("");
    try {
      await confirmUnsubscribe({ uid, token });
      setStatus("success");
    } catch (requestError) {
      setStatus("error");
      setError(
        requestError instanceof ApiError || requestError instanceof Error
          ? requestError.message
          : "Unable to connect to Bet Lab. Please confirm the backend is running.",
      );
    }
  };

  return (
    <div className="min-h-screen pt-[60px] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <AnimatedLogoMark size={48} radius={10} className="mx-auto mb-4" />
          <h1 className="font-['Rajdhani',sans-serif] font-bold text-[36px] text-white mb-1">UNSUBSCRIBE</h1>
        </div>

        <div className="bg-card border border-[#D4AF37]/12 rounded-xl p-7 text-center">
          {invalidLink ? (
            <div className="flex items-start gap-2 rounded-lg border border-red-400/20 bg-red-400/5 px-3.5 py-3 text-left">
              <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-400" />
              <p className="text-[12px] leading-relaxed text-red-300">
                This unsubscribe link is missing information.
              </p>
            </div>
          ) : status === "confirm" || status === "submitting" ? (
            <>
              <div className="w-11 h-11 rounded-full bg-[#D4AF37]/12 border border-[#D4AF37]/30 flex items-center justify-center mx-auto mb-3">
                <MailX size={20} className="text-[#D4AF37]" />
              </div>
              <p className="font-['Rajdhani',sans-serif] font-bold text-white text-lg mb-1">Unsubscribe from marketing emails?</p>
              <p className="text-[15px] text-white mb-5">
                You'll stop receiving marketing emails from Bet Lab. This won't affect account or billing notifications.
              </p>
              <GoldBtn full size="md" onClick={submit} disabled={status === "submitting"}>
                {status === "submitting" ? "Please wait..." : "Confirm unsubscribe"}
                {status !== "submitting" && <ArrowRight size={14} />}
              </GoldBtn>
            </>
          ) : status === "success" ? (
            <>
              <div className="w-11 h-11 rounded-full bg-emerald-500/12 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={20} className="text-emerald-400" />
              </div>
              <p className="font-['Rajdhani',sans-serif] font-bold text-white text-lg mb-1">You're unsubscribed</p>
              <p className="text-[15px] text-white mb-5">You won't receive further marketing emails from Bet Lab.</p>
              <GoldBtn full size="md" onClick={() => nav("dashboard")}>
                Back to Bet Lab <ArrowRight size={14} />
              </GoldBtn>
            </>
          ) : (
            <>
              <div className="flex items-start gap-2 rounded-lg border border-red-400/20 bg-red-400/5 px-3.5 py-3 text-left mb-5">
                <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-400" />
                <p className="text-[12px] leading-relaxed text-red-300">{error}</p>
              </div>
              <GoldBtn full size="md" outline onClick={() => nav("dashboard")}>
                Back to Bet Lab
              </GoldBtn>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
