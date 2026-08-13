import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export function useBookedDates() {
  const [booked, setBooked] = useState([]);
  useEffect(() => {
    api
      .get("/availability/booked-dates")
      .then((data) => setBooked(data?.booked || []))
      .catch(() => {});
  }, []);
  return booked;
}
