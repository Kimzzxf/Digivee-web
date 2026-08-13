import { useEffect, useRef, useState } from "react";
import { isStandalone } from "../../lib/push";
import { getInstallHintVariant } from "../../lib/installHint";

const DISMISSED_KEY = "digivee_install_dismissed";
const HINT_DELAY_MS = 2000;

// Chrome/Edge/Samsung Internet fire `beforeinstallprompt` when the site
// passes their installability checklist (manifest + registered service
// worker + served over https) — capturing it is what lets us show our own
// "Install" button instead of relying on the browser's tucked-away menu
// item. Every other browser (iOS Safari, Firefox, desktop Safari, in-app
// webviews) never fires that event and has no scriptable install API at
// all — hintVariant (see lib/installHint.js) picks which by-hand
// instructions to show instead, after a short delay so it doesn't compete
// with the page's own entrance animations or a late beforeinstallprompt.
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [hintVariant, setHintVariant] = useState(null);
  const [visible, setVisible] = useState(false);
  const promptArrived = useRef(false);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISSED_KEY)) return;

    function onBeforeInstallPrompt(e) {
      e.preventDefault();
      promptArrived.current = true;
      setDeferredPrompt(e);
      setHintVariant(null); // real native prompt beats any hint that arrives late
      setVisible(true);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    const timer = setTimeout(() => {
      if (!promptArrived.current) {
        setHintVariant(getInstallHintVariant(navigator.userAgent));
        setVisible(true);
      }
    }, HINT_DELAY_MS);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, "1");
  }

  async function handleInstallClick() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    // Whatever the user picked, the deferred event is single-use — Chrome
    // won't fire another until the next full page load.
    setDeferredPrompt(null);
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, "1");
  }

  return { deferredPrompt, hintVariant, visible, dismiss, handleInstallClick };
}
