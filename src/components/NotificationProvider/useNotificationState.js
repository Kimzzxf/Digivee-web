import { useCallback, useRef, useState } from "react";
import { nextId } from "./notificationVariants";

export function useNotificationState() {
  const [toasts, setToasts] = useState([]);
  // { title, message, confirmLabel, cancelLabel, resolve } | null — one at
  // a time is plenty for this app, no need for a queue.
  const [confirmState, setConfirmState] = useState(null);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const notify = useCallback(
    ({ type = "info", title, message, duration = 4200, onAction, actionLabel }) => {
      const id = nextId();
      setToasts((prev) => [...prev, { id, type, title, message, duration, onAction, actionLabel }]);
      if (duration > 0) {
        timers.current[id] = setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  const success = useCallback((message, opts = {}) => notify({ type: "success", message, ...opts }), [notify]);
  const error = useCallback((message, opts = {}) => notify({ type: "error", message, duration: 5500, ...opts }), [notify]);
  const promo = useCallback((message, opts = {}) => notify({ type: "promo", message, ...opts }), [notify]);
  const info = useCallback((message, opts = {}) => notify({ type: "info", message, ...opts }), [notify]);

  // Promise-based replacement for window.confirm() so the confirmation
  // dialog matches the site's design instead of a native browser popup.
  // Usage: const ok = await confirmAction({ title, message }); if (!ok) return;
  const confirmAction = useCallback(
    ({ title = "Yakin?", message = "", confirmLabel = "Ya, lanjut", cancelLabel = "Batal" } = {}) => {
      return new Promise((resolve) => {
        setConfirmState({ title, message, confirmLabel, cancelLabel, resolve });
      });
    },
    []
  );

  function handleConfirmChoice(choice) {
    confirmState?.resolve(choice);
    setConfirmState(null);
  }

  return {
    toasts,
    dismiss,
    confirmState,
    handleConfirmChoice,
    context: { notify, success, error, promo, info, dismiss, confirmAction },
  };
}
