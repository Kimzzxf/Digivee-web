// Single source of truth for the admin URL path. App.jsx registers the
// route here; anything that redirects into admin (e.g. AdminSignInPanel
// after login) must import this instead of hardcoding "/admin" — that
// drift is exactly what sent a successful login to a path that no longer
// existed after VITE_ADMIN_PATH was customized.
export const ADMIN_PATH = `/${import.meta.env.VITE_ADMIN_PATH || "admin"}`;
