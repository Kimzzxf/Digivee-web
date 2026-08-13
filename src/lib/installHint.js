// Picks which "how to install" copy InstallPrompt shows, for every browser
// that never fires `beforeinstallprompt` (Chrome/Edge/Samsung Internet do —
// those get the real native prompt instead and never reach this function).
//
// Order matters: in-app webviews (WhatsApp/Instagram/etc.) report the same
// UA as the real iOS/Android browser underneath them, so that check has to
// run first or a WhatsApp-in-app iPhone visitor gets the Safari-only "ios"
// copy instead of the "leave this app first" one they actually need.
const IN_APP_UA = /FBAN|FBAV|Instagram|Line\/|WhatsApp|MicroMessenger|TikTok/i;
const IOS_UA = /iphone|ipad|ipod/i;
const FIREFOX_UA = /firefox|fxios/i;
// Desktop Safari only. CriOS/FxiOS/EdgiOS/OPiOS/OPR all contain "Safari" in
// their UA too — the exclusions rule those (and iOS, already handled above) out.
const MACOS_SAFARI_UA = /macintosh/i;
const OTHER_ENGINE_UA = /chrome|chromium|crios|edg|opr/i;

export function getInstallHintVariant(ua) {
  if (IN_APP_UA.test(ua)) return "inapp";
  if (IOS_UA.test(ua)) return "ios";
  if (FIREFOX_UA.test(ua)) return "firefox";
  if (MACOS_SAFARI_UA.test(ua) && /safari/i.test(ua) && !OTHER_ENGINE_UA.test(ua)) return "macos";
  return "generic";
}

// ponytail: one runnable check for the branching above — run with
// `node src/lib/installHint.js`. Guarded by `typeof process !== "undefined"`
// because this file also ships in the browser bundle (InstallPrompt is
// rendered app-wide in App.jsx) — `process` doesn't exist there, and a bare
// `process.argv` reference throws ReferenceError at module load, before
// React even mounts. `typeof` is the one safe way to probe for an
// undeclared global without throwing.
if (typeof process !== "undefined" && process.argv[1]?.endsWith("installHint.js")) {
  const cases = [
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 FBAN/FBIOS", "inapp"],
    ["Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 Instagram 302.0.0", "inapp"],
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile Safari", "ios"],
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) FxiOS/117 Mobile Safari", "ios"],
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/117.0", "firefox"],
    ["Mozilla/5.0 (Android 13; Mobile) Gecko/117.0 Firefox/117.0", "firefox"],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15", "macos"],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/117.0 Safari/537.36", "generic"],
    ["Mozilla/5.0 (KAIOS device)", "generic"],
  ];
  const failures = cases.filter(([ua, expected]) => getInstallHintVariant(ua) !== expected);
  if (failures.length) {
    console.error("installHint self-check failed:", failures.map(([ua]) => ua));
    process.exit(1);
  }
  console.log(`installHint self-check: ${cases.length} cases OK`);
}
