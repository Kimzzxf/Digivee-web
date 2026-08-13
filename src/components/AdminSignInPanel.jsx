import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { api, saveAdminSession } from "../lib/api";
import { ADMIN_PATH } from "../lib/adminPath";
import { useNotification } from "./NotificationProvider";
import Button from "./Button";

// Rendered as one of the steps on the normal /login page — reached by
// typing an email into the WA-number field instead of a phone number.
// Nothing about the public form hints this exists. Once here, the real
// gate is server-side: the WA number typed below has to be in
// ADMIN_ALLOWED_PHONES *and* the PIN has to match ADMIN_PIN — nothing
// here is trusted client-side, this only wires the form up.
function onlyDigits(value, maxLen) {
  const digits = value.replace(/[^0-9]/g, "");
  return maxLen ? digits.slice(0, maxLen) : digits;
}

const FIELD =
  "w-full px-0 py-2.5 bg-transparent border-0 border-b border-paper/40 text-paper placeholder:text-paper/50 font-body outline-none transition-colors focus:border-paper";
const FIELD_PIN = `${FIELD} tracking-[0.5em]`;

export default function AdminSignInPanel({ onBack }) {
  const [telp, setTelp] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();
  const { success, error: notifyError } = useNotification();

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      const data = await api.post("/admin/login", { telp, pin });
      saveAdminSession(data.token);
      success("Selamat datang kembali, Admin.");
      navigate(ADMIN_PATH);
    } catch (err) {
      const text = err.message || "Nomor atau PIN admin salah.";
      setMsg(text);
      notifyError(text);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="font-mono text-xs font-bold block mb-1">No WA Admin</label>
          <input
            value={telp}
            onChange={(e) => setTelp(onlyDigits(e.target.value))}
            className={FIELD}
            placeholder="08xxxxxxxxxx"
            required
            autoFocus
          />
        </div>
        <div>
          <label className="font-mono text-xs font-bold block mb-1">PIN Admin</label>
          <input
            value={pin}
            onChange={(e) => setPin(onlyDigits(e.target.value, 6))}
            type="password"
            inputMode="numeric"
            maxLength={6}
            className={FIELD_PIN}
            placeholder="••••••"
            required
          />
        </div>

        {msg && (
          <div className="bg-paper/10 border border-paper/30 rounded-lg px-4 py-3 font-mono text-xs text-center">{msg}</div>
        )}

        <Button
          type="submit"
          disabled={loading || onlyDigits(telp).length < 9 || pin.length !== 6}
          loading={loading}
          icon={ArrowUpRight}
          full
        >
          Masuk
        </Button>
      </form>

      <button
        type="button"
        onClick={onBack}
        className="press-btn w-full flex items-center justify-center gap-1.5 font-mono text-xs text-paper/60 hover:text-paper"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Kembali
      </button>
    </div>
  );
}
