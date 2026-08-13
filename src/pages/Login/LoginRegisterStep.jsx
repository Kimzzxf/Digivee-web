import { ArrowUpRight } from "lucide-react";
import Button from "../../components/Button";
import { FIELD, FIELD_PIN, onlyDigits } from "./loginStyles";
import BackToPhoneButton from "./BackToPhoneButton";

export default function LoginRegisterStep({
  nama, setNama, alamat, setAlamat, telp, setTelp,
  pin, setPin, pinConfirm, setPinConfirm, loading, onSubmit, onBack,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="font-mono text-xs font-bold block mb-1">Nama</label>
        <input
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          className={FIELD}
          placeholder="Nama kamu"
          required
          autoFocus
        />
      </div>
      <div>
        <label className="font-mono text-xs font-bold block mb-1">Alamat</label>
        <input
          value={alamat}
          onChange={(e) => setAlamat(e.target.value)}
          className={FIELD}
          placeholder="Alamat lengkap kamu"
          required
        />
      </div>
      <div>
        <label className="font-mono text-xs font-bold block mb-1">No WhatsApp</label>
        <input
          value={telp}
          onChange={(e) => setTelp(onlyDigits(e.target.value))}
          className={FIELD}
          placeholder="08xxxxxxxxxx"
          required
        />
      </div>
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
        disabled={loading || !nama.trim() || !alamat.trim() || onlyDigits(telp).length < 9 || pin.length !== 6 || pinConfirm.length !== 6}
        loading={loading}
        icon={ArrowUpRight}
        full
      >
        Daftar
      </Button>
      <BackToPhoneButton onBack={onBack} />
    </form>
  );
}
