import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { prisma } from "@/lib/prisma";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

export async function generateMetadata(): Promise<Metadata> {
  const verificationSetting = await prisma.setting
    .findUnique({ where: { key: "googleSiteVerification" } })
    .catch(() => null);
  const siteVerification =
    (verificationSetting?.value as string) || process.env.GOOGLE_SITE_VERIFICATION;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: "The Stacks — Personal Content Archive",
      template: "%s | The Stacks",
    },
    description:
      "A curated download catalog for personally owned and licensed digital content.",
    openGraph: {
      type: "website",
      siteName: "The Stacks",
    },
    twitter: {
      card: "summary_large_image",
    },
    robots: {
      index: true,
      follow: true,
    },
    verification: {
      google: siteVerification,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settingsRows = await prisma.setting
    .findMany({
      where: { key: { in: ["googleAnalyticsId", "googleSiteVerification", "googleAdsensePublisherId", "adsenseEnabled"] } },
    })
    .catch(() => []);
  const settingsMap = Object.fromEntries(settingsRows.map((r) => [r.key, r.value]));

  const gaId = (settingsMap.googleAnalyticsId as string) || process.env.NEXT_PUBLIC_GA_ID;
  const siteVerification =
    (settingsMap.googleSiteVerification as string) || process.env.GOOGLE_SITE_VERIFICATION;
  const adsensePublisherId = settingsMap.googleAdsensePublisherId as string | undefined;
  const adsenseEnabled = (settingsMap.adsenseEnabled as boolean) ?? false;

  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col antialiased">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        {adsenseEnabled && adsensePublisherId && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsensePublisherId}`}
            crossOrigin="anonymous"
          />
        )}
        {gaId && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaId}');
                `,
              }}
            />
          </>
        )}
      </body>
    </html>
  );
}
