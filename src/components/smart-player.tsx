"use client";

import { useState } from "react";

type PlayableLink = {
  id: string;
  providerName: string;
  embedUrl: string | null;
};

export function SmartPlayer({ links }: { links: PlayableLink[] }) {
  const playable = links.filter((l) => l.embedUrl);
  const [activeId, setActiveId] = useState<string | null>(playable[0]?.id ?? null);

  if (playable.length === 0) return null;

  const active = playable.find((l) => l.id === activeId) ?? playable[0];

  return (
    <div className="space-y-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-sm border border-border bg-black">
        <iframe
          key={active.id}
          src={active.embedUrl!}
          allowFullScreen
          className="h-full w-full"
        />
      </div>

      {playable.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {playable.map((l) => (
            <button
              key={l.id}
              onClick={() => setActiveId(l.id)}
              className={`rounded-sm border px-3 py-1.5 text-xs font-mono ${
                active.id === l.id
                  ? "border-brass text-brass"
                  : "border-border text-text-muted hover:text-text"
              }`}
            >
              {l.providerName}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}