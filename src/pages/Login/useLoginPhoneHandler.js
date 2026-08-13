import { checkPhone } from "../../lib/customer";
import { onlyDigits } from "./loginStyles";

export function useLoginPhoneHandler(state) {
  const { telp, setStep, setError, setLoading, setFoundNama } = state;

  return async function handlePhoneSubmit(e) {
    e.preventDefault();
    setError("");

    // Typed an email instead of a WA number — go to the admin sign-in step.
    if (telp.includes("@")) {
      setStep("admin");
      return;
    }

    const digits = onlyDigits(telp);
    if (digits.length < 9) {
      setError("Nomor WA belum lengkap.");
      return;
    }

    setLoading(true);
    try {
      const res = await checkPhone(digits);
      if (!res.exists) {
        setStep("register");
      } else if (!res.hasPin) {
        setFoundNama(res.nama);
        setStep("set-pin");
      } else {
        setFoundNama(res.nama);
        setStep("login");
      }
    } catch (err) {
      setError(err.message || "Gagal memeriksa nomor, coba lagi.");
    } finally {
      setLoading(false);
    }
  };
}
