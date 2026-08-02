import Link from "next/link";
import { ArrowRight, BookOpen, Code2, GraduationCap } from "lucide-react";

const audiences = [
  {
    title: "For developers",
    description: "Move from idea to running code with an editor, terminal, AI debugging, live previews, projects, and browser research in one workspace.",
    icon: Code2,
    accent: "from-blue-500 to-cyan-400",
    apps: "VS Code · Terminal · Projects · AI Search",
  },
  {
    title: "For teachers",
    description: "Create lessons, generate structured learning material, explain concepts visually, manage documents, and teach with an interactive AI assistant.",
    icon: GraduationCap,
    accent: "from-purple-500 to-pink-400",
    apps: "Smarty Teacher · AI Book · PDF · Tables",
  },
  {
    title: "For students",
    description: "Study difficult topics, practice interviews, explore NCERT material, organize notes, analyze files, and get focused help whenever it is needed.",
    icon: BookOpen,
    accent: "from-emerald-500 to-cyan-400",
    apps: "Science Book · Interview · Notes · AI Search",
  },
];

export default function AudienceSection() {
  return (
    <section id="solutions" className="relative overflow-hidden bg-black py-28 sm:py-36">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,.13),transparent_42%)]" />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="max-w-3xl">
          <span className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-300">One workspace, built around you</span>
          <h2 className="mt-5 text-5xl font-semibold tracking-[-0.05em] text-white sm:text-6xl">
            Serious tools without the complexity.
          </h2>
          <p className="mt-6 text-xl leading-8 text-white/50">
            SmartyAI adapts to the work developers, educators, and learners actually do.
          </p>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {audiences.map((audience) => {
            const Icon = audience.icon;
            return (
              <article key={audience.title} className="group rounded-[30px] border border-white/10 bg-gradient-to-b from-white/[0.09] to-white/[0.035] p-8 transition duration-300 hover:-translate-y-1 hover:border-white/20">
                <div className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${audience.accent} shadow-xl`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="mt-8 text-2xl font-semibold tracking-tight text-white">{audience.title}</h3>
                <p className="mt-4 min-h-28 leading-7 text-white/50">{audience.description}</p>
                <p className="mt-6 border-t border-white/10 pt-6 text-sm text-white/35">{audience.apps}</p>
                <Link href="/apps" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-white">
                  Explore apps <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
