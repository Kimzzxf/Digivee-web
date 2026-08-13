import { useEffect, useState } from "react";
import { getCurrentCustomer } from "../../lib/customer";
import { getMeetPoint, getDuration } from "../../lib/pricelist";

export function useSewaFieldState() {
  const [customer, setCustomer] = useState(null);
  const [loadingCustomer, setLoadingCustomer] = useState(true);

  const [nama, setNama] = useState("");
  // Alamat = alamat antar/jemput beneran buat sewa ini (bisa beda dari
  // alamat rumah customer di profile — sama kayak Transaction.alamat di
  // backend/models/Customer.js: "drop-off address ... can differ every
  // time"). Dulu field ini kepakai buat nyimpen Titik Meet Point (lihat
  // meetPointNote di bawah), ketuker sama field yang beda artinya.
  const [alamat, setAlamat] = useState("");
  const [meetPointNote, setMeetPointNote] = useState("");
  const [meetPointId, setMeetPointId] = useState("");
  const [durationId, setDurationId] = useState("");
  const [tanggalPickup, setTanggalPickup] = useState("");
  const [tanggalReturn, setTanggalReturn] = useState("");
  const [returnEdited, setReturnEdited] = useState(false);
  const [jamPickup, setJamPickup] = useState("");
  const [jamReturn, setJamReturn] = useState("");
  // Siapa yang dipilih user duluan antara jam pickup/return: itu yang jadi
  // "driver" (tetep aktif, boleh diubah), yang satunya ngikut nilainya
  // terus dan dikunci (disabled) — bukan cuma auto-suggest sekali kayak
  // sebelumnya (jamReturnEdited), tapi kekunci beneran biar nggak ada dua
  // sumber kebenaran buat satu waktu balik.
  const [jamDriver, setJamDriver] = useState(null); // null | "pickup" | "return"
  const [error, setError] = useState("");
  // Poin loyalitas cuma boleh ditukar jadi SATU dari dua reward — customer
  // pilih lewat radio button di bawah. Default ke "discount" karena itu
  // yang paling universal (nominalnya selalu sama, sementara bonus durasi
  // besarnya beda-beda tergantung durasi yang dipilih).
  const [loyaltyChoice, setLoyaltyChoice] = useState("discount");

  useEffect(() => {
    (async () => {
      const c = await getCurrentCustomer();
      if (c) {
        setNama(c.nama);
        // Prefill dari alamat rumah di profile — starting point aja,
        // tetep bisa diedit customer kalau titik antar/jemput sewa ini
        // beda dari alamat rumahnya. Beda sama meetPointNote di bawah,
        // yang emang cuma boleh kederivasi dari MEET_POINT_NOTES pas
        // pilih meet point, bukan dari alamat customer.
        if (c.alamat) setAlamat(c.alamat);
      }
      setCustomer(c);
      setLoadingCustomer(false);
    })();
  }, []);

  const meetPoint = getMeetPoint(meetPointId);
  const duration = getDuration(meetPointId, durationId);
  const jumlah = duration?.price || 0;
  const dp = Math.round(jumlah * 0.5);

  // Durasi < 1 hari (hitungan menit/jam) -> tanggal & jam return otomatis
  // ngikutin pickup, field-nya dikunci biar nggak bisa digeser manual.
  const durasiKurangSehari = Boolean(duration && duration.days === 0);
  // Jam return cuma dibatasin (nggak boleh lebih awal dari jam pickup)
  // kalau tanggal return-nya sama persis dengan tanggal pickup.
  const jamReturnDibatasi = Boolean(
    tanggalPickup && tanggalReturn && tanggalReturn === tanggalPickup,
  );
  // Field yang BUKAN driver terkunci — durasi < 1 hari selalu ngunci
  // return (kayak sebelumnya), di luar itu tinggal liat siapa yang
  // dipilih duluan.
  const jamPickupLocked = jamDriver === "return";
  const jamReturnLocked = durasiKurangSehari || jamDriver === "pickup";

  return {
    customer, loadingCustomer,
    nama, setNama, alamat, setAlamat, meetPointNote, setMeetPointNote,
    meetPointId, setMeetPointId, durationId, setDurationId,
    meetPoint, duration, jumlah, dp,
    tanggalPickup, setTanggalPickup, tanggalReturn, setTanggalReturn,
    returnEdited, setReturnEdited,
    jamPickup, setJamPickup, jamReturn, setJamReturn,
    jamDriver, setJamDriver,
    error, setError, loyaltyChoice, setLoyaltyChoice,
    durasiKurangSehari, jamReturnDibatasi, jamPickupLocked, jamReturnLocked,
  };
}
