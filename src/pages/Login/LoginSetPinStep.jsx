import { ArrowUpRight } from "lucide-react";
import Button from "../../components/Button";
import { FIELD_PIN, onlyDigits } from "./loginStyles";
import BackToPhoneButton from "./BackToPhoneButton";

export default function LoginSetPinStep({ pin, setPin, pinConfirm, setPinConfirm, loading, onSubmit, onBack }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="font-mono text-xs font-bold block mb-1">PIN Baru (6 Angka)</label>
        <input
          value={pin}
          onChange={(e) => setPin(onlyDigits(e.target.value, 6))}
          type="password"
          inputMode="numeric"
          maxLength={6}
          className={FIELD_PIN}
          placeholder="••••••"
          required
          autoFocus
        />
      </div>
      <div>
        <label className="font-mono text-xs font-bold block mb-1">Konfirmasi PIN</label>
        <input
          value={pinConfirm}
          onChange={(e) => setPinConfirm(onlyDigits(e.target.value, 6))}
          type="password"
          inputMode="numeric"
          maxLength={6}
          className={FIELD_PIN}
          placeholder="••••••"
          required
        />
      </div>
      <Button
        type="submit"
        disabled={loading || pin.length !== 6 || pinConfirm.length !== 6}
        loading={loading}
        icon={ArrowUpRight}
        full
      >
        Simpan PIN
      </Button>
      <BackToPhoneButton onBack={onBack} />
    </form>
  );
}
