"use client";

import { useState } from "react";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
  }
}

const SOCIAL_NETWORKS = ["facebook", "twitter", "whatsapp", "telegram", "reddit"] as const;

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

export function ShareButton({
  contentId,
  title,
  slug,
}: {
  contentId: string;
  title: string;
  slug: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/content/${slug}`
      : `/content/${slug}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const text = `Watch "${title}" — ${url}`;

  async function shareTo(network: string, href: string) {
    trackShare(network, slug);
    window.open(href, "_blank", "noopener,noreferrer,width=640,height=580");
  }

  async function nativeShare() {
    trackShare("native", slug);
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // User cancelled or share failed — fall back to the menu below.
      }
    }
    setOpen((v) => !v);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      trackShare("copy", slug);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — do nothing.
    }
  }

  const links: { name: string; label: string; href: string; icon: string }[] = [
    {
      name: "whatsapp",
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(text)}`,
      icon: "✆",
    },
    {
      name: "facebook",
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: "f",
    },
    {
      name: "twitter",
      label: "X (Twitter)",
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      icon: "𝕏",
    },
    {
      name: "telegram",
      label: "Telegram",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      icon: "➤",
    },
    {
      name: "reddit",
      label: "Reddit",
      href: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
      icon: "r/",
    },
  ];

  return (
    <div className="relative flex-1">
      <button
        onClick={nativeShare}
        aria-label={`Share ${title}`}
        className="w-full rounded-sm border border-border px-3 py-2 text-sm text-text-muted transition-colors hover:border-brass hover:text-brass"
      >
        ↗ Share
      </button>

      {open && (
        <>
          <button
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close share menu"
            onClick={() => setOpen(false)}
            tabIndex={-1}
          />
          <div className="absolute bottom-full left-0 z-50 mb-2 w-56 rounded-sm border border-border bg-surface p-2 shadow-lg">
            <p className="mb-2 px-1 font-mono text-[0.6rem] uppercase tracking-wide text-text-muted">
              Share via
            </p>
            <div className="space-y-1">
              {links.map((l) => (
                <button
                  key={l.name}
                  onClick={() => shareTo(l.name, l.href)}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-text-muted transition-colors hover:bg-border/40 hover:text-text"
                >
                  <span className="w-4 text-center font-mono">{l.icon}</span>
                  {l.label}
                </button>
              ))}
              <button
                onClick={copyLink}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-text-muted transition-colors hover:bg-border/40 hover:text-text"
              >
                <span className="w-4 text-center font-mono">⧉</span>
                {copied ? "Copied!" : "Copy Link"}
              </button>
    </div>
          </div>
        </>
      )}
    </div>
  );
}