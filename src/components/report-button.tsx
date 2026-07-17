"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const REASONS = [
  { value: "BROKEN_LINK", label: "Broken link" },
  { value: "WRONG_CONTENT", label: "Wrong content" },
  { value: "COPYRIGHT", label: "Copyright concern" },
  { value: "SPAM", label: "Spam" },
  { value: "OTHER", label: "Other" },
];

export function ReportButton({
  contentId,
  isLoggedIn,
}: {
  contentId: string;
  isLoggedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("BROKEN_LINK");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const router = useRouter();

  async function submit() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentId, reason, message }),
    });
    if (res.ok) setSent(true);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex-1 rounded-sm border border-border px-3 py-2 text-sm text-text-muted hover:border-danger hover:text-danger transition-colors"
      >
        Report
      </button>
    );
  }

  return (
    <div className="index-card w-full space-y-3 p-4">
      {sent ? (
        <p className="text-sm text-teal">Thanks — we&apos;ll take a look.</p>
      ) : (
        <>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-sm border border-border bg-surface px-2 py-1.5 text-sm"
          >
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Optional details…"
            className="w-full rounded-sm border border-border bg-surface px-2 py-1.5 text-sm"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              onClick={submit}
              className="rounded-sm bg-brass px-3 py-1.5 text-sm text-ink hover:bg-brass-bright"
            >
              Submit
            </button>
            <button
              onClick={() => setOpen(false)}
              className="rounded-sm border border-border px-3 py-1.5 text-sm text-text-muted"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
