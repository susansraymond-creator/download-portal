"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import slugify from "slugify";

type DownloadLinkForm = {
  id?: string;
  providerName: string;
  url: string;
  embedUrl: string;
  fileSize: string;
  version: string;
  quality: string;
  language: string;
  notes: string;
  status: "ACTIVE" | "DISABLED" | "BROKEN";
};

type Category = { id: string; name: string };
type TagOption = { id: string; name: string };

function extractSrc(value: string): string {
  const match = value.match(/src=["']([^"']+)["']/i);
  return match ? match[1] : value;
}

const emptyLink: DownloadLinkForm = {
  providerName: "",
  url: "",
  embedUrl: "",
  fileSize: "",
  version: "",
  quality: "",
  language: "",
  notes: "",
  status: "ACTIVE",
};

export function ContentEditorForm({
  contentId,
  categories,
  qualityOptions,
  languageOptions,
  tags,
  initial,
}: {
  contentId?: string;
  categories: Category[];
  qualityOptions: string[];
  languageOptions: string[];
  tags?: TagOption[];
  initial?: {
    title: string;
    slug: string;
    description: string;
    shortDescription: string;
    type: string;
    status: string;
    posterUrl: string;
    thumbnailUrl: string;
    categoryId: string;
    isFeatured: boolean;
    hasSeasons: boolean;
    accessLevel: string;
    imdbRating: string;
    primaryQuality: string;
    primaryLanguage: string;
    updateLabel: string;
    seriesStatus: string;
    publishAt: string;
    metaTitle: string;
    metaDescription: string;
    downloadLinks: DownloadLinkForm[];
    watchUrl: string;
    tagIds?: string[];
  };
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!initial?.slug);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [shortDescription, setShortDescription] = useState(initial?.shortDescription ?? "");
  const [type, setType] = useState(initial?.type ?? "VIDEO");
  const [status, setStatus] = useState(initial?.status ?? "DRAFT");
  const [posterUrl, setPosterUrl] = useState(initial?.posterUrl || initial?.thumbnailUrl || "");
  const [thumbnailUrl, setThumbnailUrl] = useState(initial?.thumbnailUrl ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initial?.tagIds ?? []);
  const [isFeatured, setIsFeatured] = useState(initial?.isFeatured ?? false);
  const [hasSeasons, setHasSeasons] = useState(initial?.hasSeasons ?? false);
  const [accessLevel, setAccessLevel] = useState(initial?.accessLevel ?? "NORMAL");
  const [imdbRating, setImdbRating] = useState(initial?.imdbRating ?? "");
  const [primaryQuality, setPrimaryQuality] = useState(initial?.primaryQuality ?? "");
  const [languages, setLanguages] = useState<string[]>(
    (initial?.primaryLanguage ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
  const [updateLabel, setUpdateLabel] = useState(initial?.updateLabel ?? "");
  const [seriesStatus, setSeriesStatus] = useState(initial?.seriesStatus ?? "");
  const [publishAt, setPublishAt] = useState(initial?.publishAt ?? "");
  const [metaTitle, setMetaTitle] = useState(initial?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(initial?.metaDescription ?? "");
  const [links, setLinks] = useState<DownloadLinkForm[]>(initial?.downloadLinks ?? [emptyLink]);
  const [watchUrl, setWatchUrl] = useState(initial?.watchUrl ?? "");
  const qualityList =
    primaryQuality && !qualityOptions.includes(primaryQuality)
      ? [primaryQuality, ...qualityOptions]
      : qualityOptions;
  const languageList = [
    ...languageOptions,
    ...languages.filter((l) => !languageOptions.includes(l)),
  ];
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  function toggleLanguage(name: string) {
    setLanguages((prev) =>
      prev.includes(name) ? prev.filter((l) => l !== name) : [...prev, name]
    );
  }

  function toggleTag(id: string) {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  function updateLink(i: number, patch: Partial<DownloadLinkForm>) {
    setLinks((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function onTitleChange(v: string) {
    setTitle(v);
    if (!slugTouched) setSlug(slugify(v, { lower: true, strict: true }));
  }

  async function onSubmit(e: React.FormEvent, saveAsStatus?: string) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = {
      title,
      slug,
      description,
      shortDescription: shortDescription || undefined,
      type,
      status: saveAsStatus ?? status,
      posterUrl: posterUrl || undefined,
      thumbnailUrl: posterUrl || undefined,
      categoryId: categoryId || undefined,
      tagIds: selectedTagIds,
      isFeatured,
      hasSeasons,
      accessLevel,
      imdbRating: imdbRating ? Number(imdbRating) : undefined,
      primaryQuality: primaryQuality || null,
      primaryLanguage: languages.length > 0 ? languages.join(", ") : null,
      updateLabel: updateLabel || undefined,
      seriesStatus: seriesStatus || undefined,
      publishAt: publishAt ? new Date(publishAt).toISOString() : undefined,
      metaTitle: title.slice(0, 70),
      metaDescription: description.slice(0, 160),
      watchUrl: watchUrl || undefined,
      downloadLinks: links
        .filter((l) => l.providerName || l.url || l.embedUrl)
        .map((l, i) => {
          const cleanEmbed = l.embedUrl ? extractSrc(l.embedUrl) : "";
          return {
            providerName: l.providerName || "Server " + (i + 1),
            url: l.url || cleanEmbed,
            embedUrl: cleanEmbed || undefined,
            fileSize: l.fileSize || undefined,
            version: l.version || undefined,
            quality: l.quality || undefined,
            language: l.language || undefined,
            notes: l.notes || undefined,
            status: l.status,
            sortOrder: i,
          };
        }),
    };

    const res = await fetch(
      contentId ? "/api/admin/content/" + contentId : "/api/admin/content",
      {
        method: contentId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Failed to save. Check required fields.");
      return;
    }

    setJustSaved(true);
    setTimeout(() => {
      router.push("/admin/content");
      router.refresh();
    }, 600);
  }

  async function onDelete() {
    if (!contentId) return;
    if (!confirm("Delete this content permanently? This cannot be undone.")) return;
    const res = await fetch("/api/admin/content/" + contentId, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed to delete (status " + res.status + "). Check console for details.");
      return;
    }
    router.push("/admin/content");
    router.refresh();
  }

  return (
    <form onSubmit={(e) => onSubmit(e)} className="space-y-8">
      {error && <p className="rounded-sm border border-danger p-3 text-sm text-danger">{error}</p>}

      <section className="index-card space-y-4 p-6">
        <h2 className="font-display text-lg">Basics</h2>

        <Field label="Title">
          <input
            required
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
          />
        </Field>

        <Field label="Slug">
          <input
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm font-mono"
          />
        </Field>

        <Field label="Full description">
          <textarea
            required
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
            >
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {tags && tags.length > 0 && (
          <Field label="Tags">
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => {
                const on = selectedTagIds.includes(t.id);
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => toggleTag(t.id)}
                    className={`rounded-sm border px-2.5 py-1 text-xs transition-colors ${
                      on
                        ? "border-teal bg-teal text-ink"
                        : "border-border text-text-muted hover:text-text"
                    }`}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-xs text-text-muted">
              Tags are saved with the content.
            </p>
          </Field>
        )}

        <Field label="Poster image URL (used for card and detail page)">
          <input
            value={posterUrl}
            onChange={(e) => setPosterUrl(e.target.value)}
            className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
          />
        </Field>

        <label className="flex items-center gap-2 text-sm text-text-muted">
          <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
          Feature on homepage
        </label>

        <label className="flex items-center gap-2 text-sm text-text-muted">
          <input type="checkbox" checked={hasSeasons} onChange={(e) => setHasSeasons(e.target.checked)} />
          This is a series (has seasons and episodes)
        </label>

        <Field label="Access level">
          <select
            value={accessLevel}
            onChange={(e) => setAccessLevel(e.target.value)}
            className="w-full max-w-xs rounded-sm border border-border bg-surface px-3 py-2 text-sm"
          >
            <option value="NORMAL">Normal</option>
            <option value="PREMIUM">Premium</option>
          </select>
        </Field>

        <Field label="IMDb rating (0-10, optional)">
          <input
            type="number"
            step="0.1"
            min="0"
            max="10"
            value={imdbRating}
            onChange={(e) => setImdbRating(e.target.value)}
            className="w-full max-w-xs rounded-sm border border-border bg-surface px-3 py-2 text-sm"
          />
        </Field>

        <Field label="Quality badge">
          <select
            value={primaryQuality}
            onChange={(e) => setPrimaryQuality(e.target.value)}
            className="w-full max-w-xs rounded-sm border border-border bg-surface px-3 py-2 text-sm"
          >
            <option value="">None</option>
            {qualityList.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Language badge (select one or more)">
          <div className="flex flex-wrap gap-2">
            {languageList.map((l) => {
              const on = languages.includes(l);
              return (
                <button
                  type="button"
                  key={l}
                  onClick={() => toggleLanguage(l)}
                  className={`rounded-sm border px-2.5 py-1 text-xs transition-colors ${
                    on
                      ? "border-teal bg-teal text-ink"
                      : "border-border text-text-muted hover:text-text"
                  }`}
                >
                  {l}
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-xs text-text-muted">
            Need another option? Add it from Admin, then Badges.
          </p>
        </Field>

        <Field label="Update label (e.g. S01 | Ep 1-8 Added)">
          <input
            value={updateLabel}
            onChange={(e) => setUpdateLabel(e.target.value)}
            placeholder="S01 | Ep 1-8 Added"
            className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
          />
        </Field>

        {hasSeasons && (
          <Field label="Series status">
            <select
              value={seriesStatus}
              onChange={(e) => setSeriesStatus(e.target.value)}
              className="w-full max-w-xs rounded-sm border border-border bg-surface px-3 py-2 text-sm"
            >
              <option value="">Not set</option>
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </Field>
        )}
      </section>

      <section className="index-card space-y-4 p-6">
        <h2 className="font-display text-lg">Publishing</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
            >
              <option value="DRAFT">Draft</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </Field>
          <Field label="Publish at (for scheduled posts)">
            <input
              type="datetime-local"
              value={publishAt}
              onChange={(e) => setPublishAt(e.target.value)}
              className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
            />
          </Field>
        </div>
      </section>

      {!hasSeasons && (
        <section className="index-card space-y-4 p-6">
          <Field label="Watch link (optional, opens in new tab)">
            <input
              value={watchUrl}
              onChange={(e) => setWatchUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
            />
          </Field>

          <div className="flex items-center justify-between pt-2">
            <h2 className="font-display text-lg">Servers / Download links</h2>
            <button
              type="button"
              onClick={() => {
                setLinks((prev) => [...prev, { ...emptyLink }]);
              }}
              className="rounded-sm border border-border px-3 py-1.5 text-xs text-text-muted hover:text-text"
            >
              + Add server
            </button>
          </div>

          <div className="space-y-4">
            {links.map((link, i) => (
              <div key={i} className="grid gap-3 rounded-sm border border-border p-4 sm:grid-cols-2">
                <Field label="Server name (e.g. Server 1)">
                  <input
                    value={link.providerName}
                    onChange={(e) => updateLink(i, { providerName: e.target.value })}
                    className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="Download URL">
                  <input
                    value={link.url}
                    onChange={(e) => updateLink(i, { url: e.target.value })}
                    className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="Embed player URL (optional - enables in-page player)">
                  <input
                    value={link.embedUrl}
                    onChange={(e) => updateLink(i, { embedUrl: e.target.value })}
                    placeholder="https://.../player.php?v=..."
                    className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="Quality">
                  <input
                    value={link.quality}
                    onChange={(e) => updateLink(i, { quality: e.target.value })}
                    className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
                  />
                </Field>
                <button
                  type="button"
                  onClick={() => {
                    setLinks((prev) => prev.filter((_, idx) => idx !== i));
                  }}
                  className="col-span-2 text-left text-xs text-danger hover:underline"
                >
                  Remove server
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {hasSeasons && contentId && (
        <p className="rounded-sm border border-teal/40 bg-teal/5 p-4 text-sm text-text-muted">
          This content uses Seasons and Episodes for downloads. Manage them from the{" "}
          <a href={"/admin/content/" + contentId + "/seasons"} className="text-teal hover:underline">
            Seasons and Episodes
          </a>{" "}
          page.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className={`rounded-sm px-5 py-2.5 text-sm font-medium text-ink transition-colors disabled:opacity-60 ${
            justSaved ? "bg-teal" : "bg-brass hover:bg-brass-bright"
          }`}
        >
          {loading ? "Saving..." : justSaved ? "Saved" : "Save"}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={(e) => onSubmit(e, "DRAFT")}
          className="rounded-sm border border-border px-5 py-2.5 text-sm text-text-muted hover:text-text"
        >
          Save as draft
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={(e) => onSubmit(e, "PUBLISHED")}
          className="rounded-sm border border-teal px-5 py-2.5 text-sm text-teal hover:bg-teal hover:text-ink"
        >
          Publish now
        </button>
        {contentId && (
          <button
            type="button"
            onClick={onDelete}
            className="ml-auto text-sm text-danger hover:underline"
          >
            Delete content
          </button>
        )}
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-mono uppercase text-text-muted">{label}</label>
      {children}
    </div>
  );
}