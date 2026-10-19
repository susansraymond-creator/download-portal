"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ContentPinButton({
  contentId,
  isFeatured,
}: {
  contentId: string;
  isFeatured: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

async function toggle() {
    setBusy(true);
    const res = await fetch(`/api/admin/content/${contentId}/pin`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFeatured: !isFeatured }),
    });
    setBusy(false);
    if (!res.ok) {
      alert("Pin failed. Please try again.");
      return;
    }
    router.refresh();
  }

return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={`rounded-sm border px-3 py-1 text-xs ${
        isFeatured
          ? "border-brass text-brass"
          : "border-border text-text-muted hover:text-text"
      } disabled:opacity-50`}
    >
      {busy ? "..." : isFeatured ? "Pinned" : "Pin"}
    </button>
  );
}
