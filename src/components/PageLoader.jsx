// Branded stand-in for Loading.jsx on the two full-page gates a customer
// hits right after navigating in (Profile/Sewa waiting on
// getCurrentCustomer()) — same look as the first-load Preloader (bg-pink,
// paper wordmark) instead of the bare Loader2 spinner, since that's the
// moment users are actually asking about. Not the same component: no GSAP
// scramble or session-gating here, this just unmounts the instant real data
// arrives instead of running to a fixed timeline. Inline refetch spinners
// (referral list, admin tables) stay on plain Loading — see its own comment.
// Fullscreen (fixed inset-0) rather than a boxed min-h-[60vh] card — boxed
// looked like a small stray pink rectangle floating on an otherwise blank
// page while Sewa/Profile had nothing else rendered yet. z-[195] sits above
// the floating WA button/install prompt (z-170/190) so those don't hover
// over the brand screen, but below toasts/Preloader (z-200+).
export default function PageLoader() {
  return (
    <div className="fixed inset-0 z-[195] flex items-center justify-center bg-pink">
      <span className="font-body font-semibold text-paper text-2xl md:text-4xl tracking-[0.3em] pl-[0.3em] animate-pulse">
        DIGIVEE
      </span>
    </div>
  );
}
