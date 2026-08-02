import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";

import {
  DESKTOP_APPS,
  getDesktopAppBySlug,
  getDesktopAppSlug,
} from "@/lib/desktopApps";
import { getSiteUrl } from "@/lib/site";

type AppDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return DESKTOP_APPS.map((app) => ({ slug: getDesktopAppSlug(app) }));
}

export async function generateMetadata({ params }: AppDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const app = getDesktopAppBySlug(slug);
  if (!app) return {};

  return {
    title: `${app.displayName} — AI App`,
    description: `${app.description} Explore ${app.displayName} inside the SmartyAI macOS-inspired workspace.`,
    alternates: { canonical: `/apps/${slug}` },
    openGraph: {
      type: "website",
      title: `${app.displayName} | SmartyAI`,
      description: app.description,
      url: `/apps/${slug}`,
    },
  };
}

export default async function AppDetailPage({ params }: AppDetailPageProps) {
  const { slug } = await params;
  const app = getDesktopAppBySlug(slug);
  if (!app) notFound();

  const relatedApps = DESKTOP_APPS.filter(
    (candidate) => candidate.category === app.category && candidate.name !== app.name,
  ).slice(0, 3);
  const siteUrl = getSiteUrl();
  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: app.displayName,
    description: app.description,
    applicationCategory: `${app.category}Application`,
    operatingSystem: "Web",
    url: `${siteUrl}/apps/${slug}`,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      category: "Free trial",
    },
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#050506] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-[-25rem] h-[55rem] w-[70rem] -translate-x-1/2 rounded-full bg-blue-600/20 blur-[160px]" />
      </div>

      <header className="relative border-b border-white/10 bg-black/40 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3 font-semibold">
            <span className="grid h-10 w-10 place-items-center rounded-[13px] bg-gradient-to-br from-blue-500 to-cyan-400">
              <Sparkles className="h-5 w-5" />
            </span>
            SmartyAI
          </Link>
          <Link href="/apps" className="flex items-center gap-2 text-sm text-white/60 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" /> All apps
          </Link>
        </div>
      </header>

      <section className="relative mx-auto grid max-w-7xl gap-14 px-6 pb-24 pt-20 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:pt-28">
        <div>
          <span className="inline-flex rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-sm font-medium text-blue-200">
            {app.category} app
          </span>
          <h1 className="mt-7 text-6xl font-semibold tracking-[-0.06em] sm:text-8xl">{app.displayName}</h1>
          <p className="mt-7 max-w-2xl text-xl leading-9 text-white/55">{app.description}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/sign-up" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 font-semibold text-black transition hover:bg-blue-100">
              Try it free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/apps" className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-7 py-4 font-semibold text-white transition hover:bg-white/10">
              Explore more apps
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute inset-8 rounded-full bg-blue-500/30 blur-[100px]" />
          <div className="relative overflow-hidden rounded-[32px] border border-white/15 bg-gradient-to-b from-white/15 to-white/[0.04] p-3 shadow-2xl shadow-black/60">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              <span className="ml-3 text-xs text-white/35">SmartyAI · {app.displayName}</span>
            </div>
            <div className="grid min-h-[390px] place-items-center rounded-b-[24px] bg-black/40 p-12">
              <div className="text-center">
                <div className="mx-auto grid h-32 w-32 place-items-center overflow-hidden rounded-[32px] border border-white/15 bg-white/10 shadow-2xl">
                  <img src={app.icon} alt={`${app.displayName} icon`} className="h-24 w-24 object-contain" />
                </div>
                <h2 className="mt-7 text-2xl font-semibold">Built into your intelligent desktop</h2>
                <p className="mt-3 text-white/45">Launch instantly. Work in a focused, resizable macOS-style window.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-y border-white/10 bg-white/[0.025]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              ["Native workspace", "Use the app without leaving your SmartyAI desktop or losing context."],
              ["AI-assisted", "Work faster with intelligent actions and connected workspace context."],
              ["Ready everywhere", "Access your workspace from a modern browser on desktop or mobile."],
            ].map(([title, description]) => (
              <article key={title} className="rounded-[26px] border border-white/10 bg-white/[0.045] p-7">
                <Check className="h-6 w-6 text-green-400" />
                <h2 className="mt-5 text-xl font-semibold">{title}</h2>
                <p className="mt-3 leading-7 text-white/45">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {relatedApps.length > 0 && (
        <section className="relative mx-auto max-w-7xl px-6 py-24">
          <h2 className="text-3xl font-semibold tracking-tight">More {app.category} apps</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {relatedApps.map((related) => (
              <Link key={related.name} href={`/apps/${getDesktopAppSlug(related)}`} className="group rounded-[24px] border border-white/10 bg-white/[0.045] p-6 transition hover:-translate-y-1 hover:border-white/25">
                <div className="flex items-center gap-4">
                  <img src={related.icon} alt="" className="h-12 w-12 object-contain" />
                  <div>
                    <h3 className="font-semibold">{related.displayName}</h3>
                    <span className="text-sm text-white/40">View app</span>
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4 text-white/30 transition group-hover:translate-x-1 group-hover:text-white" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
