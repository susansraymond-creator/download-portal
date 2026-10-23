"use client";

import { useState } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function NoPreviewShareButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [error, setError] = useState("");

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

  async function copyText(value: string) {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(value);
        return true;
      } catch {
        // Fall through to the legacy textarea method below.
      }
    }

    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    let copiedWithFallback = false;
    try {
      copiedWithFallback = document.execCommand("copy");
    } finally {
      textarea.remove();
    }
    return copiedWithFallback;
  }

  async function copy() {
    setError("");
    const url = getUrl();
    const success = await copyText(url);
    if (!success) {
      setShowLink(true);
      setError("Copy is blocked here. Select the link below and copy it manually.");
      return;
    }

    window.gtag?.("event", "share", {
      method: "plain-share",
      content_id: slug,
      event_category: "engagement",
      event_label: "plain-share",
    });
    setCopied(true);
    setShowLink(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <button
        type="button"
        onClick={copy}
        aria-label="Copy a share link without preview details"
        className="flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-xs font-medium text-text-muted transition-all duration-200 hover:border-teal hover:text-teal"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
        {copied ? "Copied" : "Plain link"}
      </button>
      {showLink && (
        <div className="rounded-lg border border-border bg-surface-raised p-2">
          <label className="sr-only" htmlFor={`plain-link-${slug}`}>Plain share link</label>
          <input
            id={`plain-link-${slug}`}
            readOnly
            value={getUrl()}
            onFocus={(event) => event.currentTarget.select()}
            className="w-full bg-transparent px-1 text-[0.62rem] text-text-muted outline-none"
          />
          {error && <p className="mt-1 text-[0.6rem] text-brass">{error}</p>}
        </div>
      )}
    </div>
  );
}
