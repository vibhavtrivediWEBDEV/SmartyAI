import type { Metadata } from "next";

import CareerAgentMarketingPage from "@/components/marketing/CareerAgentPage";
import { getSiteUrl } from "@/lib/site";
import { generatePageMetadata, generateOrganizationJsonLd } from "@/lib/seo";

export const metadata: Metadata = generatePageMetadata({
  title: "SmartyAI — Your AI Career Agent | Interview Preparation on Autopilot",
  description:
    "SmartyAI turns job opportunities into complete preparation systems. One AI agent that teaches, practices, schedules, and tracks your interview preparation journey.",
  path: "/",
});

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "SmartyAI",
  url: getSiteUrl(),
  description:
    "Your AI Career Agent — turn job opportunities into complete preparation systems with intelligent teaching, practice, and scheduling.",
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