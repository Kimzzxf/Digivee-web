import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getReferralCodeFromUrl, getNextFromUrl } from "../../lib/customer";
import { useNotification } from "../../components/NotificationProvider";

// Raw state shared by every Login step — split out so the handler hooks
// (useLoginAuthHandlers) can each stay short.
export function useLoginState() {
  const [step, setStep] = useState("login"); // login | register | set-pin | admin
  const [telp, setTelp] = useState("");
  const [nama, setNama] = useState("");
  const [alamat, setAlamat] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [foundNama, setFoundNama] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notRegistered, setNotRegistered] = useState(false); // 404 on login: WA number has no account yet
  const navigate = useNavigate();
  const refCode = getReferralCodeFromUrl();
  const next = getNextFromUrl();
  const { success } = useNotification();

  function resetPinFields() {
    setPin("");
    setPinConfirm("");
    setError("");
  }

  // "Ganti nomor WA" from register/set-pin steps — login is the first
  // screen now (no separate phone-only step), so back goes there.
  function backToPhone() {
    setStep("login");
    resetPinFields();
  }

  return {
    step, setStep, telp, setTelp, nama, setNama, alamat, setAlamat, pin, setPin,
    pinConfirm, setPinConfirm, foundNama, setFoundNama,
    loading, setLoading, error, setError, notRegistered, setNotRegistered,
    navigate, refCode, next, success,
    resetPinFields, backToPhone,
  };
}
