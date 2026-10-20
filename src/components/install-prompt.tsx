"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const DISMISS_KEY = "kdl-install-prompt-dismissed";

/**
 * Bottom-sheet "Install App" popup for the PWA.
 *
 * - Shows once per browser until the visitor dismisses it (stored in
 *   localStorage) or the app is installed.
 * - Matches the classic install banner look: site icon + site name on the
 *   left, prominent Install button on the right.
 * - Uses the browser's native install prompt when available (beforeinstallprompt),
 *   falling back to an install hint on iOS Safari which does not support it.
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Never nag inside the admin panel.
    if (pathname?.startsWith("/admin")) return;

    // Respect a "skip prompt" flag, e.g. for the login/register pages.
    if (searchParams?.get("install") === "skip") return;

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
  }, [pathname, searchParams]);

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
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 rounded-lg border border-border bg-surface p-4 shadow-2xl sm:flex-row sm:justify-between sm:p-5">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md">
            <Image src="/icon-192.png" alt="App icon" fill sizes="48px" className="object-cover" />
          </div>
          <div>
            <p className="font-display text-lg font-bold leading-tight">koreandramalink</p>
            <p className="font-mono text-xs text-text-muted">
              {isIos ? "Add to Home Screen for quick access" : "Install app for quick access"}
            </p>
          </div>
        </div>

        <div className="flex w-full gap-2 sm:w-auto">
          <button
            onClick={dismiss}
            className="flex-1 rounded-sm border border-border px-4 py-2 text-sm text-text-muted transition-colors hover:border-brass hover:text-brass sm:flex-none"
          >
            Not now
          </button>
          {isIos ? (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                dismiss();
              }}
              className="flex-1 rounded-sm bg-brass px-4 py-2 text-center text-sm font-medium text-black sm:flex-none"
            >
              Install
            </a>
on iOS the Install button
            {isIos && (
              <p className="sr-only">On iOS, tap the Share icon and choose Add to Home Screen.</p>
            )}
          ) : (
            <button
              onClick={install}
              className="flex-1 rounded-sm bg-brass px-4 py-2 text-sm font-medium text-black sm:flex-none"
            >
              Install
            </button>
          )}
        </div>
      </div>
    </div>
  );
}