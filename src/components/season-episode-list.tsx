"use client";

import { useState } from "react";
import { SmartPlayer } from "@/components/smart-player";

type DownloadLink = {
  id: string;
  providerName: string;
  url: string;
  embedUrl: string | null;
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
  const [activeEpisodeId, setActiveEpisodeId] = useState<string | null>(
    seasons[0]?.episodes[0]?.id ?? null
  );

  const query = search.trim().toLowerCase();
  const currentSeason = seasons.find((s) => s.id === openSeason) ?? seasons[0];
  const activeEpisode =
    currentSeason?.episodes.find((e) => e.id === activeEpisodeId) ?? currentSeason?.episodes[0];

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="font-display text-xl text-teal">📺 Episode-wise Links</h2>
        <p className="mt-1 text-sm text-brass">Download your favorite episodes</p>
      </div>

      {seasons.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {seasons.map((season) => (
            <button
              key={season.id}
              onClick={() => {
                setOpenSeason(season.id);
                setActiveEpisodeId(season.episodes[0]?.id ?? null);
              }}
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

      {activeEpisode && (
        <div className="space-y-3">
          <p className="text-center font-display text-lg">
            Episode {activeEpisode.episodeNumber}: {activeEpisode.title}
          </p>

          <SmartPlayer links={activeEpisode.downloadLinks} />

          <div className="flex flex-wrap items-center justify-center gap-3">
            {activeEpisode.watchUrl && (
              
              <a
                href={activeEpisode.watchUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex items-center gap-1 text-sm text-teal hover:underline"
              >
                ▶ Watch Online (new tab)
              </a>
            )}
                        {activeEpisode.downloadLinks
              .filter((l) => l.url && l.url !== "#" && l.url !== l.embedUrl)
              .map((l) => (
              
              <a
                key={l.id}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="rounded-sm bg-brass px-3 py-1.5 text-xs font-medium text-ink hover:bg-brass-bright"
              >
                                ⬇ Download
                {l.quality ? ` [${l.quality}` : ""}
                {l.fileSize ? ` · ${l.fileSize}]` : l.quality ? "]" : ""}
              </a>
              ))}
          </div>
        </div>
      )}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search episode number or title…"
        className="w-full rounded-sm border border-border bg-surface px-4 py-2.5 text-sm"
      />

      {currentSeason && (
        <div className="flex flex-wrap gap-2">
          {currentSeason.episodes
            .filter((ep) => {
              if (!query) return true;
              return (
                ep.title.toLowerCase().includes(query) ||
                String(ep.episodeNumber).includes(query)
              );
            })
            .slice()
            .sort((a, b) => a.episodeNumber - b.episodeNumber)
            .map((ep) => (
              <button
                key={ep.id}
                onClick={() => setActiveEpisodeId(ep.id)}
                className={`h-11 w-11 rounded-sm border font-mono text-sm font-bold ${
                  activeEpisode?.id === ep.id
                    ? "border-brass bg-brass text-ink"
                    : "border-border text-text-muted hover:border-text-muted hover:text-text"
                }`}
              >
                {ep.episodeNumber}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
