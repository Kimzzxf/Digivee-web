import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({ confirmState, onChoice }) {
  return (
    <AnimatePresence>
      {confirmState && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="modal-shell fixed inset-0 z-[210] bg-ink/40"
          onClick={() => onChoice(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="edit-frame bg-paper rounded-lg w-full max-w-sm p-6"
            role="alertdialog"
            aria-modal="true"
          >
            <div className="w-10 h-10 bg-pink/15 flex items-center justify-center mb-4">
              <AlertTriangle className="w-5 h-5 text-pink" strokeWidth={2.5} />
            </div>
            <h3 className="font-display text-lg mb-1.5">{confirmState.title}</h3>
            {confirmState.message && (
              <p className="font-mono text-xs text-ink/60 mb-5 leading-relaxed">{confirmState.message}</p>
            )}
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onChoice(false)}
                className="press-btn flex-1 py-2.5 border border-ink/15 font-body font-bold text-sm hover:border-ink/30 transition-colors"
              >
                {confirmState.cancelLabel}
              </button>
              <button
                onClick={() => onChoice(true)}
                className="press-btn flex-1 py-2.5 bg-pink text-white font-body font-bold text-sm hover:opacity-90 transition-opacity"
              >
                {confirmState.confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
