import { PartyPopper } from "lucide-react";
import BackButton from "../../components/BackButton";
import AdminSignInPanel from "../../components/AdminSignInPanel";
import { useLoginForm } from "./useLoginForm";
import { STEP_TITLES, stepSubtitle } from "./loginStyles";
import LoginPinStep from "./LoginPinStep";
import LoginRegisterStep from "./LoginRegisterStep";
import LoginSetPinStep from "./LoginSetPinStep";

export default function Login() {
  const f = useLoginForm();

  return (
    <section className="w-full min-h-[100dvh] bg-pink text-paper flex items-center px-5 md:px-8 pt-[calc(4rem+env(safe-area-inset-top))] pb-16">
      <div className="w-full">
        <BackButton />
        <h1 className="font-display text-2xl mb-1">{STEP_TITLES[f.step]}</h1>
        <p className="font-mono text-xs text-paper/70 mb-6">{stepSubtitle(f.step, f.foundNama)}</p>

          {f.refCode && f.step !== "admin" && (
            <div className="bg-ink text-pink rounded-lg px-4 py-3 font-mono text-xs mb-4 flex items-center justify-center gap-1.5 text-center">
              <PartyPopper className="w-3.5 h-3.5 shrink-0" /> Kamu diajak lewat referral — daftar sekarang buat aktifin bonusnya
            </div>
          )}

          {f.notRegistered && f.step === "login" ? (
            <div className="bg-paper/10 border border-paper/30 rounded-lg px-4 py-3 font-mono text-xs mb-4">
              Kamu belum terdaftar sebagai member digivee, yuk{" "}
              <button
                type="button"
                onClick={() => f.setStep("register")}
                className="underline underline-offset-2 hover:opacity-80"
              >
                Gabung Sekarang
              </button>
            </div>
          ) : f.error && (
            <div className="bg-paper/10 border border-paper/30 rounded-lg px-4 py-3 font-mono text-xs mb-4">{f.error}</div>
          )}

          {f.step === "admin" && <AdminSignInPanel onBack={f.backToPhone} />}

          {f.step === "login" && (
            <LoginPinStep
              telp={f.telp} setTelp={f.setTelp}
              pin={f.pin} setPin={f.setPin}
              loading={f.loading} onSubmit={f.handleLoginSubmit}
              onJoinNow={() => f.setStep("register")}
            />
          )}

          {f.step === "register" && (
            <LoginRegisterStep
              nama={f.nama} setNama={f.setNama}
              alamat={f.alamat} setAlamat={f.setAlamat}
              telp={f.telp} setTelp={f.setTelp}
              pin={f.pin} setPin={f.setPin}
              pinConfirm={f.pinConfirm} setPinConfirm={f.setPinConfirm}
              loading={f.loading} onSubmit={f.handleRegisterSubmit} onBack={f.backToPhone}
            />
          )}

          {f.step === "set-pin" && (
            <LoginSetPinStep
              pin={f.pin} setPin={f.setPin}
              pinConfirm={f.pinConfirm} setPinConfirm={f.setPinConfirm}
              loading={f.loading} onSubmit={f.handleSetPinSubmit} onBack={f.backToPhone}
            />
          )}
      </div>
    </section>
  );
}
