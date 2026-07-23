import { useState } from "react";
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { SectionEyebrow } from "../../app/shared";
import { useLegalPageMeta } from "../../legal/useLegalPageMeta";
import { submitLegalContact, type LegalContactPayload } from "../../services/legal";
import { ApiError } from "../../services/api";

const CATEGORIES: { value: LegalContactPayload["category"]; label: string }[] = [
  { value: "privacy_request", label: "Privacy Request" },
  { value: "legal_question", label: "Legal Question" },
  { value: "copyright_notice", label: "Copyright Notice" },
  { value: "refund_request", label: "Refund Request" },
  { value: "responsible_gambling", label: "Responsible Gambling" },
  { value: "general", label: "General Legal Inquiry" },
];

const inputClass =
  "w-full bg-[#162036] border border-[#D4AF37]/12 rounded px-3.5 py-2.5 text-[13px] text-white placeholder-white/20 focus:outline-none focus:border-[#D4AF37]/45 transition-colors";
const labelClass = "block font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-widest text-white/35 mb-1.5";

export default function LegalContactPage({ onBack }: { onBack: () => void }) {
  const [form, setForm] = useState({ category: "general" as LegalContactPayload["category"], name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState("");

  useLegalPageMeta({
    title: "Legal Contact | Bet Lab",
    description: "Contact Bet Lab's legal team about privacy requests, copyright notices, refunds or other legal questions.",
    path: "/legal/contact",
    breadcrumb: [
      { name: "Legal Centre", path: "/legal" },
      { name: "Legal Contact", path: "/legal/contact" },
    ],
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const message = await submitLegalContact(form);
      setConfirmation(message);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "We could not send your message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-[60px]">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-14 pb-24">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[11px] text-white/35 hover:text-[#D4AF37] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft size={13} aria-hidden="true" /> Back to Legal Centre
        </button>

        <SectionEyebrow>Legal &amp; Policies</SectionEyebrow>
        <h1 className="font-['Rajdhani',sans-serif] font-bold text-[36px] sm:text-[44px] text-white leading-tight mb-3">
          Legal Contact
        </h1>
        <p className="text-white/45 text-[14px] max-w-2xl mb-10">
          Use this form for privacy requests, copyright notices, refund questions, responsible gambling concerns, or
          any other legal inquiry. We aim to respond within a reasonable time.
        </p>

        {confirmation ? (
          <div className="bg-card border border-emerald-500/25 rounded-xl p-6 flex items-start gap-3">
            <CheckCircle2 size={18} aria-hidden="true" className="text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[13px] text-white/70">{confirmation}</p>
          </div>
        ) : (
          <form onSubmit={submit} className="bg-card border border-[#D4AF37]/12 rounded-xl p-7 space-y-4">
            <div>
              <label className={labelClass} htmlFor="legal-contact-category">Category</label>
              <select
                id="legal-contact-category"
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value as LegalContactPayload["category"] })}
                className={inputClass}
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass} htmlFor="legal-contact-name">Full Name</label>
              <input
                id="legal-contact-name"
                type="text"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Your full name"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="legal-contact-email">Email</label>
              <input
                id="legal-contact-email"
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="legal-contact-message">Message</label>
              <textarea
                id="legal-contact-message"
                required
                rows={6}
                maxLength={5000}
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                placeholder="Describe your request..."
                className={`${inputClass} resize-none`}
              />
            </div>

            {error && (
              <div role="alert" className="flex items-start gap-2 text-[12px] text-red-400">
                <AlertCircle size={14} aria-hidden="true" className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#D4AF37] text-[#070E1A] font-['Rajdhani',sans-serif] font-bold text-[14px] uppercase tracking-wide rounded py-3 hover:bg-[#e0bd4a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
