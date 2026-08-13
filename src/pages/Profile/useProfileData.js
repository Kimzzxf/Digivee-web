import { useEffect, useState } from "react";
import { getCurrentCustomer, getTransactions, getReferrals, loyaltyProgress } from "../../lib/customer";

export function useProfileData() {
  const [customer, setCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showReferrals, setShowReferrals] = useState(false);
  const [referrals, setReferrals] = useState(null); // null = belum pernah di-load
  const [loadingReferrals, setLoadingReferrals] = useState(false);
  const [referralsError, setReferralsError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const c = await getCurrentCustomer();
        if (!c) throw new Error("Sesi tidak ditemukan, silakan login ulang.");
        setCustomer(c);
        const tx = await getTransactions(c.id);
        setTransactions(tx);
      } catch (err) {
        setError(err.message || "Gagal memuat profil.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function toggleReferrals() {
    if (showReferrals) {
      setShowReferrals(false);
      return;
    }
    setShowReferrals(true);
    if (referrals !== null) return; // udah pernah di-load, ga perlu fetch ulang
    setLoadingReferrals(true);
    setReferralsError("");
    try {
      const list = await getReferrals(customer.id);
      setReferrals(list);
    } catch (err) {
      setReferralsError(err.message || "Gagal memuat daftar referral.");
    } finally {
      setLoadingReferrals(false);
    }
  }

  // customer.transaction_count comes from GET /customers/:id, which only
  // counts Completed transactions — using that here (instead of
  // transactions.length, which includes every Pending/Ongoing/Cancelled row)
  // keeps the loyalty progress bar in sync with the same eligibility rule
  // Sewa.jsx and Admin.jsx use, so it can't bubble up from unconfirmed or
  // still-in-progress bookings.
  const realTransactionCount = customer?.transaction_count || 0;
  const { cyclePos, eligibleNow } = loyaltyProgress(realTransactionCount);

  return {
    customer,
    setCustomer,
    transactions,
    loading,
    error,
    realTransactionCount,
    cyclePos,
    eligibleNow,
    showReferrals,
    referrals,
    loadingReferrals,
    referralsError,
    toggleReferrals,
  };
}
