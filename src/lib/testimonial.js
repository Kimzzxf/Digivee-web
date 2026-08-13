import { api } from "./api.js";

/** Logged-in customer submitting their own review. Server re-checks
 * eligibility (a Completed rental, one review per account) — this is
 * just the request shape. */
export async function submitTestimonial(
  customerId,
  { text, ratingPelayanan, ratingKondisiKamera, ratingProsesSewa, instagramUsername, photos, consentSocialMedia },
) {
  return api.post(
    `/customers/${customerId}/testimonials`,
    {
      text,
      rating_pelayanan: ratingPelayanan,
      rating_kondisi_kamera: ratingKondisiKamera,
      rating_proses_sewa: ratingProsesSewa,
      instagram_username: instagramUsername || "",
      photos: photos || [],
      consent_social_media: Boolean(consentSocialMedia),
    },
    { customer: true },
  );
}

/** Public feed for the landing page — no auth. */
export async function getPublicTestimonials() {
  return api.get("/testimonials");
}
