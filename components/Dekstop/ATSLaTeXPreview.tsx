import type { ATSResume } from "@/lib/ats/types"
import type { LaTeXTemplateId } from "@/lib/ats/latex"

export function ATSLaTeXPreview({ resume, template }: { resume: ATSResume; template: LaTeXTemplateId }) {
  const compact = template === "compact"
  const engineering = template === "engineering"
  const altaCV = template === "altacv"
  const accent = engineering ? "#60a5fa" : altaCV ? "#f87171" : "#ffffff"
  const sectionMargin = compact ? "mt-3" : "mt-5"
  const textStyle = compact ? "text-[10px] leading-[1.45]" : "text-[11px] leading-[1.6]"
  const heading = (title: string) => <h3 style={{ borderColor: accent, color: accent }} className="border-b pb-1 text-[11px] font-bold uppercase tracking-[0.13em]">{title}</h3>
  const listSection = (title: string, values: string[]) => values.length ? (
    <section className={sectionMargin}>
      {heading(title)}
      <ul className={`${compact ? "mt-1.5 space-y-0.5" : "mt-2.5 space-y-1.5"} ${textStyle} text-zinc-100`}>
        {values.map((value, index) => <li key={`${title}-${index}`} className="pl-1">• {value}</li>)}
      </ul>
    </section>
  ) : null

  return (
    <article className={`mx-auto min-h-[1120px] w-full max-w-[794px] border border-white/15 bg-[#101012] ${compact ? "p-[5%]" : "p-[7%]"} font-sans text-white shadow-2xl shadow-black/60`}>
      <header className={engineering ? "border-l-4 border-blue-400 pl-4" : altaCV ? "border-t-4 border-red-400 pt-3" : ""}>
        <h1 style={{ color: accent }} className={`${compact ? "text-xl" : "text-2xl"} font-bold tracking-tight`}>{resume.name || "Your Name"}</h1>
        <p className="mt-0.5 text-sm font-semibold text-zinc-200">{resume.headline}</p>
        <p className="mt-1.5 text-[10px] leading-4 text-zinc-300">{[resume.email, resume.phone, resume.location].filter(Boolean).join(" | ")}</p>
        {[...resume.socialLinks, ...resume.externalLinks].length > 0 && <p className="mt-1 text-[9px] text-zinc-400">{[...resume.socialLinks, ...resume.externalLinks].map((link) => `${link.platform}: ${link.url}`).join(" | ")}</p>}
      </header>
      {resume.summary && <section className={sectionMargin}>{heading("Professional Summary")}<p className={`mt-2 whitespace-pre-wrap ${textStyle} text-zinc-100`}>{resume.summary}</p></section>}
      {listSection("Skills", [resume.skills.join(" • ")].filter(Boolean))}
      {listSection("Experience", resume.experience)}
      {listSection("Education", resume.education)}
      {resume.projects.length > 0 && <section className={sectionMargin}>{heading("Projects")}{resume.projects.map((project, index) => <div key={`${project.name}-${index}`} className={`mt-2 ${textStyle} text-zinc-100`}><strong style={{ color: accent }}>{project.name}</strong>{project.description && <p>{project.description}</p>}{project.technologies.length > 0 && <p className="text-zinc-300">Technologies: {project.technologies.join(", ")}</p>}{project.links.map((link) => <p key={link} className="text-zinc-400">{link}</p>)}</div>)}</section>}
      {listSection("Achievements", resume.achievements)}
      {listSection("Certifications", resume.certifications)}
      {listSection("Languages", resume.languages)}
    </article>
  )
}
