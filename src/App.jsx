import { Suspense, lazy, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Preloader from "./components/Preloader";
import InstallPrompt from "./components/InstallPrompt";
import WaFloatingButton from "./components/WaFloatingButton";
import ProtectedRoute from "./components/ProtectedRoute";
import PageLoader from "./components/PageLoader";
import { useNotification } from "./components/NotificationProvider";
import { useStatusBarColor } from "./hooks/useStatusBarColor";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Sewa from "./pages/Sewa";
import Terms from "./pages/Terms";
import Testimoni from "./pages/Testimoni";
import { ADMIN_PATH } from "./lib/adminPath";

// Lazy, not a static import: Admin pulls in recharts (Analytics tab) which
// customers visiting the landing/sewa/login pages never need — bundling it
// statically meant every customer downloaded ~400kB of chart library they'd
// never touch. Only admin's own page load pays for it now.
const Admin = lazy(() => import("./pages/Admin"));

// Form pages, the admin page, and the profile page get a BackButton
// (rendered inside each page, see Sewa/Login/Admin/Profile) instead of
// the site Navbar.
const NO_NAVBAR_PATHS = ["/login", "/sewa", "/profile", "/syarat-ketentuan", "/testimoni", ADMIN_PATH];

export default function App() {
  const { pathname } = useLocation();
  const hideNavbar = NO_NAVBAR_PATHS.includes(pathname);
  useStatusBarColor(pathname);
  const { info } = useNotification();

  // Closes the ceiling netlify.toml's no-cache fix leaves: no-cache gets
  // the NEW sw.js loaded on next reload, but a tab that's been open since
  // BEFORE that reload already ran its OLD JS bundle in memory — sw.js's
  // clients.claim() silently hands it control anyway, so it's now served
  // by a SW whose precache doesn't match the JS it's running. Nudge to
  // refresh instead of guessing it's safe to force-reload mid-session.
  //
  // `navigator.serviceWorker.controller` already being set inside the
  // check (not just installed) is what filters this to real updates only
  // — a brand-new visitor's first-ever install has no controller yet at
  // that point, so they never see this.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.ready.then((reg) => {
      reg.addEventListener("updatefound", () => {
        const worker = reg.installing;
        worker?.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            info("Ada update baru — refresh halaman ini ya.", {
              duration: 0,
              onAction: () => window.location.reload(),
              actionLabel: "Refresh sekarang",
            });
          }
        });
      });
    });
  }, [info]);

  return (
    <>
      <Preloader />
      {!hideNavbar && <Navbar />}
      <InstallPrompt />
      <WaFloatingButton />
      {/* overflow-x-hidden scoped here (not on html/body) so it guards
          against WhyDigivee's horizontal GSAP scrub. pt-24/md:pt-28 matches
          the fixed header's own h-16/md:h-20 — the header no longer
          reserves flow space (position: fixed), so every non-hero page
          needs this to keep the same clearance it always had. Landing
          cancels it right back out with a matching -mt-24/md:-mt-28 on
          the hero, since that's the one page meant to sit *behind* the
          transparent header instead of below it. hideNavbar routes skip
          this entirely — no fixed header to clear. */}
      <div
        className={`overflow-x-hidden ${
          hideNavbar
            ? ""
            : "pt-[calc(4rem+env(safe-area-inset-top))] md:pt-[calc(5rem+env(safe-area-inset-top))]"
        }`}
      >
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/syarat-ketentuan" element={<Terms />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sewa"
            element={
              <ProtectedRoute>
                <Sewa />
              </ProtectedRoute>
            }
          />
          <Route
            path="/testimoni"
            element={
              <ProtectedRoute>
                <Testimoni />
              </ProtectedRoute>
            }
          />
          <Route
            path={ADMIN_PATH}
            element={
              <Suspense fallback={<PageLoader />}>
                <Admin />
              </Suspense>
            }
          />
        </Routes>
      </div>
    </>
  );
}
