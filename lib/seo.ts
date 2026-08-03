import type { Metadata } from "next";
import type { DesktopAppDefinition } from "./desktopApps";
import { getDesktopAppSlug } from "./desktopApps";
import { getSiteUrl } from "./site";

/**
 * SEO helper to generate consistent metadata for app pages
 * Ensures all apps get proper SEO tags automatically
 */

export interface SEOConfig {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
}

/**
 * Generate metadata object for any page
 */
export function generatePageMetadata(config: SEOConfig): Metadata {
  const siteUrl = getSiteUrl();
  const fullUrl = `${siteUrl}${config.path}`;
  const defaultImage = `${siteUrl}/og-image.png`;

  return {
    title: config.title,
    description: config.description,
    alternates: {
      canonical: config.path,
    },
    openGraph: {
      type: config.type || "website",
      title: config.title,
      description: config.description,
      url: fullUrl,
      siteName: "VibhavMacOS",
      images: [
        {
          url: config.image || defaultImage,
          width: 1200,
          height: 630,
          alt: config.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: config.title,
      description: config.description,
      images: [config.image || defaultImage],
    },
  };
}

/**
 * Generate metadata for app detail pages
 * Takes app data and returns complete metadata object
 */
export function generateAppMetadata(app: DesktopAppDefinition): Metadata {
  const slug = getDesktopAppSlug(app);
  const title = `${app.displayName} | VibhavMacOS`;
  const description = `${app.description} Experience ${app.displayName} in the VibhavMacOS AI workspace.`;

  return generatePageMetadata({
    title,
    description,
    path: `/apps/${slug}`,
    image: app.icon,
  });
}

/**
 * Generate JSON-LD for SoftwareApplication schema
 * Required for Google to understand app pages
 */
export function generateAppJsonLd(app: DesktopAppDefinition) {
  const siteUrl = getSiteUrl();
  const slug = getDesktopAppSlug(app);

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: app.displayName,
    description: app.description,
    applicationCategory: `${app.category}Application`,
    operatingSystem: "Web Browser",
    url: `${siteUrl}/apps/${slug}`,
    image: app.icon,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      category: "Free trial",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "1250",
    },
  };
}

/**
 * Generate breadcrumb JSON-LD schema
 * Helps Google understand site structure
 */
export function generateBreadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.path}`,
    })),
  };
}

/**
 * Generate Organization JSON-LD schema for homepage
 */
export function generateOrganizationJsonLd() {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "VibhavMacOS",
    url: siteUrl,
    logo: `${siteUrl}/app.svg`,
    description: "A macOS-inspired AI workspace for developers, teachers, students, and creators.",
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
    },
  };
}

/**
 * Generate ItemList JSON-LD for apps listing page
 * Helps Google discover all apps
 */
export function generateAppsListJsonLd(apps: DesktopAppDefinition[]) {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "VibhavMacOS Apps Directory",
    description: "Complete list of AI-powered applications in the VibhavMacOS workspace",
    numberOfItems: apps.length,
    itemListElement: apps.map((app, index) => {
      const slug = getDesktopAppSlug(app);
      return {
        "@type": "ListItem",
        position: index + 1,
        name: app.displayName,
        description: app.description,
        url: `${siteUrl}/apps/${slug}`,
      };
    }),
  };
}
