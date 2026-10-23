import type { Metadata } from "next";
import { NoPreviewRedirect } from "@/components/no-preview-redirect";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://koreandramalink.vercel.app";

export const metadata: Metadata = {
  title: "Shared link",
  description: "Open shared content",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Shared link",
    description: "Open shared content",
    images: [],
  },
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

  return <NoPreviewRedirect target={target} />;
}
