import { jsPDF } from "jspdf"
import type { ATSResume } from "./types"

export function resumeFileName(name: string) {
  const safe = name.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "Resume"
  return `${safe}-ATS-Resume.pdf`
}

export function generateResumePDF(resume: ATSResume): Blob {
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" })
  const margin = 18
  const width = 210 - margin * 2
  const bottom = 279
  let y = 18

  const ensure = (height: number) => { if (y + height > bottom) { pdf.addPage(); y = 18 } }
  const lines = (text: string, size = 10) => { pdf.setFontSize(size); return pdf.splitTextToSize(text, width) as string[] }
  const write = (text: string, options: { size?: number; bold?: boolean; gap?: number; bullet?: boolean } = {}) => {
    if (!text.trim()) return
    const size = options.size ?? 10
    const rendered = lines(options.bullet ? `• ${text}` : text, size)
    const height = rendered.length * size * 0.42 + (options.gap ?? 1)
    ensure(height)
    pdf.setFont("helvetica", options.bold ? "bold" : "normal")
    pdf.setFontSize(size)
    pdf.text(rendered, margin, y)
    y += height
  }
  const heading = (title: string) => {
    ensure(10); y += 2; pdf.setDrawColor(110); pdf.line(margin, y, 210 - margin, y); y += 5
    write(title.toUpperCase(), { size: 11, bold: true, gap: 2 })
  }

  write(resume.name || "Resume", { size: 19, bold: true, gap: 2 })
  write(resume.headline, { size: 11, bold: true })
  const contact = [resume.email, resume.phone, resume.location].filter(Boolean).join("  |  ")
  write(contact, { size: 9, gap: 2 })
  for (const link of [...resume.socialLinks, ...resume.externalLinks]) {
    if (!link.url) continue
    ensure(5); pdf.setTextColor(25, 90, 180); pdf.setFontSize(8); pdf.textWithLink(`${link.platform}: ${link.url}`, margin, y, { url: link.url }); pdf.setTextColor(0); y += 4
  }
  if (resume.summary) { heading("Professional Summary"); write(resume.summary) }
  if (resume.skills.length) { heading("Skills"); write(resume.skills.join(" • ")) }
  if (resume.experience.length) { heading("Experience"); resume.experience.forEach((item) => write(item, { bullet: true, gap: 2 })) }
  if (resume.education.length) { heading("Education"); resume.education.forEach((item) => write(item, { bullet: true })) }
  if (resume.projects.length) {
    heading("Projects")
    resume.projects.forEach((project) => {
      write(project.name, { bold: true, gap: 1 }); write(project.description, { bullet: true })
      if (project.technologies.length) write(`Technologies: ${project.technologies.join(", ")}`, { size: 9 })
      project.links.forEach((url) => { ensure(5); pdf.setTextColor(25, 90, 180); pdf.setFontSize(8); pdf.textWithLink(url, margin, y, { url }); pdf.setTextColor(0); y += 4 })
    })
  }
  const sections: Array<[string, string[]]> = [["Achievements", resume.achievements], ["Certifications", resume.certifications], ["Languages", resume.languages]]
  sections.forEach(([title, values]) => { if (values.length) { heading(title); values.forEach((value) => write(value, { bullet: true })) } })
  return pdf.output("blob")
}
