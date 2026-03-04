import type { MetadataRoute } from "next";

const getSiteUrl = () => process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  const sitemap = siteUrl ? `${siteUrl.replace(/\/+$/, "")}/sitemap.xml` : "/sitemap.xml";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap,
  };
}
