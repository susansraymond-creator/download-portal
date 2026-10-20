"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DownloadLink = {
  id?: string;
  providerName: string;
  url: string;
  embedUrl?: string | null;
  fileSize: string | null;
  quality: string | null;
  language: string | null;
  notes: string | null;
  status: "ACTIVE" | "DISABLED" | "BROKEN";
};

type Episode = {
  id: string;
  episodeNumber: number;
  episodeNumberLabel?: string | null;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  duration: string | null;
  watchUrl: string | null;
  downloadLinks: DownloadLink[];
};

type Season = {
  id: string;
  seasonNumber: number;
  title: string | null;
  description: string | null;
  posterUrl: string | null;
  episodes: Episode[];
};

const emptyLink: DownloadLink = {
  providerName: "",
  url: "",
  embedUrl: "",
  fileSize: "",
  quality: "",
  language: "",
  notes: "",
  status: "ACTIVE",
};

function extractSrc(value: string): string {
  const match = value.match(/src=["']([^"']+)["']/i);
  return match ? match[1] : value;
}

// Accepts "3" or "1-10" style serial labels.
function parseSerial(value: string): { number: number; label: string } | null {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d+)(?:[ -](\d+))?$/);
  if (!match) return null;
  const number = Number(match[1]);
  if (match[2] && Number(match[2]) <= number) return null;
  return { number, label: match[2] ? `${match[1]}-${match[2]}` : String(number) };
}

