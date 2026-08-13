function toDateStr(d) {
  if (!d) return null;
  return new Date(d).toISOString().slice(0, 10);
}

export function serializeCustomer(doc) {
  if (!doc) return null;
  // referredBy may or may not be populated (nama/telp) depending on the
  // query — only attach referred_by_customer when it actually is, so
  // callers that didn't populate don't get a half-filled object.
  const referredByPopulated = doc.referredBy && typeof doc.referredBy === "object" && doc.referredBy.nama;
  return {
    id: doc._id.toString(),
    nama: doc.nama,
    telp: doc.telp,
    alamat: doc.alamat || null,
    referred_by: doc.referredBy ? (referredByPopulated ? doc.referredBy._id.toString() : doc.referredBy.toString()) : null,
    referred_by_customer: referredByPopulated ? { nama: doc.referredBy.nama, telp: doc.referredBy.telp } : null,
    referral_discount_used: Boolean(doc.referralDiscountUsed),
    referral_credits_available: doc.referralCreditsAvailable || 0,
    loyalty_cycles_redeemed: doc.loyaltyCyclesRedeemed || 0,
    created_at: doc.createdAt,
  };
}

// `customerDoc` is optional — pass it when the transaction was fetched with
// the customer populated, to mirror Supabase's `select("*, customers(...)")`.
export function serializeTransaction(doc, customerDoc) {
  if (!doc) return null;
  const out = {
    id: doc._id.toString(),
    customer_id: doc.customerId.toString(),
    zona: doc.zona,
    jarak_km: doc.jarakKm ?? null,
    alamat: doc.alamat,
    titik_meet_point: doc.titikMeetPoint || null,
    kota: doc.kota,
    tanggal_sewa: toDateStr(doc.tanggalSewa),
    tanggal_kembali: toDateStr(doc.tanggalKembali),
    jam_pickup: doc.jamPickup || null,
    jam_kembali: doc.jamKembali || null,
    biaya: doc.biaya,
    denda: doc.denda,
    diskon: doc.diskon || 0,
    diskon_alasan: doc.diskonAlasan || "none",
    denda_alasan: doc.dendaAlasan || "none",
    checklist: doc.checklist || [],
    payment_percent: doc.paymentPercent,
    status: doc.status,
    source: doc.source || "web",
    created_at: doc.createdAt,
  };
  if (customerDoc) {
    out.customers = { nama: customerDoc.nama, telp: customerDoc.telp };
  }
  return out;
}

export function serializeTestimonial(doc) {
  if (!doc) return null;
  const avg =
    (doc.ratingPelayanan + doc.ratingKondisiKamera + doc.ratingProsesSewa) / 3;
  return {
    id: doc._id.toString(),
    nama: doc.nama,
    text: doc.text,
    rating_pelayanan: doc.ratingPelayanan,
    rating_kondisi_kamera: doc.ratingKondisiKamera,
    rating_proses_sewa: doc.ratingProsesSewa,
    rating_average: Math.round(avg * 10) / 10,
    instagram_username: doc.instagramUsername || "",
    photos: doc.photos || [],
    consent_social_media: Boolean(doc.consentSocialMedia),
    approved: Boolean(doc.approved),
    created_at: doc.createdAt,
  };
}
