import { useState } from "react";
import { ArrowRight, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import AnimatedLogoMark from "../components/AnimatedLogoMark";
import { Page, GoldBtn } from "../app/shared";
import { AuthApiError, confirmPasswordReset } from "../services/auth";

export default function ResetPasswordPage({ nav }: { nav: (p: Page) => void }) {
  const params = new URLSearchParams(window.location.search);
  const uid = params.get("uid") ?? "";
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const invalidLink = !uid || !token;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await confirmPasswordReset({
        uid,
        token,
        new_password: password,
        new_password_confirm: passwordConfirm,
      });
      setDone(true);
    } catch (requestError) {
      if (requestError instanceof AuthApiError || requestError instanceof Error) {
        setError(requestError.message);
      } else {
        setError("Unable to connect to Bet Lab. Please confirm the backend is running.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-[60px] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <AnimatedLogoMark size={48} radius={10} className="mx-auto mb-4" />
          <h1 className="font-['Rajdhani',sans-serif] font-bold text-[36px] text-white mb-1">RESET PASSWORD</h1>
          <p className="text-[15px] text-white">Choose a new password for your account</p>
        </div>

        <div className="bg-card border border-[#D4AF37]/12 rounded-xl p-7">
          {invalidLink ? (
            <div className="flex items-start gap-2 rounded-lg border border-red-400/20 bg-red-400/5 px-3.5 py-3">
              <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-400" />
              <p className="text-[12px] leading-relaxed text-red-300">
                This reset link is missing information. Request a new one from the sign-in page.
              </p>
            </div>
          ) : done ? (
            <div className="text-center py-4">
              <div className="w-11 h-11 rounded-full bg-emerald-500/12 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={20} className="text-emerald-400" />
              </div>
              <p className="font-['Rajdhani',sans-serif] font-bold text-white text-lg mb-1">Password updated</p>
              <p className="text-[15px] text-white mb-5">You can now sign in with your new password.</p>
              <GoldBtn full size="md" onClick={() => nav("login")}>
                Go to sign in <ArrowRight size={14} />
              </GoldBtn>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block font-[JetBrains_Mono,monospace] text-[11px] uppercase tracking-widest text-white mb-1.5">New Password</label>
                <div className="relative">
                  <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white" />
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="••••••••"
                    className="w-full bg-[#162036] border border-[#D4AF37]/12 rounded pl-9 pr-9 py-2.5 text-[16px] text-white placeholder-white/20 focus:outline-none focus:border-[#D4AF37]/45 transition-colors"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white hover:text-[#D4AF37] cursor-pointer">
                    {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-[JetBrains_Mono,monospace] text-[11px] uppercase tracking-widest text-white mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white" />
                  <input
                    type={showPass ? "text" : "password"}
                    value={passwordConfirm}
                    onChange={e => setPasswordConfirm(e.target.value)}
                    required
                    minLength={8}
                    placeholder="••••••••"
                    className="w-full bg-[#162036] border border-[#D4AF37]/12 rounded pl-9 pr-3.5 py-2.5 text-[16px] text-white placeholder-white/20 focus:outline-none focus:border-[#D4AF37]/45 transition-colors"
                  />
                </div>
              </div>

              {error && (
                <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-400/20 bg-red-400/5 px-3.5 py-3">
                  <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-400" />
                  <p className="text-[12px] leading-relaxed text-red-300">{error}</p>
                </div>
              )}

              <GoldBtn full size="md">
                {isSubmitting ? "Please wait..." : "Reset Password"}
                {!isSubmitting && <ArrowRight size={14} />}
              </GoldBtn>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
