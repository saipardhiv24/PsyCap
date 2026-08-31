import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckIcon, CloseIcon } from "../components/ui/icons.jsx";

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const toast = useCallback(
    ({ title, description, tone = "success", duration = 4000 }) => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, title, description, tone }]);
      timers.current[id] = setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss],
  );

  const helpers = {
    toast,
    success: (title, description) => toast({ title, description, tone: "success" }),
    error: (title, description) => toast({ title, description, tone: "error" }),
    info: (title, description) => toast({ title, description, tone: "info" }),
    dismiss,
  };

  return (
    <ToastContext.Provider value={helpers}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} {...t} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ title, description, tone, onClose }) {
  const tones = {
    success: "border-positive/30 bg-card",
    error: "border-negative/30 bg-card",
    info: "border-border bg-card",
  };
  const iconTones = {
    success: "bg-positive-muted text-positive",
    error: "bg-negative-muted text-negative",
    info: "bg-primary-muted text-primary",
  };
  return (
    <div
      className={`pointer-events-auto flex w-full max-w-sm animate-slide-in items-start gap-3 rounded-2xl border ${tones[tone]} p-4 shadow-pop`}
      role="alert"
    >
      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${iconTones[tone]}`}
      >
        {tone === "error" ? (
          <CloseIcon className="h-3.5 w-3.5" />
        ) : (
          <CheckIcon className="h-3.5 w-3.5" />
        )}
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss notification"
        className="text-muted-foreground transition hover:text-foreground"
      >
        <CloseIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
