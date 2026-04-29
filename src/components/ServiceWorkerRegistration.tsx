"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Download, X } from "lucide-react";

export default function ServiceWorkerRegistration() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const autoDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Compute isIOS once (stable between renders)
  const isIOS = useMemo(() => {
    if (typeof window === "undefined") return false;
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      // @ts-expect-error MSStream only exists on old mobile browsers
      !window.MSStream
    );
  }, []);

  // Register service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered:", registration.scope);
        })
        .catch((error) => {
          console.log("SW registration failed:", error);
        });
    }
  }, []);

  // dismissPrompt — defined before effects that reference it
  const dismissPrompt = useCallback(() => {
    localStorage.setItem("paw-install-prompt-seen", "true");
    setShowInstallPrompt(false);
    if (autoDismissTimer.current) {
      clearTimeout(autoDismissTimer.current);
    }
  }, []);

  // Handle install prompt logic
  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS safari standalone flag
      window.navigator.standalone === true;

    if (isStandalone) return;
    if (localStorage.getItem("paw-install-prompt-seen") === "true") return;

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setShowInstallPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    // Fallback: show for iOS after 1.5s
    const fallbackTimer = window.setTimeout(() => {
      if (isIOS) {
        setShowInstallPrompt(true);
      }
    }, 1500);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.clearTimeout(fallbackTimer);
    };
  }, [isIOS]);

  // Auto-dismiss after 2 minutes
  useEffect(() => {
    if (showInstallPrompt) {
      autoDismissTimer.current = setTimeout(() => {
        dismissPrompt();
      }, 120_000); // 2 minutes
    }

    return () => {
      if (autoDismissTimer.current) {
        clearTimeout(autoDismissTimer.current);
      }
    };
  }, [showInstallPrompt, dismissPrompt]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      dismissPrompt();
      return;
    }

    // Cast for cross-browser beforeinstallprompt support.
    const installEvent = deferredPrompt as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
    };

    await installEvent.prompt();
    await installEvent.userChoice;
    dismissPrompt();
    setDeferredPrompt(null);
  };

  if (!showInstallPrompt) return null;

  return (
    <div className="fixed inset-x-4 bottom-6 z-[100] sm:inset-x-auto sm:right-6 sm:w-[360px] animate-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-2xl border border-border bg-card/95 backdrop-blur-xl px-4 py-4 shadow-[0_10px_35px_rgba(0,0,0,0.25)]">
        <button
          onClick={dismissPrompt}
          aria-label="Close install popup"
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div className="mt-0.5 rounded-xl bg-foreground/10 p-2">
            <Download className="h-4 w-4 text-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Install MyRegister app</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {isIOS && !deferredPrompt
                ? "Tap Share, then Add to Home Screen for a full app experience."
                : "Add MyRegister to your home screen for faster access and offline support."}
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={dismissPrompt}
            className="h-9 flex-1 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Not now
          </button>
          <button
            onClick={handleInstall}
            className="h-9 flex-1 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            {deferredPrompt ? "Install" : "Got it"}
          </button>
        </div>
      </div>
    </div>
  );
}
