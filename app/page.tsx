import type { Metadata } from "next";

import VibhavMarketingPage from "@/components/VibhavMarketing/VibhavMarketingPage";
import { getSiteUrl } from "@/lib/site";
import { generatePageMetadata, generateOrganizationJsonLd } from "@/lib/seo";

export const metadata: Metadata = generatePageMetadata({
  title: "AI Workspace for Developers, Teachers & Students | VibhavMacOS",
  description:
    "A browser-based macOS-inspired AI workspace with coding, teaching, study, productivity, search, and creative applications. Build, learn, and create with AI.",
  path: "/",
});

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "VibhavMacOS",
  url: getSiteUrl(),
  description:
    "A macOS-inspired AI workspace for developers, teachers, students, and creators.",
  potentialAction: {
    "@type": "SearchAction",
    target: `${getSiteUrl()}/apps?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

const organizationJsonLd = generateOrganizationJsonLd();

export default function Home() {
  return (
    <>
      {/* WebSite Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      {/* Organization Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <VibhavMarketingPage />
    </>
  );
}