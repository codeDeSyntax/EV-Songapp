import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from "lucide-react";

export type NotificationType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

interface ToastItemProps {
  toast: Toast;
  index: number;
  onDismiss: (id: string) => void;
  isDarkMode?: boolean;
}

const ToastItem = React.forwardRef<HTMLDivElement, ToastItemProps>(
  ({ toast, index, onDismiss, isDarkMode = false }, ref) => {
    const config = {
      success: {
        icon: CheckCircle,
        iconColor: "#10b981",
      },
      error: {
        icon: AlertCircle,
        iconColor: "#ef4444",
      },
      warning: {
        icon: AlertTriangle,
        iconColor: "#f59e0b",
      },
      info: {
        icon: Info,
        iconColor: "#3b82f6",
      },
    }[toast.type];

    const IconComponent = config.icon;

    return (
      <div
        ref={ref}
        style={{
          marginBottom: index < 4 ? "12px" : "0",
          width: "100%",
        }}
      >
        <div
          style={{
            backgroundColor: isDarkMode ? "#262626" : "#f9fafb",
            borderColor: isDarkMode ? "#404040" : "#e5e5e5",
            boxShadow: isDarkMode
              ? "0 4px 12px rgba(0, 0, 0, 0.5)"
              : "0 4px 12px rgba(0, 0, 0, 0.15)",
          }}
          className="border border-solid rounded-2xl flex items-center gap-3 px-4 py-3 relative"
        >
          {/* Icon */}
          <IconComponent
            style={{ color: config.iconColor }}
            className="w-5 h-5 flex-shrink-0"
            strokeWidth={2}
          />

          {/* Message */}
          <span
            style={{
              color: isDarkMode ? "#fafafa" : "#171717",
            }}
            className="font-normal text-[15px] flex-1 leading-[1.4]"
          >
            {toast.message}
          </span>

          {/* Dismiss Button */}
          <div
            onClick={() => onDismiss(toast.id)}
            style={{
              color: isDarkMode ? "#737373" : "#a3a3a3",
            }}
            className="hover:opacity-70 transition-opacity flex-shrink-0 cursor-pointer"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </div>
        </div>
      </div>
    );
  }
);

ToastItem.displayName = "ToastItem";

interface ToasterProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
  position?:
    | "top-center"
    | "top-right"
    | "bottom-center"
    | "bottom-right"
    | "top-left"
    | "bottom-left";
  isDarkMode?: boolean;
}

export const Toaster: React.FC<ToasterProps> = ({
  toasts,
  onDismiss,
  position = "top-left",
  isDarkMode = false,
}) => {
  const positionClasses = {
    "top-center": "top-8 left-1/2 -translate-x-1/2",
    "top-right": "top-8 right-4",
    "top-left": "top-8 left-4",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
  };

  return (
    <div
      className={`fixed ${positionClasses[position]} z-[9999] pointer-events-none`}
      style={{
        width: "min(90vw, 360px)", // Fixed width: ~20% of typical screen or 360px max
      }}
    >
      <div className="flex flex-col pointer-events-auto">
        <AnimatePresence mode="popLayout">
          {toasts.slice(0, 5).map((toast, index) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 300, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{
                opacity: 0,
                x: 300,
                scale: 0.95,
                transition: { duration: 0.15 },
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
                mass: 0.8,
              }}
            >
              <ToastItem
                toast={toast}
                index={index}
                onDismiss={onDismiss}
                isDarkMode={isDarkMode}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Legacy component for backward compatibility
interface NotificationProps {
  message: string;
  type?: NotificationType;
  show: boolean;
}

export const Notification: React.FC<NotificationProps> = ({
  message,
  type = "info",
  show,
}) => {
  const toast: Toast = {
    id: "legacy",
    message,
    type,
  };

  return (
    <Toaster
      toasts={show ? [toast] : []}
      onDismiss={() => {}}
      position="top-center"
    />
  );
};
