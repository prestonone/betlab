import { useState } from "react";
import { Check, LifeBuoy, Scale, ShieldCheck, Send, AlertCircle } from "lucide-react";
import { GoldBtn, SectionEyebrow } from "../app/shared";
import { LEGAL_SUPPORT_EMAIL, LEGAL_EMAIL, LEGAL_PRIVACY_EMAIL } from "../legal/config";
import { submitLegalContact } from "../services/legal";
import { ApiError } from "../services/api";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await submitLegalContact({
        category: "general",
        name: form.name,
        email: form.email,
        message: form.subject ? `Subject: ${form.subject}\n\n${form.message}` : form.message,
      });
      setSent(true);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "We could not send your message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-[60px]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 pb-24">
        <div className="mb-12">
          <SectionEyebrow>Get In Touch</SectionEyebrow>
          <h1 className="font-['Rajdhani',sans-serif] font-bold text-[52px] text-white">CONTACT US</h1>
        </div>

        <div className="grid lg:grid-cols-[1fr_280px] gap-8">
          {/* Form */}
          <div className="bg-card border border-[#D4AF37]/12 rounded-xl p-7">
            {sent ? (
              <div className="py-14 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-500/12 border border-emerald-500/25 flex items-center justify-center mx-auto mb-4">
                  <Check size={24} className="text-emerald-400" />
                </div>
                <h3 className="font-['Rajdhani',sans-serif] font-bold text-[26px] text-white mb-2">Message Sent</h3>
                <p className="text-[16px] text-white">We aim to respond within a reasonable time.</p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-[JetBrains_Mono,monospace] text-[11px] uppercase tracking-widest text-white mb-1.5">Name</label>
                    <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Your name"
                      className="w-full bg-[#162036] border border-[#D4AF37]/12 rounded px-3.5 py-2.5 text-[16px] text-white placeholder-white/18 focus:outline-none focus:border-[#D4AF37]/40 transition-colors" />
                  </div>
                  <div>
                    <label className="block font-[JetBrains_Mono,monospace] text-[11px] uppercase tracking-widest text-white mb-1.5">Email</label>
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="you@example.com"
                      className="w-full bg-[#162036] border border-[#D4AF37]/12 rounded px-3.5 py-2.5 text-[16px] text-white placeholder-white/18 focus:outline-none focus:border-[#D4AF37]/40 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block font-[JetBrains_Mono,monospace] text-[11px] uppercase tracking-widest text-white mb-1.5">Subject</label>
                  <input type="text" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required placeholder="How can we help?"
                    className="w-full bg-[#162036] border border-[#D4AF37]/12 rounded px-3.5 py-2.5 text-[16px] text-white placeholder-white/18 focus:outline-none focus:border-[#D4AF37]/40 transition-colors" />
                </div>
                <div>
                  <label className="block font-[JetBrains_Mono,monospace] text-[11px] uppercase tracking-widest text-white mb-1.5">Message</label>
                  <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required rows={6} placeholder="Tell us more..."
                    className="w-full bg-[#162036] border border-[#D4AF37]/12 rounded px-3.5 py-2.5 text-[16px] text-white placeholder-white/18 focus:outline-none focus:border-[#D4AF37]/40 transition-colors resize-none" />
                </div>
                {error && (
                  <div role="alert" className="flex items-start gap-2 text-[12px] text-red-400">
                    <AlertCircle size={14} aria-hidden="true" className="shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </div>
                )}
                <GoldBtn full size="md" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send Message"} <Send size={13} aria-hidden="true" />
                </GoldBtn>
              </form>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-card border border-[#D4AF37]/8 rounded-xl p-5">
              <h3 className="font-['Rajdhani',sans-serif] font-bold text-[18px] text-white mb-4">Contact Details</h3>
              {[
                { icon: <LifeBuoy size={14} aria-hidden="true" />, label: "Support", val: LEGAL_SUPPORT_EMAIL },
                { icon: <Scale size={14} aria-hidden="true" />, label: "Legal", val: LEGAL_EMAIL },
                { icon: <ShieldCheck size={14} aria-hidden="true" />, label: "Privacy", val: LEGAL_PRIVACY_EMAIL },
              ].map((c, i) => (
                <div key={i} className="flex items-center gap-3 py-3 border-b border-white/[0.04] last:border-0">
                  <div className="w-7 h-7 rounded bg-[#D4AF37]/8 flex items-center justify-center text-[#D4AF37] flex-shrink-0">{c.icon}</div>
                  <div>
                    <p className="font-[JetBrains_Mono,monospace] text-[11px] text-white uppercase tracking-widest">{c.label}</p>
                    <p className="text-[15px] text-white mt-0.5">{c.val}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-card border border-[#D4AF37]/8 rounded-xl p-5">
              <h3 className="font-['Rajdhani',sans-serif] font-bold text-[16px] text-white mb-2">Response Time</h3>
              <p className="text-[16px] text-white leading-relaxed mb-3">We respond to all enquiries within 24 hours on business days.</p>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-[JetBrains_Mono,monospace] text-[9px] text-emerald-400">Support online now</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
