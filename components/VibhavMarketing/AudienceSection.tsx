import Link from "next/link";
import { ArrowRight, BookOpen, Code2, GraduationCap, CheckCircle2 } from "lucide-react";

const audiences = [
  {
    title: "Junior Developers",
    description: "Don't have a portfolio? Upload your resume → AI builds your professional desktop with projects, skills, and interactive CV. Share it with HR in 5 minutes.",
    icon: Code2,
    accent: "from-blue-500 to-cyan-400",
    stats: "5 min setup • Portfolio ready",
    cta: "Create Portfolio Desktop",
  },
  {
    title: "Students & Learners",
    description: "Your academic profile, projects, certifications, and skills automatically organized. Plus AI-powered interview prep that knows YOUR background.",
    icon: GraduationCap,
    accent: "from-purple-500 to-pink-400",
    stats: "Resume → Desktop → Interview",
    cta: "Build Student Desktop",
  },
  {
    title: "Experienced Professionals",
    description: "Already have experience? Get a customizable developer desktop that showcases your architecture, open source work, and engineering expertise beautifully.",
    icon: BookOpen,
    accent: "from-emerald-500 to-teal-400",
    stats: "Full customization • Advanced apps",
    cta: "Customize My Desktop",
  },
];

export default function AudienceSection() {
  return (
    <section id="solutions" className="relative overflow-hidden bg-black py-28 sm:py-36">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,.13),transparent_42%)]" />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="max-w-3xl mb-12">
          <span className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-400">Built for every developer career stage</span>
          <h2 className="mt-5 text-5xl font-semibold tracking-[-0.05em] text-white sm:text-6xl">
            Your Career Stage.{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Your Desktop.
            </span>
          </h2>
          <p className="mt-6 text-xl leading-8 text-white/50">
            Whether you're starting out or scaling up, SmartyAI adapts to showcase YOUR journey.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {audiences.map((audience) => {
            const Icon = audience.icon;
            return (
              <article key={audience.title} className="group relative rounded-[30px] border border-white/10 bg-gradient-to-b from-white/[0.09] to-white/[0.035] p-8 transition duration-300 hover:-translate-y-2 hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/10">
                {/* Gradient top border */}
                <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-[30px] bg-gradient-to-r ${audience.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                
                <div className={`grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br ${audience.accent} shadow-xl mb-6`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold tracking-tight text-white mb-3">{audience.title}</h3>
                <p className="min-h-32 leading-7 text-white/60 mb-4">{audience.description}</p>
                
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-emerald-400 font-medium">{audience.stats}</span>
                </div>
                
                <Link href="/sign-up" className="inline-flex items-center gap-2 text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                  {audience.cta} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
