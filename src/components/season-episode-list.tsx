"use client";

import { useState } from "react";

type DownloadLink = {
  id: string;
  providerName: string;
  url: string;
  fileSize: string | null;
  quality: string | null;
  language: string | null;
};

type Episode = {
  id: string;
  episodeNumber: number;
  title: string;
  duration: string | null;
  downloadLinks: DownloadLink[];
};

type Season = {
  id: string;
  seasonNumber: number;
  title: string | null;
  episodes: Episode[];
};

export function SeasonEpisodeList({ seasons }: { seasons: Season[] }) {
  const [openSeason, setOpenSeason] = useState<string | null>(seasons[0]?.id ?? null);

  return (
    <div className="space-y-3">
      {seasons.map((season) => (
        <div key={season.id} className="rounded-sm border border-border">
          <button
            onClick={() => setOpenSeason(openSeason === season.id ? null : season.id)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <span className="font-display text-lg">
              Season {season.seasonNumber}
              {season.title ? ` — ${season.title}` : ""}
            </span>
            <span className="font-mono text-xs text-text-muted">
              {season.episodes.length} episode{season.episodes.length === 1 ? "" : "s"}
            </span>
          </button>

          {openSeason === season.id && (
            <div className="space-y-3 border-t border-border p-4">
              {season.episodes.map((ep) => (
                <div key={ep.id} className="rounded-sm border border-border/50 p-3">
                  <p className="mb-2 text-sm font-medium">
                    Ep {ep.episodeNumber}. {ep.title}
                    {ep.duration ? (
                      <span className="ml-2 font-mono text-xs text-text-muted">{ep.duration}</span>
                    ) : null}
                  </p>
                  {ep.downloadLinks.length === 0 ? (
                    <p className="text-xs text-text-muted">No active download links yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {ep.downloadLinks.map((l) => (
                        
                        <a
                          key={l.id}
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="rounded-sm bg-brass px-3 py-1.5 text-xs font-medium text-ink hover:bg-brass-bright"
                        >
                          {l.providerName}
                          {l.quality ? ` · ${l.quality}` : ""}
                          {l.fileSize ? ` · ${l.fileSize}` : ""}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
