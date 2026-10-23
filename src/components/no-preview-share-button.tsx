"use client";

import { useState } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function NoPreviewShareButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  function getUrl() {
    const base = `${window.location.origin}/share/${slug}`;
    const params = new URLSearchParams({
      utm_source: "plain-share",
      utm_medium: "share",
      utm_campaign: "content-share",
      utm_content: slug,
    });
    return `${base}?${params.toString()}`;
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(getUrl());
      window.gtag?.("event", "share", {
        method: "plain-share",
        content_id: slug,
        event_category: "engagement",
        event_label: "plain-share",
      });
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable; leave the button usable without breaking the page.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label="Copy a share link without preview details"
      className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border px-3 py-2 text-sm text-text-muted transition-all duration-200 hover:border-teal hover:text-teal"
    >
      {copied ? "Plain link copied" : "Plain link"}
    </button>
  );
}
