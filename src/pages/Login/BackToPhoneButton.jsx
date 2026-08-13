import { ArrowLeft } from "lucide-react";

export default function BackToPhoneButton({ onBack }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="press-btn w-full flex items-center justify-center gap-1.5 font-mono text-xs text-paper/60 hover:text-paper"
    >
      <ArrowLeft className="w-3.5 h-3.5" /> Ganti nomor WA
    </button>
  );
}
