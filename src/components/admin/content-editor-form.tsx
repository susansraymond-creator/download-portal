"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import slugify from "slugify";

type DownloadLinkForm = {
  id?: string;
  providerName: string;
  url: string;
  fileSize: string;
  version: string;
  quality: string;
  language: string;
  notes: string;
  status: "ACTIVE" | "DISABLED" | "BROKEN";
};

type Category = { id: string; name: string };

const CONTENT_TYPES = [
  "VIDEO",
  "COURSE",
  "TUTORIAL",
  "DOCUMENT",
  "SOFTWARE",
  "AUDIO",
  "IMAGE",
  "ARCHIVE",
];

const emptyLink: DownloadLinkForm = {
  providerName: "",
  url: "",
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
  initial,
}: {
  contentId?: string;
  categories: Category[];
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
    publishAt: string;
    metaTitle: string;
    metaDescription: string;
    downloadLinks: DownloadLinkForm[];
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
  const [posterUrl, setPosterUrl] = useState(initial?.posterUrl ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(initial?.thumbnailUrl ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [isFeatured, setIsFeatured] = useState(initial?.isFeatured ?? false);
  const [publishAt, setPublishAt] = useState(initial?.publishAt ?? "");
  const [metaTitle, setMetaTitle] = useState(initial?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(initial?.metaDescription ?? "");
  const [links, setLinks] = useState<DownloadLinkForm[]>(initial?.downloadLinks ?? [emptyLink]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function onTitleChange(v: string) {
    setTitle(v);
    if (!slugTouched) setSlug(slugify(v, { lower: true, strict: true }));
  }

  function updateLink(i: number, patch: Partial<DownloadLinkForm>) {
    setLinks((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
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
      thumbnailUrl: thumbnailUrl || undefined,
      categoryId: categoryId || undefined,
      tagIds: [],
      isFeatured,
      publishAt: publishAt ? new Date(publishAt).toISOString() : undefined,
      metaTitle: metaTitle || undefined,
      metaDescription: metaDescription || undefined,
      downloadLinks: links
        .filter((l) => l.providerName && l.url)
        .map((l) => ({
          providerName: l.providerName,
          url: l.url,
          fileSize: l.fileSize || undefined,
          version: l.version || undefined,
          quality: l.quality || undefined,
          language: l.language || undefined,
          notes: l.notes || undefined,
          status: l.status,
          sortOrder: 0,
        })),
    };

    const res = await fetch(
      contentId ? `/api/admin/content/${contentId}` : "/api/admin/content",
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

    router.push("/admin/content");
    router.refresh();
  }

  async function onDelete() {
    if (!contentId) return;
    if (!confirm("Delete this content permanently? This cannot be undone.")) return;
    await fetch(`/api/admin/content/${contentId}`, { method: "DELETE" });
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

        <Field label="Short description (card preview)">
          <input
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            maxLength={300}
            className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
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
          <Field label="Type">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
            >
              {CONTENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>

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

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Poster image URL">
            <input
              value={posterUrl}
              onChange={(e) => setPosterUrl(e.target.value)}
              className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Thumbnail image URL">
            <input
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
            />
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm text-text-muted">
          <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
          Feature on homepage
        </label>
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

      <section className="index-card space-y-4 p-6">
        <h2 className="font-display text-lg">SEO</h2>
        <Field label="Meta title">
          <input
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            maxLength={70}
            className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Meta description">
          <textarea
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            maxLength={160}
            rows={2}
            className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
          />
        </Field>
      </section>

      <section className="index-card space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg">Download links</h2>
          <button
            type="button"
            onClick={() => setLinks((prev) => [...prev, { ...emptyLink }])}
            className="rounded-sm border border-border px-3 py-1.5 text-xs text-text-muted hover:text-text"
          >
            + Add link
          </button>
        </div>

        <div className="space-y-4">
          {links.map((link, i) => (
            <div key={i} className="grid gap-3 rounded-sm border border-border p-4 sm:grid-cols-2">
              <Field label="Provider name">
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
              <Field label="File size">
                <input
                  value={link.fileSize}
                  onChange={(e) => updateLink(i, { fileSize: e.target.value })}
                  className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Version">
                <input
                  value={link.version}
                  onChange={(e) => updateLink(i, { version: e.target.value })}
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
              <Field label="Language">
                <input
                  value={link.language}
                  onChange={(e) => updateLink(i, { language: e.target.value })}
                  className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Notes">
                <input
                  value={link.notes}
                  onChange={(e) => updateLink(i, { notes: e.target.value })}
                  className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Status">
                <select
                  value={link.status}
                  onChange={(e) => updateLink(i, { status: e.target.value as DownloadLinkForm["status"] })}
                  className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="DISABLED">Disabled</option>
                  <option value="BROKEN">Broken</option>
                </select>
              </Field>
              <button
                type="button"
                onClick={() => setLinks((prev) => prev.filter((_, idx) => idx !== i))}
                className="col-span-2 text-left text-xs text-danger hover:underline"
              >
                Remove link
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-sm bg-brass px-5 py-2.5 text-sm font-medium text-ink hover:bg-brass-bright disabled:opacity-60"
        >
          {loading ? "Saving…" : "Save"}
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
