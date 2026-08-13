import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearSession, getSession } from "../../lib/customer";
import { getAdminSession } from "../../lib/api";
import { useNavLinkClick } from "../../hooks/useNavLinkClick";
import { useNotification } from "../NotificationProvider";
import { useNavbarScroll } from "./useNavbarScroll";
import NavbarActions from "./NavbarActions";
import NavbarMenuOverlay from "./NavbarMenuOverlay";

export default function Navbar() {
  const navigate = useNavigate();
  const loggedIn = Boolean(getSession());
  // Read once at mount: Navbar unmounts/remounts on every transition into
  // or out of /admin (see App.jsx's NO_NAVBAR_PATHS), so this is always
  // fresh exactly when it matters — right after "Lihat Website" leaves
  // the dashboard. Only ever true on the browser that holds the admin
  // token; invisible to regular customers.
  const isAdmin = Boolean(getAdminSession());
  const [open, setOpen] = useState(false);
  const { info } = useNotification();
  const { headerRef, hiddenNav, scrolled } = useNavbarScroll(open);

  function closeMenu() {
    setOpen(false);
  }

  function handleLogout() {
    clearSession();
    closeMenu();
    navigate("/");
    info("Kamu udah keluar. Sampai jumpa lagi!");
  }

  // Beranda / Price List / Promo / logo all route through this — see
  // hooks/useNavLinkClick.js for why a plain <a href> isn't enough.
  const handleNavLinkClick = useNavLinkClick(closeMenu);

  return (
    <>
      <header
        ref={headerRef}
        className={`fixed top-0 inset-x-0 z-50 pt-[env(safe-area-inset-top)] transition-[transform,background-color,backdrop-filter,border-color,color] duration-300 ease-out motion-reduce:transition-none ${
          hiddenNav ? "-translate-y-full" : "translate-y-0"
        } ${scrolled || open ? "rule-hair bg-paper/90 backdrop-blur text-ink" : "bg-transparent border-b border-transparent text-paper"}`}
      >
        <div className="px-5 md:px-8 h-16 md:h-20 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 leading-none"
            onClick={(e) => handleNavLinkClick(e, "/")}
          >
            <span className="font-display text-xl tracking-tight">DIGIVEE</span>
            <span
              className={`kicker hidden sm:inline ${scrolled || open ? "text-smoke" : "text-paper/70"}`}
            >
              · Karawang
            </span>
          </Link>
          <NavbarActions
            loggedIn={loggedIn}
            isAdmin={isAdmin}
            scrolled={scrolled}
            onLogout={handleLogout}
            open={open}
            onToggle={() => setOpen((v) => !v)}
          />
        </div>
      </header>

      <NavbarMenuOverlay
        open={open}
        loggedIn={loggedIn}
        onNavLinkClick={handleNavLinkClick}
        onCloseMenu={closeMenu}
        onLogout={handleLogout}
      />
    </>
  );
}
