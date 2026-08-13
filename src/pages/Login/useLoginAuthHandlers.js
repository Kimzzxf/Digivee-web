import { registerCustomer, setNewPin, loginWithPin } from "../../lib/customer";
import { onlyDigits } from "./loginStyles";

export function useLoginAuthHandlers(state) {
  const {
    telp, nama, alamat, pin, pinConfirm,
    setStep, setError, setLoading, setFoundNama,
    resetPinFields, navigate, next, success, setNotRegistered,
  } = state;

  async function handleLoginSubmit(e) {
    e.preventDefault();
    setError("");
    setNotRegistered(false);

    // Typed an email instead of a WA number — go to the admin sign-in step
    // (nothing on the public form hints this exists).
    if (telp.includes("@")) {
      setStep("admin");
      return;
    }

    const digits = onlyDigits(telp);
    if (digits.length < 9) return setError("Nomor WA belum lengkap.");
    if (pin.length !== 6) return setError("PIN harus 6 angka.");

    setLoading(true);
    try {
      await loginWithPin(digits, pin);
      success("Berhasil masuk.");
      navigate(next || "/profile", { replace: true });
    } catch (err) {
      if (err.payload?.needsPin) {
        setStep("set-pin");
        resetPinFields();
        return;
      }
      if (err.status === 404) {
        setNotRegistered(true);
        return;
      }
      setError(err.message || "Nomor WA atau PIN salah.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterSubmit(e) {
    e.preventDefault();
    setError("");
    const digits = onlyDigits(telp);
    if (digits.length < 9) return setError("Nomor WA belum lengkap.");
    if (pin.length !== 6) return setError("PIN harus 6 angka.");
    if (pin !== pinConfirm) return setError("Konfirmasi PIN tidak sama.");
    setLoading(true);
    try {
      await registerCustomer(nama, digits, pin, alamat);
      success(`Akun berhasil dibuat. Selamat datang, ${nama}!`);
      navigate(next || "/profile", { replace: true });
    } catch (err) {
      if (err.payload?.needsPin) {
        setFoundNama("");
        setStep("set-pin");
        resetPinFields();
        return;
      }
      setError(err.message || "Gagal daftar, coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSetPinSubmit(e) {
    e.preventDefault();
    setError("");
    if (pin.length !== 6) return setError("PIN harus 6 angka.");
    if (pin !== pinConfirm) return setError("Konfirmasi PIN tidak sama.");
    setLoading(true);
    try {
      await setNewPin(telp, pin);
      success("PIN baru berhasil disimpan.");
      navigate(next || "/profile", { replace: true });
    } catch (err) {
      setError(err.message || "Gagal simpan PIN, coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return { handleLoginSubmit, handleRegisterSubmit, handleSetPinSubmit };
}
