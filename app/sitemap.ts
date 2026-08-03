import type { MetadataRoute } from "next";

import { DESKTOP_APPS, getDesktopAppSlug } from "@/lib/desktopApps";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const now = new Date();

  // Static public pages
  const staticPages = [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 1.0,
    },
    {
      url: `${siteUrl}/apps`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${siteUrl}/sign-in`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${siteUrl}/sign-up`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
  ];

  // Dynamic app pages - all apps auto-indexed
  const appPages = DESKTOP_APPS.map((app) => ({
    url: `${siteUrl}/apps/${getDesktopAppSlug(app)}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: app.essential ? 0.8 : 0.7,
  }));

  return [...staticPages, ...appPages];
}
