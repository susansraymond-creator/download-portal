"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// Set permanently once the app is installed — the pill never shows again.
const INSTALLED_KEY = "kdl-app-installed";

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

function isIosDevice() {
  // iOS 13+ reports itself as "Macintosh" on iPad, so also check for
  // multi-touch Macs — otherwise iPads would get the Android flow.
  const ua = window.navigator.userAgent;
  return (
    /iphone|ipod/i.test(ua) ||
    (/ipad/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua)))
  );
}

type HelpKind = "ios" | "firefox" | "desktop-chrome-menu";

/**
 * Compact bottom pill that invites visitors to install the PWA.
 *
 * Behavior:
 * - Shows on the HOMEPAGE — first load, every refresh, and again each
 *   time the visitor returns to the homepage — as long as the app is not
 *   installed. Cancel (x) only hides it temporarily.
 * - Once installed (standalone launch, appinstalled event, or accepted
 *   install choice) it never shows again on mobile or PC.
 * - Tapping Install triggers the native browser install dialog directly.
 * - On iOS/iPadOS there is no native dialog; the Install tap reveals the
 *   "Share -> Add to Home Screen" steps inline.
 * - If the browser never fired beforeinstallprompt (e.g. Safari desktop,
 *   Firefox), the Install tap shows how to install in that browser.
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [help, setHelp] = useState<HelpKind | null>(null);
  const pathname = usePathname();
  const [isIos, setIsIos] = useState(false);
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Register the service worker. Chrome requires an active service
    // worker before it fires beforeinstallprompt, which makes the
    // install button work. Safe no-op on browsers without support.
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    // The pill lives on the homepage only.
    if (pathname !== "/") {
      setVisible(false);
      return;
    }

    // Installed (or launched as an installed app) — never show again.
    if (localStorage.getItem(INSTALLED_KEY) === "1" || isStandalone()) return;

    const iosDevice = isIosDevice();
    setIsIos(iosDevice);

    let timer: ReturnType<typeof setTimeout> | undefined;

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      promptRef.current = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptRef.current);
      setVisible(true);
      setHelp(null);
    }

    if (iosDevice) {
      timer = setTimeout(() => {
        if (!isStandalone()) setVisible(true);
      }, 2500);
    } else {
      // The browser fires beforeinstallprompt only once per page load, so
      // when the visitor returns to the homepage re-show the prompt we
      // already captured instead of waiting for a second event.
      if (promptRef.current) {
        setDeferredPrompt(promptRef.current);
        setVisible(true);
        setHelp(null);
      } else {
        window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      }
    }

    const onAppInstalled = () => {
      localStorage.setItem(INSTALLED_KEY, "1");
      setVisible(false);
      setDeferredPrompt(null);
      promptRef.current = null;
    };
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      if (timer) clearTimeout(timer);
    };
  }, [pathname]);

  async function install() {
    // iOS/iPadOS: no native install dialog — show the A2HS steps.
    if (isIos) {
      setHelp("ios");
      return;
    }
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        localStorage.setItem(INSTALLED_KEY, "1");
        setVisible(false);
        setDeferredPrompt(null);
        promptRef.current = null;
      }
      return;
    }
    // No native prompt available (Safari/Firefox desktop, or the browser
    // has not fired the event yet) — guide the visitor manually.
    const ua = navigator.userAgent.toLowerCase();
    setHelp(ua.includes("firefox") ? "firefox" : "desktop-chrome-menu");
  }

  function dismiss() {
    setVisible(false);
    setHelp(null);
  }

  if (!visible) return null;

  const helpContent: Record<HelpKind, { title: string; body: string }> = {
    ios: {
      title: "iOS এ install করুন",
      body: "Safari-র নিচের <span class='text-brass'>Share (⬆)</span> বাটনে ট্যাপ করুন → <span class='text-brass'>Add to Home Screen</span> → <span class='text-brass'>Add</span>।",
    },
    firefox: {
      title: "Firefox-এ install করুন",
      body: "Address bar-এর ডানে <span class='text-brass'>Install</span> আইকনে ক্লিক করুন, না থাকলে Firefox মেনু (☰) → <span class='text-brass'>Install This Site as an App</span>।",
    },
    "desktop-chrome-menu": {
      title: "App হিসেবে install করুন",
      body: "Address bar-এর ডান পাশে <span class='text-brass'>Install</span> আইকন (⊕) দেখুন, বা Chrome মেনু (⋮) → <span class='text-brass'>Install koreandramalink</span>।",
    },
  };

  const steps = help ? helpContent[help] : null;

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
            aria-label="Close install prompt"
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

        {steps && (
          <div className="mt-2 rounded-xl border border-border bg-ink/50 px-3 py-2">
            <p className="mb-0.5 font-mono text-[0.6rem] uppercase tracking-widest text-text-muted">
              {steps.title}
            </p>
            <p
              className="text-xs leading-relaxed text-text-muted"
              dangerouslySetInnerHTML={{ __html: steps.body }}
            />
          </div>
        )}
      </div>
    </div>
  );
}