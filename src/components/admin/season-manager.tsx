"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DownloadLink = {
  id?: string;
  providerName: string;
  url: string;
  fileSize: string | null;
  quality: string | null;
  language: string | null;
  notes: string | null;
  status: "ACTIVE" | "DISABLED" | "BROKEN";
};

type Episode = {
  id: string;
  episodeNumber: number;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  duration: string | null;
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
  fileSize: "",
  quality: "",
  language: "",
  notes: "",
  status: "ACTIVE",
};

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
  const router = useRouter();

  async function saveSeasonMeta() {
    const res = await fetch(`/api/admin/seasons/${season.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, seasonNumber }),
    });
    if (res.ok) {
      onUpdate({ title, seasonNumber });
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
          className="rounded-sm border border-border px-3 py-1.5 text-xs text-text-muted hover:text-text"
        >
          Save
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
  const [episodeNumber, setEpisodeNumber] = useState(episode.episodeNumber);
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
  const router = useRouter();

  function updateLink(i: number, patch: Partial<DownloadLink>) {
    setLinks((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/admin/episodes/${episode.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        episodeNumber,
        downloadLinks: links
          .filter((l) => l.providerName && l.url)
          .map((l) => ({
            providerName: l.providerName,
            url: l.url,
            fileSize: l.fileSize || undefined,
            quality: l.quality || undefined,
            language: l.language || undefined,
            notes: l.notes || undefined,
            status: l.status,
          })),
      }),
    });
    setSaving(false);
    if (res.ok) {
      onUpdate({ title, episodeNumber, downloadLinks: links });
      router.refresh();
    }
  }

  return (
    <div className="rounded-sm border border-border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="number"
          value={episodeNumber}
          onChange={(e) => setEpisodeNumber(Number(e.target.value))}
          className="w-16 rounded-sm border border-border bg-surface px-2 py-1 text-xs"
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 rounded-sm border border-border bg-surface px-2 py-1 text-xs"
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
          className="rounded-sm bg-brass px-3 py-1 text-xs font-medium text-ink hover:bg-brass-bright"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button onClick={onDelete} className="text-xs text-danger hover:underline">
          Delete
        </button>
      </div>

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
          </div>
        ))}
      </div>
    </div>
  );
}