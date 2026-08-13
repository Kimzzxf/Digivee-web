import { useEffect } from "react";
import { Camera } from "lucide-react";
import PageLoader from "../../components/PageLoader";
import BackButton from "../../components/BackButton";
import { useSewaForm } from "./useSewaForm";
import { useSewaPromoPreview } from "./usePromoPreview";
import { useSewaSubmit } from "./useSewaSubmit";
import { useBookedDates } from "./useBookedDates";
import { useAddressDistanceHint } from "./useAddressDistanceHint";
import SewaBasicFields from "./SewaBasicFields";
import SewaDateTimeFields from "./SewaDateTimeFields";
import SewaPromoPanel from "./SewaPromoPanel";
import SewaSummary from "./SewaSummary";

export default function Sewa() {
  const form = useSewaForm();
  const bookedDates = useBookedDates();
  const distanceHint = useAddressDistanceHint();
  const promo = useSewaPromoPreview({
    customer: form.customer,
    meetPointId: form.meetPointId,
    duration: form.duration,
    jumlah: form.jumlah,
    loyaltyChoice: form.loyaltyChoice,
    tanggalReturn: form.tanggalReturn,
    jamReturn: form.jamReturn,
  });
  const handleConfirm = useSewaSubmit({ form, promo, distanceHint });

  function handleAlamatBlur() {
    if (form.alamat.trim()) distanceHint.checkJarak(form.alamat);
    else {
      distanceHint.resetJarak();
      form.handleMeetPointChange("");
    }
  }

  // Auto-assign zona begitu geocode dari Alamat nemu suggested_zona (lihat
  // handleAlamatBlur di atas). Deps CUMA distanceHint.jarak — bukan
  // form.handleMeetPointChange, yang reference-nya ganti tiap render (dari
  // useSewaFieldHandlers, gak di-memo), jadi kalau ikut masuk deps bakal
  // nge-reset durationId tiap render, bukan cuma pas alamat berubah.
  useEffect(() => {
    const zona = distanceHint.jarak?.suggested_zona;
    if (zona) form.handleMeetPointChange(`zona${zona}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distanceHint.jarak]);

  if (form.loadingCustomer) {
    return <PageLoader />;
  }

  return (
    <section className="w-full min-h-[100dvh] bg-pink text-paper px-5 md:px-8 pt-[calc(4rem+env(safe-area-inset-top))] pb-16 md:pt-[calc(6rem+env(safe-area-inset-top))] md:pb-24">
      <div className="w-full">
        <BackButton />
        <div className="flex items-center gap-2.5 mb-1">
          <Camera className="w-6 h-6 text-paper" />
          <h1 className="font-display text-3xl md:text-4xl">Mulai Sewa</h1>
        </div>
        <p className="font-mono text-xs text-paper/70 mb-8">
          Isi formulir di bawah, jumlah &amp; DP kehitung otomatis dari price
          list.
        </p>

        <form onSubmit={handleConfirm} className="space-y-4 pop-in">
          {form.error && (
            <div className="bg-paper/10 border border-paper/30 rounded-lg px-4 py-3 font-mono text-xs">
              {form.error}
            </div>
          )}

        <SewaBasicFields
          nama={form.nama} setNama={form.setNama}
          alamat={form.alamat} setAlamat={form.setAlamat}
          onAlamatBlur={handleAlamatBlur}
          meetPointId={form.meetPointId} handleMeetPointChange={form.handleMeetPointChange}
          meetPoint={form.meetPoint}
          durationId={form.durationId} handleDurationChange={form.handleDurationChange}
          distanceHint={distanceHint}
        />

        <SewaDateTimeFields
          tanggalPickup={form.tanggalPickup} handlePickupChange={form.handlePickupChange}
          tanggalReturn={form.tanggalReturn} handleReturnChange={form.handleReturnChange}
          jamPickup={form.jamPickup} handleJamPickupChange={form.handleJamPickupChange}
          jamReturn={form.jamReturn} handleJamReturnChange={form.handleJamReturnChange}
          durasiKurangSehari={form.durasiKurangSehari}
          jamReturnDibatasi={form.jamReturnDibatasi}
          jamPickupLocked={form.jamPickupLocked}
          jamReturnLocked={form.jamReturnLocked}
          bookedDates={bookedDates}
        />

        <SewaPromoPanel
          loyaltyBerlaku={promo.loyaltyBerlaku}
          loyaltyBisaDiskon={promo.loyaltyBisaDiskon}
          loyaltyBisaDurasi={promo.loyaltyBisaDurasi}
          loyaltyBonusMenit={promo.loyaltyBonusMenit}
          loyaltyChoice={form.loyaltyChoice} setLoyaltyChoice={form.setLoyaltyChoice}
          bonusMenit={promo.bonusMenit} waktuReturnUsulan={promo.waktuReturnUsulan}
          promoLabel={promo.promoLabel} promoAmount={promo.promoAmount}
        />

        <SewaSummary
          duration={form.duration}
          promoAmount={promo.promoAmount}
          jumlahSetelahPromo={promo.jumlahSetelahPromo}
          jumlah={form.jumlah}
          dp={form.dp}
        />
        </form>
      </div>
    </section>
  );
}
