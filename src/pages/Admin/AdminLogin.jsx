import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import Button from "../../components/Button";
import { api, saveAdminSession, clearAdminSession } from "../../lib/api";
import { useNotification } from "../../components/NotificationProvider";
import { onlyDigits } from "./shared";

const FIELD =
  "w-full px-0 py-2.5 bg-transparent border-0 border-b border-paper/40 text-paper placeholder:text-paper/50 font-body outline-none transition-colors focus:border-paper";
const FIELD_PIN = `${FIELD} tracking-[0.5em]`;

export default function AdminLogin({ onSuccess }) {
  const [telp, setTelp] = useState("");
  const [pin, setPin] = useState("");
  const [checking, setChecking] = useState(false);
  const [msg, setMsg] = useState("");
  const { success, error: notifyError } = useNotification();

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    setChecking(true);
    try {
      const data = await api.post("/admin/login", { telp, pin });
      saveAdminSession(data.token);
      onSuccess();
      success("Selamat datang kembali, Admin.");
    } catch (err) {
      clearAdminSession();
      const text = err.message || "Nomor atau PIN admin salah.";
      setMsg(text);
      notifyError(text);
    } finally {
      setChecking(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="font-mono text-xs font-bold block mb-1">
          No WA Admin
        </label>
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
        <label className="font-mono text-xs font-bold block mb-1">
          PIN Admin
        </label>
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
        <div className="bg-paper/10 border border-paper/30 rounded-lg px-4 py-3 font-mono text-xs text-center">
          {msg}
        </div>
      )}

      <Button
        type="submit"
        disabled={checking || onlyDigits(telp).length < 9 || pin.length !== 6}
        loading={checking}
        icon={ArrowUpRight}
        full
      >
        Masuk
      </Button>
    </form>
  );
}
