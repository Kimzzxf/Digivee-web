import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const transactionSchema = new Schema({
  customerId: {
    type: Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
    index: true,
  },
  zona: { type: String, enum: ["1", "2", "3"], required: true },
  jarakKm: { type: Number, default: null },
  alamat: { type: String, default: null },
  titikMeetPoint: { type: String, default: null },
  kota: { type: String, default: null },
  tanggalSewa: { type: Date, default: null },
  tanggalKembali: { type: Date, default: null },
  jamPickup: { type: String, default: null },
  jamKembali: { type: String, default: null },
  biaya: { type: Number, default: 0 },
  denda: { type: Number, default: 0 },
  diskon: { type: Number, default: 0 },
  diskonAlasan: {
    type: String,
    enum: ["none", "referral_baru", "referral_kredit", "loyalty"],
    default: "none",
  },
  dendaAlasan: {
    type: String,
    enum: ["none", "telat", "rusak", "hilang"],
    default: "none",
  },
  checklist: {
    type: [{ item: String, ok: { type: Boolean, default: true } }],
    default: undefined,
  },
  reminderSent: { type: Boolean, default: false },
  h1ReminderSent: { type: Boolean, default: false },
  paymentPercent: { type: Number, default: 100 },
  status: { type: String, default: "Completed" },
  source: { type: String, enum: ["web", "legacy-csv"], default: "web" },
  diskonApplied: { type: Boolean, default: false },
  legacyOrderId: { type: String, index: true, sparse: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});

export default models.Transaction || model("Transaction", transactionSchema);
