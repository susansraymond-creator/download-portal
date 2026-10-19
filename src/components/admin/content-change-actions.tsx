"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ContentChangeActions({ changeId }: { changeId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "accept" | "decline">(null);

async function act(kind: "accept" | "decline") {
    setBusy(kind);
    const res = await fetch(`/api/admin/content-changes/${changeId}/${kind}`, { method: "POST" });
    setBusy(null);
    if (!res.ok) {
      alert(kind === "accept" ? "Accept failed. Please try again." : "Decline failed. Please try again.");
      return;
    }
    router.refresh();
  }

return (
    <div className="flex gap-2">
      <button type="button" onClick={() => act("accept")} disabled={busy !== null} className="rounded-sm bg-brass px-3 py-1.5 text-xs font-medium text-ink hover:bg-brass-bright disabled:opacity-50">
        {busy === "accept" ? "Accepting…" : "Accept"}
      </button>
      <button type="button" onClick={() => act("decline")} disabled={busy !== null} className="rounded-sm border border-border px-3 py-1.5 text-xs text-text-muted hover:text-text disabled:opacity-50">
        {busy === "decline" ? "Declining…" : "Decline"}
      </button>
    </div>
  );
}
