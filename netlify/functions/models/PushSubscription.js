import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const pushSubscriptionSchema = new Schema({
  endpoint: { type: String, required: true, unique: true, index: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: "Customer",
    default: null,
    index: true,
  },
  createdAt: { type: Date, default: Date.now },
});

export default models.PushSubscription ||
  model("PushSubscription", pushSubscriptionSchema);
