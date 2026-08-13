import { NotificationContext, useNotification } from "./notificationContext";
import { useNotificationState } from "./useNotificationState";
import ToastStack from "./ToastStack";
import ConfirmDialog from "./ConfirmDialog";

export { useNotification };

export function NotificationProvider({ children }) {
  const { toasts, dismiss, confirmState, handleConfirmChoice, context } = useNotificationState();

  return (
    <NotificationContext.Provider value={context}>
      {children}
      <ToastStack toasts={toasts} dismiss={dismiss} />
      <ConfirmDialog confirmState={confirmState} onChoice={handleConfirmChoice} />
    </NotificationContext.Provider>
  );
}
