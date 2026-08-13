import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Stands in for the (route-hidden) Navbar on form/admin pages — see
// App.jsx's NO_NAVBAR_PATHS. No hardcoded color: inherits currentColor
// from its section (paper on pink forms, ink on the admin page).
// `to` overrides the default browser-history-back with a fixed
// destination — e.g. the admin dashboard's "back to site" link, where
// history(-1) could land anywhere depending on how the admin got there.
export default function BackButton({ className = "", to, label = "Kembali" }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(to ?? -1)}
      aria-label={label}
      className={`press-btn inline-flex items-center gap-1.5 font-mono text-xs opacity-60 hover:opacity-100 transition-opacity mb-6 ${className}`}
    >
      <ArrowLeft className="w-4 h-4" /> {label}
    </button>
  );
}
