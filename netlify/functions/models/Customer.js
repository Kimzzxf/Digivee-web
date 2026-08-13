import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const customerSchema = new Schema({
  nama: { type: String, required: true, trim: true },
  telp: { type: String, required: true, unique: true, index: true },
  alamat: { type: String, default: null, trim: true },
  pinHash: { type: String, default: null },
  pinFailCount: { type: Number, default: 0 },
  pinLockedUntil: { type: Date, default: null },
  referredBy: { type: Schema.Types.ObjectId, ref: "Customer", default: null },
  referralDiscountUsed: { type: Boolean, default: false },
  referralCreditsAvailable: { type: Number, default: 0 },
  loyaltyCyclesRedeemed: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export default models.Customer || model("Customer", customerSchema);
