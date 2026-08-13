import { Loader2, ArrowUpRight } from "lucide-react";
import { FIELD, PRIMARY_BTN, onlyDigits, sanitizeIdentifier } from "./loginStyles";

export default function LoginPhoneStep({ telp, setTelp, loading, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="font-mono text-xs font-bold block mb-1">No WhatsApp</label>
        <input
          value={telp}
          onChange={(e) => setTelp(sanitizeIdentifier(e.target.value))}
          className={FIELD}
          placeholder="08xxxxxxxxxx"
          required
          autoFocus
        />
      </div>
      <button
        type="submit"
        disabled={loading || (!telp.includes("@") && onlyDigits(telp).length < 9)}
        className={PRIMARY_BTN}
      >
        <span>Lanjut</span>
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        )}
      </button>
    </form>
  );
}
