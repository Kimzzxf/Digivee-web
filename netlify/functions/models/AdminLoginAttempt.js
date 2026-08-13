import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const adminLoginAttemptSchema = new Schema({
  telp: { type: String, required: true, unique: true, index: true },
  failCount: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null },
});

export default models.AdminLoginAttempt ||
  model("AdminLoginAttempt", adminLoginAttemptSchema);
