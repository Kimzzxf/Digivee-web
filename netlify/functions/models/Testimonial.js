import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const testimonialSchema = new Schema({
  customerId: {
    type: Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
    index: true,
    unique: true,
  },
  nama: { type: String, required: true, trim: true },
  text: { type: String, required: true, trim: true, maxlength: 500 },
  ratingPelayanan: { type: Number, required: true, min: 1, max: 10 },
  ratingKondisiKamera: { type: Number, required: true, min: 1, max: 10 },
  ratingProsesSewa: { type: Number, required: true, min: 1, max: 10 },
  instagramUsername: { type: String, trim: true, default: "" },
  photos: {
    type: [String],
    default: [],
    validate: {
      validator: (arr) => arr.length <= 5,
      message: "Maksimal 5 foto.",
    },
  },
  consentSocialMedia: { type: Boolean, default: false },
  approved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default models.Testimonial || model("Testimonial", testimonialSchema);
