"use client";

import { useEffect } from "react";

export function NoPreviewRedirect({ target }: { target: string }) {
  useEffect(() => {
    window.location.replace(target);
  }, [target]);

  return (
    <main className="grid min-h-screen place-items-center bg-ink px-6 text-center text-text">
      <div>
        <p className="text-sm text-text-muted">Opening shared content…</p>
        <a className="mt-3 inline-block text-sm text-brass hover:underline" href={target}>
          Continue
        </a>
      </div>
    </main>
  );
}
