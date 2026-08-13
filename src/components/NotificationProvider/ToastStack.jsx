import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { VARIANTS } from "./notificationVariants";

export default function ToastStack({ toasts, dismiss }) {
  return (
    <div className="fixed z-[200] top-4 inset-x-4 sm:inset-x-auto sm:right-4 flex flex-col gap-2 sm:w-[380px] pointer-events-none">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const v = VARIANTS[t.type] || VARIANTS.info;
          const Icon = v.Icon;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.96, transition: { duration: 0.2 } }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="edit-frame bg-paper rounded-xl shadow-soft pointer-events-auto relative overflow-hidden"
            >
              <div className="flex items-start gap-3 px-4 py-3.5 pr-9">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${v.iconWrap}`}>
                  <Icon className="w-4 h-4" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="font-mono text-[10px] font-bold tracking-wide text-ink/60 mb-0.5">
                    {t.title || v.defaultTitle}
                  </p>
                  <p className="font-body text-sm text-ink leading-snug break-words">{t.message}</p>
                  {t.onAction && (
                    <button
                      onClick={() => { t.onAction(); dismiss(t.id); }}
                      className="mt-1.5 font-mono text-[11px] font-bold underline underline-offset-2 text-ink/70 hover:text-pink"
                    >
                      {t.actionLabel || "Aksi"}
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="press-btn absolute top-2.5 right-2.5 p-1 rounded-full text-ink/40 hover:text-ink hover:bg-ink/5 transition-colors"
                aria-label="Tutup notifikasi"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              {t.duration > 0 && (
                <motion.div
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: t.duration / 1000, ease: "linear" }}
                  style={{ transformOrigin: "left" }}
                  className={`absolute bottom-0 left-0 right-0 h-[3px] ${v.bar} opacity-50`}
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
