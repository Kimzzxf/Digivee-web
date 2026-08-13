import { useState } from "react";
import { Loader2, Search, Plus, ScanLine } from "lucide-react";
import { hitungHPP, formatRupiah } from "../../lib/hpp";
import TransaksiFormFields from "./TransaksiFormFields";
import PromoPanel from "./PromoPanel";
import QrScanModal from "./QrScanModal";
import useCatatTransaksiForm from "./useCatatTransaksiForm";

export default function CatatTransaksi() {
  const { phone, setPhone, customer, form, setForm, loading, msg, findCustomer, findCustomerById, addTransaction, promoActions } =
    useCatatTransaksiForm();
  const [scanning, setScanning] = useState(false);

  const hpp = hitungHPP(form.zona, form.jarak_km);
  const previewTotal = (Number(form.biaya) || 0) + (Number(form.denda) || 0);
  const previewKeuntungan = previewTotal - hpp;

  return (
    <div>
      <form onSubmit={findCustomer} className="edit-frame bg-paper p-4 mb-4 md:p-5 md:mb-6 flex gap-2">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="No WA customer"
          className="flex-1 px-3 py-2 rounded-lg border border-ink/15 bg-paper text-ink font-mono text-sm outline-none transition-colors focus:border-pink"
        />
        <button className="press-btn px-4 rounded-full bg-ink text-paper flex items-center gap-1 font-body font-bold text-sm hover:opacity-90 transition-opacity">
          <Search className="w-4 h-4" /> Cari
        </button>
        <button
          type="button"
          onClick={() => setScanning(true)}
          className="press-btn px-4 rounded-full border-3 border-ink text-ink flex items-center gap-1 font-body font-bold text-sm hover:bg-ink hover:text-paper transition-colors"
        >
          <ScanLine className="w-4 h-4" /> Scan QR
        </button>
      </form>

      {scanning && (
        <QrScanModal
          onScan={(id) => {
            setScanning(false);
            findCustomerById(id);
          }}
          onClose={() => setScanning(false)}
        />
      )}

      {msg && <p className="font-mono text-xs mb-4 bg-pink/15 border border-pink/40 rounded-lg inline-block px-4 py-3">{msg}</p>}

      {customer && (
        <form onSubmit={addTransaction} className="edit-frame bg-paper p-4 md:p-5 space-y-3 pop-in">
          <p className="font-mono text-sm mb-1">
            <strong>{customer.nama}</strong> · {customer.telp}
          </p>

          {/* key={customer.id}: form data already gets a hard reset on
              customer switch (see useCatatTransaksiForm) — this makes the
              DOM follow suit, so a half-picked HourMinuteSelect (jam chosen,
              menit not yet) from the previous customer can't linger visually
              when the underlying value is still "" both before and after. */}
          <TransaksiFormFields key={customer.id} form={form} setForm={setForm} />

          <PromoPanel customer={customer} form={form} actions={promoActions} />

          {Number(form.biaya) > 0 && (
            <div className="rounded-lg border border-dashed border-ink/25 px-3 py-2 font-mono text-xs">
              HPP zona {form.zona}: <strong>{formatRupiah(hpp)}</strong> · Total: <strong>{formatRupiah(previewTotal)}</strong> · Keuntungan:{" "}
              <strong style={{ color: previewKeuntungan < 0 ? "#c0264d" : "inherit" }}>{formatRupiah(previewKeuntungan)}</strong>
            </div>
          )}

          <button
            disabled={loading}
            className="press-btn w-full py-3 bg-pink text-white font-body font-bold rounded-full flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Simpan Transaksi
          </button>
        </form>
      )}
    </div>
  );
}
