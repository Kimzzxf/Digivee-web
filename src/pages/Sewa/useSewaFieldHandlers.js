import { getDuration, MEET_POINT_NOTES } from "../../lib/pricelist";
import { addDays } from "./sewaHelpers";

// Change handlers for the Sewa form fields — split out of useSewaForm so
// each file stays short; takes the raw state setters from useSewaFieldState.
export function useSewaFieldHandlers(state) {
  const {
    meetPointId, setMeetPointId, setDurationId,
    returnEdited, setReturnEdited, tanggalPickup, setTanggalReturn,
    jamPickup, setJamPickup, setJamReturn,
    jamDriver, setJamDriver,
    duration, durasiKurangSehari, setMeetPointNote,
    nama, alamat, durationId, tanggalReturn, jamReturn,
  } = state;

  function handleMeetPointChange(id) {
    setMeetPointId(id);
    setDurationId("");
    setReturnEdited(false);
    setTanggalReturn("");
    // Ganti meet point -> jam pickup/return dibuka lagi dari nol, siapapun
    // boleh dipilih duluan lagi (lihat handleJamPickupChange/ReturnChange).
    setJamPickup("");
    setJamReturn("");
    setJamDriver(null);
    setMeetPointNote(MEET_POINT_NOTES[id] || "");
  }

  function handleDurationChange(id) {
    setDurationId(id);
    const d = getDuration(meetPointId, id);
    if (d && d.days === 0) {
      // Durasi jam/menit -> return dikunci sama persis dengan pickup.
      setTanggalReturn(tanggalPickup);
      setJamReturn(jamPickup);
      setReturnEdited(false);
      return;
    }
    // auto-suggest tanggal return dari jumlah hari durasi, kecuali
    // customer udah pernah edit manual. Jam pickup/return nggak perlu
    // resync di sini lagi — handleJamPickupChange/ReturnChange di bawah
    // udah jagain dua-duanya tetep sama selama salah satu jadi driver.
    if (!returnEdited && tanggalPickup && d) {
      setTanggalReturn(addDays(tanggalPickup, d.days));
    }
  }

  function handlePickupChange(value) {
    state.setTanggalPickup(value);
    if (durasiKurangSehari) {
      setTanggalReturn(value);
    } else if (!returnEdited && duration) {
      setTanggalReturn(addDays(value, duration.days));
    }
  }

  function handleReturnChange(value) {
    setTanggalReturn(value);
    setReturnEdited(true);
  }

  function handleJamPickupChange(value) {
    setJamPickup(value);
    // Belum ada driver -> pickup yang dipilih duluan, jadi return ngikut &
    // kekunci. Return field sendiri kalau lagi jadi driver ("return")
    // otomatis nggak bisa ngirim ke sini (fieldnya disabled), jadi cuma 2
    // kondisi nyata yang bisa nyampe sini: belum ada driver, atau pickup
    // emang udah drivernya.
    if (!jamDriver) setJamDriver("pickup");
    if (jamDriver !== "return") setJamReturn(value);
  }

  function handleJamReturnChange(value) {
    setJamReturn(value);
    if (!jamDriver) setJamDriver("return");
    if (jamDriver !== "pickup") setJamPickup(value);
  }

  function validate() {
    if (!nama.trim()) return "Nama wajib diisi.";
    if (!alamat.trim()) return "Alamat wajib diisi.";
    if (!meetPointId) return "Zona belum kedeteksi dari alamat — cek lagi alamatnya, atau pilih ambil sendiri di toko.";
    if (!durationId) return "Pilih durasi sewa dulu.";
    if (!tanggalPickup) return "Pilih tanggal pickup.";
    if (!tanggalReturn) return "Pilih tanggal return.";
    if (!jamPickup) return "Pilih jam pickup.";
    if (!jamReturn) return "Pilih jam return.";
    if (tanggalReturn < tanggalPickup)
      return "Tanggal return nggak boleh sebelum tanggal pickup.";
    if (tanggalReturn === tanggalPickup && jamReturn < jamPickup) {
      return "Jam return nggak boleh sebelum jam pickup di tanggal yang sama.";
    }
    return "";
  }

  return {
    handleMeetPointChange, handleDurationChange,
    handlePickupChange, handleReturnChange,
    handleJamPickupChange, handleJamReturnChange,
    validate,
  };
}
