import type { ATSResume } from "./types"

export type LaTeXTemplateId = "classic" | "engineering" | "compact" | "altacv"

export const LATEX_TEMPLATES: Array<{ id: LaTeXTemplateId; name: string; description: string }> = [
  { id: "classic", name: "Classic ATS", description: "Balanced spacing and traditional section rules." },
  { id: "engineering", name: "Engineering", description: "Dense technical layout with prominent skills." },
  { id: "compact", name: "Compact", description: "Space-efficient one-column layout for longer resumes." },
  { id: "altacv", name: "AltaCV", description: "Overleaf visual template · LPPL licensed · one-column adaptation." },
]

export function prepareAltaCVClass(source: string) {
  return source.replace("\\RequirePackage[a-1b]{pdfx}", "\\RequirePackage[hidelinks]{hyperref}")
}

export function escapeLaTeX(value: string): string {
  const replacements: Record<string, string> = {
    "\\": "\\textbackslash{}", "{": "\\{", "}": "\\}", "$": "\\$", "&": "\\&",
    "#": "\\#", "%": "\\%", "_": "\\_", "~": "\\textasciitilde{}", "^": "\\textasciicircum{}",
  }
  return value.replace(/[\\{}$&#%_~^]/g, (character) => replacements[character])
}

function safeUrl(value: string) {
  const cleaned = value.replace(/[{}\\\r\n]/g, "").trim()
  try {
    const url = new URL(cleaned)
    if (!new Set(["http:", "https:", "mailto:"]).has(url.protocol)) return "#"
  } catch { return "#" }
  return cleaned.replace(/([%#_&$])/g, "\\$1").replace(/~/g, "\\textasciitilde{}").replace(/\^/g, "\\textasciicircum{}")
}

function command(value: string) {
  return escapeLaTeX(value.trim())
}

function itemList(values: string[]) {
  if (!values.length) return ""
  return `\\begin{itemize}\n${values.map((value) => `  \\item ${command(value)}`).join("\n")}\n\\end{itemize}`
}

function section(title: string, body: string) {
  return body.trim() ? `\\section*{${title}}\n${body.trim()}\n` : ""
}

function templateSettings(template: LaTeXTemplateId) {
  if (template === "engineering") return { margin: "0.58in", fontSize: "10pt", sectionColor: "1F4E79", sectionGap: "2pt", itemGap: "1pt" }
  if (template === "compact") return { margin: "0.48in", fontSize: "9pt", sectionColor: "222222", sectionGap: "1pt", itemGap: "0pt" }
  return { margin: "0.68in", fontSize: "10pt", sectionColor: "111111", sectionGap: "3pt", itemGap: "1.5pt" }
}

export function generateLaTeXResume(resume: ATSResume, template: LaTeXTemplateId = "classic") {
  if (template === "altacv") return generateAltaCVResume(resume)
  const settings = templateSettings(template)
  const links = [...resume.socialLinks, ...resume.externalLinks]
    .filter((link) => link.url.trim())
    .map((link) => `\\href{${safeUrl(link.url)}}{${command(link.platform || link.url)}}`)
  const contact = [resume.email, resume.phone, resume.location].filter(Boolean).map(command)
  const projects = resume.projects.map((project) => [
    `\\textbf{${command(project.name || "Project")}}`,
    project.description ? itemList([project.description]) : "",
    project.technologies.length ? `\\textit{Technologies: ${command(project.technologies.join(", "))}}` : "",
    ...project.links.filter(Boolean).map((url) => `\\href{${safeUrl(url)}}{${command(url)}}`),
  ].filter(Boolean).join("\n")).join("\n\\vspace{2pt}\n")

  return `\\documentclass[${settings.fontSize},a4paper]{article}
\\usepackage[margin=${settings.margin}]{geometry}
\\usepackage[T1]{fontenc}
\\usepackage{lmodern}
\\usepackage{xcolor}
\\usepackage[hidelinks]{hyperref}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{parskip}
\\pagestyle{empty}
\\definecolor{sectioncolor}{HTML}{${settings.sectionColor}}
\\titleformat{\\section}{\\large\\bfseries\\color{sectioncolor}\\uppercase}{}{0pt}{}[\\titlerule]
\\titlespacing*{\\section}{0pt}{${settings.sectionGap}}{2pt}
\\setlist[itemize]{leftmargin=1.25em,itemsep=${settings.itemGap},topsep=1pt,parsep=0pt}
\\setlength{\\parindent}{0pt}
\\begin{document}
\\begin{center}
  {\\LARGE\\bfseries ${command(resume.name || "Your Name")}}\\\\[2pt]
  ${resume.headline ? `{\\normalsize ${command(resume.headline)}}\\\\[2pt]` : ""}
  ${[...contact, ...links].join(" \\textbar{} ")}
\\end{center}
${section("Professional Summary", command(resume.summary))}${section("Skills", resume.skills.map(command).join(" \\textbullet{} "))}${section("Experience", itemList(resume.experience))}${section("Education", itemList(resume.education))}${section("Projects", projects)}${section("Achievements", itemList(resume.achievements))}${section("Certifications", itemList(resume.certifications))}${section("Languages", resume.languages.map(command).join(" \\textbullet{} "))}\\end{document}
`
}

function generateAltaCVResume(resume: ATSResume) {
  const links = [...resume.socialLinks, ...resume.externalLinks].filter((link) => link.url.trim())
  const info = [
    resume.email ? `\\email{${command(resume.email)}}` : "",
    resume.phone ? `\\phone{${command(resume.phone)}}` : "",
    resume.location ? `\\location{${command(resume.location)}}` : "",
    ...links.map((link) => `\\printinfo{\\faLink}{${command(link.platform || link.url)}}[${safeUrl(link.url)}]`),
  ].filter(Boolean).join("\n  ")
  const cvSection = (title: string, body: string) => body.trim() ? `\\cvsection{${title}}\n${body.trim()}\n\\par\n` : ""
  const projects = resume.projects.map((project) => [
    `\\cvevent{${command(project.name || "Project")}}{${command(project.technologies.join(", "))}}{}{}`,
    project.description ? itemList([project.description]) : "",
    ...project.links.filter(Boolean).map((url) => `\\href{${safeUrl(url)}}{${command(url)}}`),
    "\\divider",
  ].filter(Boolean).join("\n")).join("\n")
  return `%% Generated by SmartyAI using AltaCV v1.7.4.
%% AltaCV: Copyright LianTze Lim, LPPL 1.3 or later.
%% https://github.com/liantze/AltaCV
\\documentclass[10pt,a4paper,withhyper]{altacv}
\\geometry{left=1.35cm,right=1.35cm,top=1.25cm,bottom=1.25cm}
\\definecolor{SlateGrey}{HTML}{2E2E2E}
\\definecolor{LightGrey}{HTML}{555555}
\\definecolor{AccentBlue}{HTML}{1F4E79}
\\colorlet{name}{black}
\\colorlet{tagline}{AccentBlue}
\\colorlet{heading}{AccentBlue}
\\colorlet{headingrule}{AccentBlue}
\\colorlet{subheading}{AccentBlue}
\\colorlet{accent}{AccentBlue}
\\colorlet{emphasis}{SlateGrey}
\\colorlet{body}{LightGrey}
\\renewcommand{\\cvItemMarker}{{\\small\\textbullet}}
\\begin{document}
\\name{${command(resume.name || "Your Name")}}
\\tagline{${command(resume.headline)}}
\\personalinfo{
  ${info}
}
\\makecvheader
${cvSection("Professional Summary", command(resume.summary))}${cvSection("Skills", resume.skills.map(command).join(" \\textbullet{} "))}${cvSection("Experience", itemList(resume.experience))}${cvSection("Education", itemList(resume.education))}${cvSection("Projects", projects)}${cvSection("Achievements", itemList(resume.achievements))}${cvSection("Certifications", itemList(resume.certifications))}${cvSection("Languages", resume.languages.map(command).join(" \\textbullet{} "))}\\end{document}
`
}

export function latexFileName(name: string) {
  const safe = name.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "Resume"
  return `${safe}-ATS-Resume.tex`
}
