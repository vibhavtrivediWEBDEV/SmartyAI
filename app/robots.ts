import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/apps", "/sign-in", "/sign-up"],
        disallow: [
          "/api/",
          "/desktop/",
          "/interview/",
          "/terminal/",
          "/user-interviews/",
          "/profile/",
          "/auth/",
          "/dashboard/",
          "/private/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/apps", "/sign-in", "/sign-up"],
      },
      {
        userAgent: "Bingbot",
        allow: ["/", "/apps"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
