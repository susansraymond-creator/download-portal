"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Track a content share in Google Analytics so the admin can see which
 * social media platforms bring visitors in. Works with the gtag.js setup
 * already present in the root layout.
 */
function trackShare(network: string, slug: string) {
  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", "share", {
        method: network,
        content_id: slug,
        event_category: "engagement",
        event_label: network,
      });
    } else if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({
        event: "share",
        method: network,
        content_id: slug,
      });
    }
  } catch {
    // Analytics must never break sharing.
  }
}

interface Platform {
  name: string;
  label: string;
  color: string;
  path: string;
  href: (url: string, text: string, title: string) => string;
}

const PLATFORMS: Platform[] = [
  {
    name: "whatsapp",
    label: "WhatsApp",
    color: "#25D366",
    path: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z",
    href: (url, text) => `https://wa.me/?text=${encodeURIComponent(text)}`,
  },
  {
    name: "facebook",
    label: "Facebook",
    color: "#1877F2",
    path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z",
    href: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    name: "twitter",
    label: "X",
    color: "#16181d",
    path: "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.296Z",
    href: (url, text, title) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  },
  {
    name: "telegram",
    label: "Telegram",
    color: "#229ED9",
    path: "M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.03.01-.14-.061-.198-.07-.058-.174-.038-.249-.022-.106.024-1.793 1.14-5.06 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.788.027-.216.325-.437.893-.663 3.498-1.523 5.83-2.529 6.998-3.017 3.332-1.386 4.025-1.627 4.476-1.635z",
    href: (url, text, title) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
];

export function ShareButton({ title, slug }: { title: string; slug: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/content/${slug}`
      : `/content/${slug}`;
  const shareText = `Watch "${title}" — ${url}`;

  // Close the menu on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function nativeShare() {
    trackShare("native", slug);
    if (navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url });
        return;
      } catch {
        // User cancelled or share failed — fall back to the menu below.
      }
    }
    setOpen((v) => !v);
  }

  function shareTo(p: Platform) {
    trackShare(p.name, slug);
    window.open(p.href(url, shareText, title), "_blank", "noopener,noreferrer,width=640,height=580");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      trackShare("copy", slug);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 1400);
    } catch {
      // Clipboard unavailable — do nothing.
    }
  }

  return (
    <div ref={rootRef} className="relative flex-1">
      <button
        onClick={nativeShare}
        aria-label={`Share ${title}`}
        aria-expanded={open}
        className="flex w-full items-center justify-center gap-1.5 rounded-full border border-border px-3 py-2 text-sm text-text-muted transition-all duration-200 hover:border-brass hover:text-brass hover:shadow-[0_0_12px_rgba(201,162,39,0.25)]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
        Share
      </button>

      {open && (
        <div className="pop-in-centered absolute bottom-full left-1/2 z-50 mb-3 w-64 -translate-x-1/2 rounded-2xl border border-border bg-surface-raised p-3 shadow-2xl">
          <p className="mb-2.5 text-center font-mono text-[0.6rem] uppercase tracking-widest text-text-muted">
            Share via
          </p>

          <div className="grid grid-cols-4 gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p.name}
                onClick={() => shareTo(p)}
                aria-label={`Share on ${p.label}`}
                className="group flex flex-col items-center gap-1.5"
              >
                <span
                  className="grid h-11 w-11 place-items-center rounded-full transition-transform duration-200 group-hover:scale-110"
                  style={{ backgroundColor: p.color, boxShadow: "0 4px 10px rgba(0,0,0,0.35)" }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" aria-hidden>
                    <path d={p.path} />
                  </svg>
                </span>
                <span className="text-[0.6rem] text-text-muted group-hover:text-text">{p.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={copyLink}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-border bg-transparent px-3 py-2 text-xs text-text-muted transition-colors hover:border-brass hover:text-brass"
          >
            {copied ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Link copied!
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy Link
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}