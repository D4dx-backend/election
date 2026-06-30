import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Uses vite-plugin-pwa's useRegisterSW hook to detect when a new service
 * worker is waiting and offers a one-click reload to apply the update.
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      // Poll every 60 s for updates when the tab stays open.
      if (registration) {
        setInterval(() => registration.update(), 60_000);
      }
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed top-4 left-4 right-4 z-50 sm:left-auto sm:right-6 sm:w-80"
    >
      <div className="bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 rounded-2xl shadow-2xl shadow-blue-900/15 p-4 flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 flex items-center justify-center">
          <RefreshCw className="w-5 h-5 text-blue-600" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
            Update Available
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
            A new version of Vote+ is ready. Reload to apply.
          </p>
          <Button
            size="sm"
            onClick={() => updateServiceWorker(true)}
            variant="outline"
            className="mt-2.5 h-8 text-xs gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reload now
          </Button>
        </div>

        {/* Dismiss */}
        <button
          onClick={() => setNeedRefresh(false)}
          aria-label="Dismiss update notification"
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