export function SeasonManager({
  contentId,
  initialSeasons,
}: {
  contentId: string;
  initialSeasons: Season[];
}) {
  const [seasons, setSeasons] = useState(initialSeasons);
  const router = useRouter();

  async function addSeason() {
    const nextNumber = seasons.length > 0 ? Math.max(...seasons.map((s) => s.seasonNumber)) + 1 : 1;
    const res = await fetch(`/api/admin/content/${contentId}/seasons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seasonNumber: nextNumber }),
    });
    if (res.ok) {
      const data = await res.json();
      setSeasons((prev) => [...prev, { ...data.season, episodes: [] }]);
      router.refresh();
    }
  }

  async function deleteSeason(seasonId: string) {
    if (!confirm("Delete this season and all its episodes?")) return;
    await fetch(`/api/admin/seasons/${seasonId}`, { method: "DELETE" });
    setSeasons((prev) => prev.filter((s) => s.id !== seasonId));
    router.refresh();
  }

  function updateSeasonInState(seasonId: string, patch: Partial<Season>) {
    setSeasons((prev) => prev.map((s) => (s.id === seasonId ? { ...s, ...patch } : s)));
  }

  return (
    <div className="space-y-6">
      <button
        onClick={addSeason}
        className="rounded-sm bg-brass px-4 py-2 text-sm font-medium text-ink hover:bg-brass-bright"
      >
        + Add Season
      </button>

      {seasons.map((season) => (
        <SeasonBlock
          key={season.id}
          season={season}
          onDelete={() => deleteSeason(season.id)}
          onUpdate={(patch) => updateSeasonInState(season.id, patch)}
        />
      ))}
    </div>
  );
}

function SeasonBlock({
  season,
  onDelete,
  onUpdate,
}: {
  season: Season;
  onDelete: () => void;
  onUpdate: (patch: Partial<Season>) => void;
}) {
  const [title, setTitle] = useState(season.title ?? "");
  const [seasonNumber, setSeasonNumber] = useState(season.seasonNumber);
  const [seasonSaved, setSeasonSaved] = useState(false);
  const router = useRouter();

  async function saveSeasonMeta() {
    const res = await fetch(`/api/admin/seasons/${season.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, seasonNumber }),
    });
    if (res.ok) {
      onUpdate({ title, seasonNumber });
      setSeasonSaved(true);
      setTimeout(() => setSeasonSaved(false), 2000);
      router.refresh();
    }
  }

  async function addEpisode() {
    const nextNumber =
      season.episodes.length > 0
        ? Math.max(...season.episodes.map((e) => e.episodeNumber)) + 1
        : 1;
    const res = await fetch(`/api/admin/seasons/${season.id}/episodes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        episodeNumber: nextNumber,
        title: `Episode ${nextNumber}`,
        downloadLinks: [],
      }),
    });
    if (res.ok) {
      const data = await res.json();
      onUpdate({ episodes: [...season.episodes, { ...data.episode, downloadLinks: [] }] });
      router.refresh();
    }
  }

  function updateEpisodeInState(episodeId: string, patch: Partial<Episode>) {
    onUpdate({
      episodes: season.episodes.map((e) => (e.id === episodeId ? { ...e, ...patch } : e)),
    });
  }

  async function deleteEpisode(episodeId: string) {
    if (!confirm("Delete this episode?")) return;
    await fetch(`/api/admin/episodes/${episodeId}`, { method: "DELETE" });
    onUpdate({ episodes: season.episodes.filter((e) => e.id !== episodeId) });
    router.refresh();
  }

  return (
    <div className="index-card space-y-4 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="number"
          value={seasonNumber}
          onChange={(e) => setSeasonNumber(Number(e.target.value))}
          className="w-20 rounded-sm border border-border bg-surface px-2 py-1.5 text-sm"
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Season title (optional)"
          className="flex-1 rounded-sm border border-border bg-surface px-3 py-1.5 text-sm"
        />
        <button
          onClick={saveSeasonMeta}
          className={`rounded-sm border px-3 py-1.5 text-xs transition-colors ${
            seasonSaved ? "border-teal text-teal" : "border-border text-text-muted hover:text-text"
          }`}
        >
          {seasonSaved ? "Saved" : "Save"}
        </button>
        <button onClick={onDelete} className="text-xs text-danger hover:underline">
          Delete season
        </button>
      </div>

      <div className="space-y-4 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-xs uppercase text-text-muted">Episodes</h3>
          <button
            onClick={addEpisode}
            className="rounded-sm border border-teal px-3 py-1 text-xs text-teal hover:bg-teal hover:text-ink"
          >
            + Add episode
          </button>
        </div>

        {season.episodes.map((episode) => (
          <EpisodeBlock
            key={episode.id}
            episode={episode}
            onUpdate={(patch) => updateEpisodeInState(episode.id, patch)}
            onDelete={() => deleteEpisode(episode.id)}
          />
        ))}
      </div>
    </div>
  );
}

function EpisodeBlock({
  episode,
  onUpdate,
  onDelete,
}: {
  episode: Episode;
  onUpdate: (patch: Partial<Episode>) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(episode.title);
  const [serial, setSerial] = useState(
    episode.episodeNumberLabel ?? String(episode.episodeNumber)
  );
  const [watchUrl, setWatchUrl] = useState(episode.watchUrl ?? "");
  const [links, setLinks] = useState<DownloadLink[]>(
    episode.downloadLinks.length > 0
      ? episode.downloadLinks.map((l) => ({
          ...l,
          fileSize: l.fileSize ?? "",
          quality: l.quality ?? "",
          language: l.language ?? "",
          notes: l.notes ?? "",
        }))
      : [{ ...emptyLink }]
  );
  const [saving, setSaving] = useState(false);
  const [episodeSaved, setEpisodeSaved] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  function updateLink(i: number, patch: Partial<DownloadLink>) {
    setLinks((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function removeLink(i: number) {
    setLinks((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));
  }

  async function save() {
    setError("");
    const parsed = parseSerial(serial);
    if (!parsed) {
      setError("Serial must be a number or range like 1-10 (end must be greater than start).");
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/admin/episodes/${episode.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        episodeNumber: parsed.number,
        episodeNumberLabel: parsed.label !== String(parsed.number) ? parsed.label : null,
        watchUrl: watchUrl || undefined,
        downloadLinks: links
          .filter((l) => l.providerName || l.url || l.embedUrl)
          .map((l, i) => {
            const cleanEmbed = l.embedUrl ? extractSrc(l.embedUrl) : "";
            return {
              providerName: l.providerName || `Server ${i + 1}`,
              url: l.url || cleanEmbed,
              embedUrl: cleanEmbed || undefined,
              fileSize: l.fileSize || undefined,
              quality: l.quality || undefined,
              language: l.language || undefined,
              notes: l.notes || undefined,
              status: l.status,
            };
          }),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (res.ok) {
      onUpdate({
        title,
        episodeNumber: parsed.number,
        episodeNumberLabel: parsed.label !== String(parsed.number) ? parsed.label : null,
        downloadLinks: links,
      });
      setEpisodeSaved(true);
      setTimeout(() => setEpisodeSaved(false), 2000);
      router.refresh();
    } else {
      setError(typeof data.error === "string" ? data.error : "Failed to save episode.");
    }
  }

  return (
    <div className="rounded-sm border border-border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={serial}
          onChange={(e) => setSerial(e.target.value)}
          placeholder="3 or 1-10"
          className="w-24 rounded-sm border border-border bg-surface px-2 py-1 text-xs font-mono"
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 rounded-sm border border-border bg-surface px-2 py-1 text-xs"
        />
        <input
          value={watchUrl}
          onChange={(e) => setWatchUrl(e.target.value)}
          placeholder="Watch Online URL (optional)"
          className="w-48 rounded-sm border border-border bg-surface px-2 py-1 text-xs"
        />
        <button
          onClick={() => setLinks((prev) => [...prev, { ...emptyLink }])}
          className="rounded-sm border border-border px-2 py-1 text-xs text-text-muted hover:text-text"
        >
          + Link
        </button>
        <button
          disabled={saving}
          onClick={save}
          className={`rounded-sm px-3 py-1 text-xs font-medium text-ink transition-colors ${
            episodeSaved ? "bg-teal" : "bg-brass hover:bg-brass-bright"
          }`}
        >
          {saving ? "Saving..." : episodeSaved ? "Saved" : "Save"}
        </button>
        <button onClick={onDelete} className="text-xs text-danger hover:underline">
          Delete
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}

      <div className="mt-3 space-y-2">
        {links.map((link, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <input
              placeholder="Provider"
              value={link.providerName}
              onChange={(e) => updateLink(i, { providerName: e.target.value })}
              className="rounded-sm border border-border bg-surface px-2 py-1 text-xs"
            />
            <input
              placeholder="URL"
              value={link.url}
              onChange={(e) => updateLink(i, { url: e.target.value })}
              className="col-span-2 rounded-sm border border-border bg-surface px-2 py-1 text-xs"
            />
            <input
              placeholder="Quality"
              value={link.quality ?? ""}
              onChange={(e) => updateLink(i, { quality: e.target.value })}
              className="rounded-sm border border-border bg-surface px-2 py-1 text-xs"
            />
            <input
              placeholder="Embed player URL (optional)"
              value={link.embedUrl ?? ""}
              onChange={(e) => updateLink(i, { embedUrl: e.target.value })}
              className="col-span-2 rounded-sm border border-border bg-surface px-2 py-1 text-xs sm:col-span-3"
            />
            <button
              onClick={() => removeLink(i)}
              className="rounded-sm border border-border px-2 py-1 text-xs text-danger hover:border-danger"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}