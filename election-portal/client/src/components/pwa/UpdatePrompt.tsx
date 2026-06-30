import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Keeps the service worker up to date and reloads the page when a new
 * version is ready — users should not need a manual hard refresh.
 */
export function UpdatePrompt() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(swRegistration) {
      if (swRegistration) {
        setRegistration(swRegistration);
        swRegistration.update();
      }
    },
  });

  useEffect(() => {
    if (!registration) return;

    const checkForUpdate = () => registration.update();
    window.addEventListener("focus", checkForUpdate);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") checkForUpdate();
    });

    const interval = window.setInterval(checkForUpdate, 60_000);
    return () => {
      window.removeEventListener("focus", checkForUpdate);
      window.clearInterval(interval);
    };
  }, [registration]);

  useEffect(() => {
    if (needRefresh) {
      updateServiceWorker(true);
    }
  }, [needRefresh, updateServiceWorker]);

  if (!needRefresh) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed top-4 left-4 right-4 z-50 sm:left-auto sm:right-6 sm:w-80"
    >
      <div className="bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 rounded-2xl shadow-2xl shadow-blue-900/15 p-4 flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 flex items-center justify-center">
          <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
            Updating Vote+
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
            Applying the latest version…
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
      </div>
    </div>
  );
}
