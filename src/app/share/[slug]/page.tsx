import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://koreandramalink.vercel.app";

export const metadata: Metadata = {
  title: "Shared content",
  description: "Open shared content",
  robots: { index: false, follow: false },
  openGraph: { images: [] },
  twitter: { card: "summary" },
};

export default async function NoPreviewSharePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const queryString = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string") queryString.set(key, value);
    else if (Array.isArray(value) && value[0]) queryString.set(key, value[0]);
  }

  const target = `${SITE_URL}/content/${encodeURIComponent(slug)}${
    queryString.toString() ? `?${queryString.toString()}` : ""
  }`;

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
        background: "#0e1015",
        color: "#e7e6df",
        fontFamily: "system-ui, sans-serif",
        textAlign: "center",
      }}
    >
      <meta httpEquiv="refresh" content={`0;url=${target}`} />
      <div>
        <p>Opening shared content…</p>
        <a href={target} style={{ color: "#c9a227" }}>
          Continue
        </a>
      </div>
    </main>
  );
}
