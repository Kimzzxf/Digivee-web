import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { ADMIN_PATH } from "../../lib/adminPath";

// Right-hand side of the sticky bar: account state and the hamburger.
// Instagram/Whatsapp used to sit here too — now live as regular entries
// in the hamburger overlay's link list (under Promo) instead of twice.
export default function NavbarActions({ loggedIn, isAdmin, scrolled, onLogout, open, onToggle }) {
  return (
    <div className="flex items-center gap-1 md:gap-4">
      {isAdmin && (
        <Link
          to={ADMIN_PATH}
          className="press-btn group flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-bold hover:opacity-80"
        >
          Dashboard
          <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      )}
      {loggedIn ? (
        <>
          <Link
            to="/profile"
            className={`press-btn hidden sm:flex items-center gap-1.5 px-3 py-1.5 font-body font-normal text-sm ${
              scrolled || open ? "hover:text-pink" : "hover:text-ink"
            }`}
          >
            Profile Saya
          </Link>
          <button
            onClick={onLogout}
            className={`press-btn hidden sm:flex items-center gap-1.5 px-3 py-1.5 font-body font-normal text-sm ${
              scrolled || open ? "hover:text-pink" : "hover:text-ink"
            }`}
          >
            Keluar
          </button>
        </>
      ) : (
        <Link
          to="/login"
          className={`btn-outline press-btn flex items-center gap-1.5 px-3 py-1.5 font-body font-normal text-sm ${
            scrolled || open ? "btn-outline--ink" : "btn-outline--paper"
          }`}
        >
          Login
        </Link>
      )}

      <button
        onClick={onToggle}
        aria-label={open ? "Tutup menu" : "Buka menu"}
        aria-expanded={open}
        className={`press-btn burger${open ? " burger--open" : ""} w-11 h-11 flex flex-col items-center justify-center gap-2 hover:text-ink active:text-ink`}
      >
        <span className="burger-line burger-line--top w-8" />
        <span className="burger-line burger-line--mid w-8" />
        <span className="burger-line burger-line--bottom w-8" />
      </button>
    </div>
  );
}
