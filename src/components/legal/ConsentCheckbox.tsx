import type { ReactNode } from "react";

export default function ConsentCheckbox({
  id,
  checked,
  onChange,
  required = true,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label htmlFor={id} className="flex items-start gap-2.5 cursor-pointer">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        required={required}
        aria-required={required}
        className="mt-0.5 w-3.5 h-3.5 flex-shrink-0 accent-[#D4AF37] cursor-pointer"
      />
      <span className="text-[16px] leading-relaxed text-white">
        {children}
        {!required && <span className="text-white"> (optional)</span>}
      </span>
    </label>
  );
}
