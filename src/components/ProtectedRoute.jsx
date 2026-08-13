import { Navigate, useLocation } from "react-router-dom";
import { getSession } from "../lib/customer";

export default function ProtectedRoute({ children }) {
  const loggedIn = Boolean(getSession());
  const location = useLocation();
  if (!loggedIn) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return children;
}
