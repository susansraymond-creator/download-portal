"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const DISMISS_KEY = "kdl-install-prompt-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Bottom-sheet "Install App" popup for the PWA.
 *
 * - Shows once per browser until the visitor dismisses it (stored in
 *   localStorage) or the app is installed.
 * - Matches the classic install banner look: site icon + site name on the
 *   left, prominent Install button on the right.
 * - Uses the browser's native install prompt when available
 *   (beforeinstallprompt); on iOS Safari, which does not support it, the
 *   Install button expands into the "Share -> Add to Home Screen" steps.
 * - Deliberately does NOT use useSearchParams: that hook requires a
 *   Suspense boundary when rendered from the root layout and would break
 *   static generation of every page.
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showIosSteps, setShowIosSteps] = useState(false);
  const pathname = usePathname();
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Never nag inside the admin panel.
    if (pathname?.startsWith("/admin")) return;

    const dismissed = localStorage.getItem(DISMISS_KEY);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (dismissed || standalone) return;

    const isIosDevice = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    setIsIos(isIosDevice);

    let timer: ReturnType<typeof setTimeout> | undefined;

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    }

    if (isIosDevice) {
      // iOS Safari has no beforeinstallprompt; show the hint banner instead.
      timer = setTimeout(() => setVisible(true), 2500);
    } else {
      window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    }

    const onAppInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      if (timer) clearTimeout(timer);
    };
  }, [pathname]);

  async function install() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
      setDeferredPrompt(null);
    }
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4">
      <div className="mx-auto max-w-5xl rounded-lg border border-border bg-surface p-4 shadow-2xl sm:p-5">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md">
            <Image src="/icon-192.png" alt="koreandramalink app icon" fill sizes="48px" className="object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-bold leading-tight">koreandramalink</p>
            <p className="font-mono text-xs text-text-muted">
              {isIos ? "Add to Home Screen for quick access" : "Install app for quick access"}
            </p>
          </div>

          <div className="flex shrink-0 gap-2">
            <button
              onClick={dismiss}
              className="rounded-sm border border-border px-3 py-2 text-sm text-text-muted transition-colors hover:border-brass hover:text-brass"
            >
              Not now
            </button>
            {isIos ? (
              <button
                onClick={() => setShowIosSteps((v) => !v)}
                className="rounded-sm bg-brass px-4 py-2 text-sm font-medium text-black"
              >
                Install
              </button>
            ) : (
              <button
                onClick={install}
                className="rounded-sm bg-brass px-4 py-2 text-sm font-medium text-black"
              >
                Install
              </button>
            )}
          </div>
        </div>

        {isIos && showIosSteps && (
          <p className="mt-3 rounded-sm border border-border bg-background/60 px-3 py-2 text-sm text-text-muted">
            iOS-এ install করতে: Safari-র নিচে <span className="text-brass">Share (⬆)</span> বাটনে ট্যাপ করুন →{" "}
            <span className="text-brass">Add to Home Screen</span> → তারপর <span className="text-brass">Add</span>।
          </p>
        )}
      </div>
    </div>
  );
}