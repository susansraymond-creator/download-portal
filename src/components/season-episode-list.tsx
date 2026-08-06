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
  watchUrl: string | null;
  downloadLinks: DownloadLink[];
};

type Season = {
  id: string;
  seasonNumber: number;
  title: string | null;
  episodes: Episode[];
};

export function SeasonEpisodeList({ seasons }: { seasons: Season[] }) {
  const [search, setSearch] = useState("");
  const [openSeason, setOpenSeason] = useState<string | null>(seasons[0]?.id ?? null);

  const query = search.trim().toLowerCase();

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="font-display text-xl text-teal">📺 Episode-wise Links</h2>
        <p className="mt-1 text-sm text-brass">Download your favorite episodes</p>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search episode number or title…"
        className="w-full rounded-sm border border-border bg-surface px-4 py-2.5 text-sm"
      />

      {seasons.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {seasons.map((season) => (
            <button
              key={season.id}
              onClick={() => setOpenSeason(season.id)}
              className={`rounded-sm border px-3 py-1.5 text-xs font-mono ${
                openSeason === season.id
                  ? "border-brass text-brass"
                  : "border-border text-text-muted hover:text-text"
              }`}
            >
              Season {season.seasonNumber}
            </button>
          ))}
        </div>
      )}

      {seasons
        .filter((s) => s.id === openSeason)
        .map((season) => {
          const filtered = season.episodes.filter((ep) => {
            if (!query) return true;
            return (
              ep.title.toLowerCase().includes(query) ||
              String(ep.episodeNumber).includes(query)
            );
          });

          return (
            <div key={season.id} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered
                .slice()
                .sort((a, b) => b.episodeNumber - a.episodeNumber)
                .map((ep) => (
                  <div key={ep.id} className="rounded-sm border border-border bg-surface/40 p-4 text-center">
                    <p className="font-display text-base">Episode {ep.episodeNumber}</p>

                    {ep.watchUrl && (
                      
                      <a
                        href={ep.watchUrl}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-teal hover:underline"
                      >
                        ▶ Watch Online
                      </a>
                    )}

                    <div className="mt-3 space-y-2">
                      {ep.downloadLinks.length === 0 ? (
                        <p className="text-xs text-text-muted">No links yet.</p>
                      ) : (
                        ep.downloadLinks.map((l) => (
                          
                          <a
                            key={l.id}
                            href={l.url}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="block w-full rounded-sm bg-brass px-3 py-2 text-xs font-medium text-ink hover:bg-brass-bright"
                          >
                            ⬇ Download
                            {l.quality ? ` [${l.quality}` : ""}
                            {l.fileSize ? ` · ${l.fileSize}]` : l.quality ? "]" : ""}
                          </a>
                        ))
                      )}
                    </div>
                  </div>
                ))}

              {filtered.length === 0 && (
                <p className="col-span-full py-8 text-center text-sm text-text-muted">
                  No episodes match your search.
                </p>
              )}
            </div>
          );
        })}
    </div>
  );
}
