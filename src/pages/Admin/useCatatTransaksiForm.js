import { useState } from "react";
import { api } from "../../lib/api";
import { useNotification } from "../../components/NotificationProvider";
import { EMPTY_FORM } from "./emptyForm";
import usePromoActions from "./usePromoActions";

export default function useCatatTransaksiForm() {
  const [phone, setPhone] = useState("");
  const [customer, setCustomer] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const notify = useNotification();
  const { success, error: notifyError } = notify;
  const promoActions = usePromoActions(form, setForm, notify);

  async function findCustomer(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      const data = await api.get(`/admin/customers/by-phone/${encodeURIComponent(phone)}`, { admin: true });
      setCustomer(data);
      setForm({ ...EMPTY_FORM, kota: "Karawang" });
    } catch (err) {
      setMsg(err.message);
      notifyError(err.message);
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }

  // Scan path: admin's QR scanner reads the customer's own loyalty-card QR
  // (which encodes /login?ref=<id>) and looks them up by id directly —
  // same result shape as findCustomer above, just a different lookup key.
  async function findCustomerById(id) {
    setMsg("");
    setLoading(true);
    try {
      const data = await api.get(`/admin/customers/${encodeURIComponent(id)}`, { admin: true });
      setCustomer(data);
      setForm({ ...EMPTY_FORM, kota: "Karawang" });
    } catch (err) {
      setMsg(err.message);
      notifyError(err.message);
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }

  async function addTransaction(e) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const paymentPercent = Number(form.payment_percent);
      await api.post(
        "/admin/transactions",
        {
          customer_id: customer.id,
          zona: form.zona,
          jarak_km: form.jarak_km ?? null,
          alamat: form.alamat || null,
          titik_meet_point: form.titik_meet_point || null,
          kota: form.kota || null,
          tanggal_sewa: form.tanggal_sewa || null,
          tanggal_kembali: form.tanggal_kembali || null,
          jam_pickup: form.jam_pickup || null,
          jam_kembali: form.jam_kembali || null,
          biaya: Number(form.biaya) || 0,
          denda: Number(form.denda) || 0,
          denda_alasan: form.denda_alasan || "none",
          payment_percent: Number.isFinite(paymentPercent) ? paymentPercent : 100,
          status: form.status,
          diskon: Number(form.diskon) || 0,
          diskon_alasan: form.diskon_alasan || "none",
        },
        { admin: true }
      );
      setMsg("");
      success(`Transaksi ${customer?.nama || ""} berhasil dicatat.`);
      setForm({ ...EMPTY_FORM, kota: form.kota });
      setCustomer(null);
    } catch (err) {
      setMsg(err.message);
      notifyError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return { phone, setPhone, customer, form, setForm, loading, msg, findCustomer, findCustomerById, addTransaction, promoActions };
}
