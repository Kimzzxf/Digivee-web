import { ArrowUpRight } from "lucide-react";
import Button from "../../components/Button";
import { FIELD, onlyDigits, sanitizeIdentifier } from "./loginStyles";

// Combined WA number + PIN, submitted together — replaces the old
// separate phone-lookup step. Typing an email into the WA field still
// routes to the (undiscoverable) admin sign-in step, same as before.
export default function LoginPinStep({ telp, setTelp, pin, setPin, loading, onSubmit, onJoinNow }) {
  const disabled =
    loading ||
    (telp.includes("@") ? !telp.trim() : onlyDigits(telp).length < 9 || pin.length !== 6);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="font-mono text-xs font-bold block mb-1">No WhatsApp</label>
        <input
          value={telp}
          onChange={(e) => setTelp(sanitizeIdentifier(e.target.value))}
          className={FIELD}
          placeholder="08xxxxxxxxxx"
          autoFocus
        />
      </div>
      <div>
        <label className="font-mono text-xs font-bold block mb-1">PIN (6 Angka)</label>
        <input
          value={pin}
          onChange={(e) => setPin(onlyDigits(e.target.value, 6))}
          type="password"
          inputMode="numeric"
          maxLength={6}
          className={FIELD}
          placeholder="••••••"
        />
      </div>
      <Button type="submit" disabled={disabled} loading={loading} icon={ArrowUpRight} full>
        Masuk
      </Button>
      <p className="font-mono text-xs text-paper/60 text-center">
        Belum gabung jadi member digivee?{" "}
        <button
          type="button"
          onClick={onJoinNow}
          className="text-paper underline underline-offset-2 hover:opacity-80"
        >
          Gabung sekarang
        </button>
      </p>
    </form>
  );
}
