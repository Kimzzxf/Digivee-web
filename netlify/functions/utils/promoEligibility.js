import { isDiscountEligible, REFERRAL_DISCOUNT, LOYALTY_DISCOUNT, loyaltyBonusMinutes } from "../../../src/lib/discount.js";

// Mirrors the precedence in Sewa.jsx exactly: referral (as the invited
// friend) beats referral (as the inviter) beats loyalty, and referral &
// loyalty never stack on the same transaction. Used only by
// POST /customers/:id/transactions/pending, which recomputes price/promo
// server-side instead of trusting the client (see that route for why).
export function computePendingTxPromo({ customer, zona, jumlah, transactionCount, loyaltyChoice, durationMinutes }) {
  const referralSebagaiTeman = Boolean(customer.referredBy) && !customer.referralDiscountUsed;
  const referralSebagaiPengajak = (customer.referralCreditsAvailable || 0) > 0;
  const loyaltySiapDitukar =
    transactionCount >= 4 && Math.floor(transactionCount / 4) > (customer.loyaltyCyclesRedeemed || 0);
  const loyaltyBerlaku = loyaltySiapDitukar && !referralSebagaiTeman && !referralSebagaiPengajak;
  const loyaltyBisaDiskon = loyaltyBerlaku && isDiscountEligible(zona, jumlah, LOYALTY_DISCOUNT);

  let diskonAlasan = "none";
  let diskon = 0;
  let bonusMenit = 0;
  if (referralSebagaiTeman && isDiscountEligible(zona, jumlah, REFERRAL_DISCOUNT)) {
    diskonAlasan = "referral_baru";
    diskon = REFERRAL_DISCOUNT;
  } else if (referralSebagaiPengajak && isDiscountEligible(zona, jumlah, REFERRAL_DISCOUNT)) {
    diskonAlasan = "referral_kredit";
    diskon = REFERRAL_DISCOUNT;
  } else if (loyaltyBerlaku) {
    if (loyaltyChoice === "duration") {
      diskonAlasan = "loyalty";
      bonusMenit = loyaltyBonusMinutes(durationMinutes);
    } else if (loyaltyBisaDiskon) {
      diskonAlasan = "loyalty";
      diskon = LOYALTY_DISCOUNT;
    }
  }
  return { diskonAlasan, diskon, bonusMenit };
}

// Shared by POST /admin/transactions (fires immediately) and
// PATCH /admin/transactions/:id (fires the first time a row is marked
// Completed) — applies the side effects a given diskonAlasan implies.
export async function applyPromoSideEffects(Customer, customerId, diskonAlasan) {
  if (diskonAlasan === "referral_baru") {
    const customer = await Customer.findByIdAndUpdate(customerId, { referralDiscountUsed: true }, { new: true });
    if (customer?.referredBy) {
      await Customer.findByIdAndUpdate(customer.referredBy, { $inc: { referralCreditsAvailable: 1 } });
    }
  } else if (diskonAlasan === "referral_kredit") {
    await Customer.findByIdAndUpdate(customerId, { $inc: { referralCreditsAvailable: -1 } });
  } else if (diskonAlasan === "loyalty") {
    await Customer.findByIdAndUpdate(customerId, { $inc: { loyaltyCyclesRedeemed: 1 } });
  }
}
