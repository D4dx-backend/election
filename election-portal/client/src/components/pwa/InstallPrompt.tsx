import { useEffect, useState, useCallback } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

const DISMISSED_KEY = "pwa-install-dismissed";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if already installed (standalone mode) or previously dismissed.
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    const wasDismissed = sessionStorage.getItem(DISMISSED_KEY) === "true";

    if (isStandalone || wasDismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Brief delay so the app has finished rendering before showing the banner.
      setTimeout(() => setVisible(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    sessionStorage.setItem(DISMISSED_KEY, "true");
    setVisible(false);
  }, []);

  if (!visible || !deferredPrompt) return null;

  return (
    <div
      role="banner"
      aria-label="Install app"
      className="fixed bottom-20 left-4 right-4 z-50 sm:left-auto sm:right-6 sm:bottom-6 sm:w-80"
    >
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl shadow-blue-900/10 p-4 flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
          <Smartphone className="w-5 h-5 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
            Install Vote+
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
            Add to your home screen for a faster, offline-ready experience.
          </p>
          <Button
            size="sm"
            onClick={handleInstall}
            className="mt-2.5 h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700"
          >
            <Download className="w-3.5 h-3.5" />
            Install
          </Button>
        </div>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          aria-label="Dismiss install prompt"
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
