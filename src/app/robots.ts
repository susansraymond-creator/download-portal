import type { MetadataRoute } from "next";

// Fallback matches the production domain so a missing env var never
// produces robots/sitemap entries pointing at example.com.
export default function robots(): MetadataRoute.Robots {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://koreandramalink.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/account"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
