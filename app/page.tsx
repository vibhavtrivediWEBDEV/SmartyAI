import type { Metadata } from "next";

import CareerAgentMarketingPage from "@/components/marketing/CareerAgentPage";
import { getSiteUrl } from "@/lib/site";
import { generatePageMetadata, generateOrganizationJsonLd } from "@/lib/seo";

export const metadata: Metadata = generatePageMetadata({
  title: "SmartyAI — The AI Operating System for Work and Career",
  description:
    "Operate your Mac with permission-controlled AI automation, then plan, learn, practice, and apply from one complete career workspace.",
  path: "/",
});

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "SmartyAI",
  url: getSiteUrl(),
  description:
    "A permission-controlled AI operating system for desktop automation, role-specific planning, learning, coding practice, mock interviews, and resume improvement.",
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
      <CareerAgentMarketingPage />
    </>
  );
}