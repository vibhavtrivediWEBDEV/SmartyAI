import type { Metadata } from "next";

import VibhavMarketingPage from "@/components/VibhavMarketing/VibhavMarketingPage";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "AI Workspace for Developers, Teachers & Students",
  description:
    "A browser-based macOS-inspired AI workspace with coding, teaching, study, productivity, search, and creative applications.",
  alternates: { canonical: "/" },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "SmartyAI",
  url: getSiteUrl(),
  description:
    "A macOS-inspired AI workspace for developers, teachers, students, and creators.",
  potentialAction: {
    "@type": "SearchAction",
    target: `${getSiteUrl()}/apps?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <VibhavMarketingPage />
    </>
  );
}