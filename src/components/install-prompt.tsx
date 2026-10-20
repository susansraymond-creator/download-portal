"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// Once dismissed, the prompt is never shown again in that browser.
const DISMISS_KEY = "kdl-install-prompt-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/**
 * Compact bottom pill that invites visitors to install the PWA.
 *
 * - Skipped entirely when the app is already installed (standalone) or was
 *   dismissed before — refreshing the page will never bring it back.
 * - Tapping Install triggers the browser install dialog directly.
 * - On iOS (no native install prompt), the Install tap reveals the
 *   "Share -> Add to Home Screen" steps inline.
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showIosSteps, setShowIosSteps] = useState(false);
  const pathname = usePathname();
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Never show inside the admin panel or once the app is installed.
    if (pathname?.startsWith("/admin")) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;
    if (isStandalone()) return;

    const iosDevice = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    setIsIos(iosDevice);

    let timer: ReturnType<typeof setTimeout> | undefined;

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      // Chrome can fire this even on browsers where the app is already
      // installed — double-check before showing.
      if (isStandalone()) return;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    }

    if (iosDevice) {
      timer = setTimeout(() => {
        if (!isStandalone()) setVisible(true);
      }, 2500);
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
    if (isIos) {
      setShowIosSteps((v) => !v);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
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
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-3">
      <div className="pop-in w-full max-w-md rounded-2xl border border-border bg-surface-raised/95 p-3 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg">
            <Image src="/icon-192.png" alt="koreandramalink icon" fill sizes="36px" className="object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-bold leading-tight">koreandramalink</p>
            <p className="truncate font-mono text-[0.65rem] text-text-muted">
              {isIos ? "Add to Home Screen" : "Install for quick access"}
            </p>
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss install prompt"
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-text-muted transition-colors hover:bg-border/40 hover:text-text"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
          <button
            onClick={install}
            className="shrink-0 rounded-full bg-brass px-4 py-1.5 text-xs font-semibold text-ink transition-all duration-200 hover:bg-brass-bright hover:shadow-[0_0_14px_rgba(201,162,39,0.4)]"
          >
            Install
          </button>
        </div>

        {isIos && showIosSteps && (
          <p className="mt-2 rounded-xl border border-border bg-ink/50 px-3 py-2 text-xs leading-relaxed text-text-muted">
            Safari-র নিচে <span className="text-brass">Share (⬆)</span> → <span className="text-brass">Add to Home Screen</span> →{" "}
            <span className="text-brass">Add</span> চাপুন।
          </p>
        )}
      </div>
    </div>
  );
}