import type { MetadataRoute } from "next";

import { DESKTOP_APPS, getDesktopAppSlug } from "@/lib/desktopApps";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const now = new Date();
  const appPages = DESKTOP_APPS.map((app) => ({
    url: `${siteUrl}/apps/${getDesktopAppSlug(app)}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/apps`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...appPages,
  ];
}
