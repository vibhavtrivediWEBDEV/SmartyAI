"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Editor from "@monaco-editor/react"
import {
  Archive,
  Check,
  Code2,
  Download,
  ExternalLink,
  Eye,
  FileQuestion,
  Image as ImageIcon,
  Loader2,
  Play,
  RefreshCw,
  Save,
  Sheet,
  Terminal,
  Upload,
  Video,
} from "lucide-react"
import { toast } from "sonner"
import * as XLSX from "xlsx"

import { PdfViewer } from "@/app/components/terminal/pdfviwer"
import { executeCode } from "@/lib/utils/backendExecutor"
import { getLanguageFromExtension } from "@/lib/utils/language"
import { bundleReact } from "@/lib/utils/reactBundler"
import { getRunStrategy } from "@/lib/utils/runStrategy"

export interface PreviewFile {
  id: string
  name: string
  type: "folder" | "document" | "video" | "image" | "spreadsheet" | "archive" | "code" | "other" | "file" | "link"
  kind?: "folder" | "file" | "text" | "link"
  parentId?: string | null
  content?: string
  src?: string
  url?: string
  mimeType?: string | null
  sizeBytes?: number
  updatedAt?: string
}

interface FileDetailsViewerProps {
  file: PreviewFile
  projectId?: string
  onUpdate?: (updatedFile: PreviewFile) => void
  onOpenInVSCode?: (file: PreviewFile) => void
}

type ViewerMode = "preview" | "code" | "output"

const codeExtensions = new Set([
  "html", "htm", "css", "scss", "js", "jsx", "mjs", "cjs", "ts", "tsx", "json", "xml", "yaml", "yml",
  "md", "py", "java", "c", "cpp", "cc", "cxx", "go", "rs", "php", "rb", "swift", "kt", "sql", "sh", "txt", "csv",
])
const webExtensions = new Set(["html", "htm", "css", "js", "jsx", "tsx"])
const backendExtensions = new Set(["py", "java", "c", "cpp", "cc", "cxx", "go", "rs", "php", "rb", "ts"])
const spreadsheetExtensions = new Set(["xlsx", "xls", "xlsm", "xlsb", "csv", "tsv", "ods", "fods", "numbers"])
const extensionOf = (name: string) => name.includes(".") ? name.split(".").pop()!.toLowerCase() : ""

const escapeScript = (value: string) => value.replace(/<\/script/gi, "<\\/script")

function htmlDocument(content: string, extension: string) {
  if (extension === "html" || extension === "htm") return content
  if (extension === "css") return `<!doctype html><html><head><style>${content}</style></head><body><main><h1>CSS Preview</h1><p>Your stylesheet is applied to this preview document.</p><button>Interactive element</button></main></body></html>`
  if (extension === "js") return `<!doctype html><html><body><div id="app"><h2>JavaScript Preview</h2><p>Open Output to inspect console logs.</p></div><script>${escapeScript(content)}</script></body></html>`
  return content
}

function reactDocument(code: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:0;padding:24px}*{box-sizing:border-box}</style></head><body><div id="root"></div><script src="https://unpkg.com/react@18.2.0/umd/react.development.js"></script><script src="https://unpkg.com/react-dom@18.2.0/umd/react-dom.development.js"></script><script src="https://unpkg.com/@babel/standalone/babel.min.js"></script><script type="text/babel">${escapeScript(code)}
const __root = ReactDOM.createRoot(document.getElementById('root'));
const __candidate = typeof App !== 'undefined' ? App : typeof Counter !== 'undefined' ? Counter : null;
if (__candidate) __root.render(React.createElement(__candidate));
else document.getElementById('root').innerHTML = '<p>No App component found. Export or declare App.</p>';
</script></body></html>`
}

export function FileDetailsViewer({ file, onUpdate, onOpenInVSCode }: FileDetailsViewerProps) {
  const [draft, setDraft] = useState(file)
  const [mode, setMode] = useState<ViewerMode>("preview")
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState(false)
  const [replacing, setReplacing] = useState(false)
  const [output, setOutput] = useState("")
  const [reactPreview, setReactPreview] = useState<string | null>(null)
  const replaceInputRef = useRef<HTMLInputElement>(null)
  const extension = extensionOf(draft.name)
  const isCode = draft.kind === "text" || draft.type === "code" || codeExtensions.has(extension)
  const canPreview = webExtensions.has(extension) || spreadsheetExtensions.has(extension) || draft.type === "spreadsheet" || draft.type === "image" || draft.type === "video" || extension === "pdf"
  const canRun = getRunStrategy(draft.name) !== "unsupported" || backendExtensions.has(extension)

  useEffect(() => {
    setDraft(file)
    setOutput("")
    setReactPreview(null)
    const ext = extensionOf(file.name)
    setMode(webExtensions.has(ext) || spreadsheetExtensions.has(ext) || file.type === "spreadsheet" || file.type === "image" || file.type === "video" || ext === "pdf" ? "preview" : codeExtensions.has(ext) || file.kind === "text" ? "code" : "preview")
  }, [file])

  useEffect(() => {
    if (!new Set(["jsx", "tsx"]).has(extension) || mode !== "preview") return
    let active = true
    const timer = window.setTimeout(async () => {
      const result = await bundleReact(draft.name, [{ name: draft.name, content: draft.content ?? "" }])
      if (active) setReactPreview(result.error ? `<!doctype html><body style="font-family:sans-serif;color:#b91c1c;padding:24px"><h3>Preview error</h3><pre>${result.error}</pre></body>` : reactDocument(result.code))
    }, 250)
    return () => { active = false; window.clearTimeout(timer) }
  }, [draft.content, draft.name, extension, mode])

  const prettyContent = useMemo(() => {
    if (extension !== "json" || !draft.content) return draft.content ?? ""
    try { return JSON.stringify(JSON.parse(draft.content), null, 2) } catch { return draft.content }
  }, [draft.content, extension])

  const save = async () => {
    setSaving(true)
    try {
      if (extension === "json" && draft.content) JSON.parse(draft.content)
      const response = await fetch(`/api/Projects/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: draft.name, content: draft.content ?? "" }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Save failed")
      const updated = { ...draft, ...(result.data ?? result) } as PreviewFile
      setDraft(updated)
      onUpdate?.(updated)
      toast.success("Saved to Finder")
    } catch (cause) {
      toast.error(cause instanceof SyntaxError ? "JSON is not valid" : cause instanceof Error ? cause.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const run = async () => {
    if (!isCode) return
    setRunning(true)
    setOutput(`Running ${draft.name}…`)
    try {
      if (extension === "jsx" || extension === "tsx" || extension === "html" || extension === "htm" || extension === "css") {
        setMode("preview")
        if (extension === "jsx" || extension === "tsx") {
          const result = await bundleReact(draft.name, [{ name: draft.name, content: draft.content ?? "" }])
          if (result.error) throw new Error(result.error)
          setReactPreview(reactDocument(result.code))
        }
        setOutput("Preview compiled successfully.")
      } else if (extension === "js") {
        const logs: string[] = []
        try {
          const consoleProxy = { log: (...args: unknown[]) => logs.push(args.map(String).join(" ")), warn: (...args: unknown[]) => logs.push(`Warning: ${args.map(String).join(" ")}`), error: (...args: unknown[]) => logs.push(`Error: ${args.map(String).join(" ")}`) }
          new Function("console", `"use strict";\n${draft.content ?? ""}`)(consoleProxy)
          setOutput(logs.join("\n") || "Program completed with no output.")
        } catch (error) { setOutput(error instanceof Error ? error.stack || error.message : String(error)) }
        setMode("output")
      } else {
        const result = await executeCode(draft.name, draft.content ?? "")
        setOutput([result.stdout, result.stderr, result.error].filter(Boolean).join("\n") || "Program completed with no output.")
        setMode("output")
      }
    } catch (cause) {
      setOutput(cause instanceof Error ? cause.message : "Execution failed")
      setMode("output")
    } finally {
      setRunning(false)
    }
  }

  const replaceImage = async (replacement: File) => {
    setReplacing(true)
    try {
      const form = new FormData()
      form.append("file", replacement)
      const response = await fetch(`/api/Projects/${draft.id}/replace`, { method: "POST", body: form })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Replacement failed")
      const updated = { ...draft, ...result.data } as PreviewFile
      setDraft(updated)
      onUpdate?.(updated)
      toast.success("Image replaced")
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Replacement failed")
    } finally {
      setReplacing(false)
    }
  }

  const preview = () => {
    if (draft.type === "image" && draft.src) return <div className="grid h-full place-items-center overflow-auto bg-[radial-gradient(circle,#36363a,#171719)] p-6"><img src={draft.src} alt={draft.name} className="max-h-full max-w-full rounded-lg object-contain shadow-2xl" /></div>
    if (draft.type === "video" && draft.src) return <div className="grid h-full place-items-center bg-black p-4"><video controls src={draft.src} className="max-h-full max-w-full rounded-lg" /></div>
    if (extension === "pdf" && (draft.src || draft.url)) return <PdfViewer pdfUrl={draft.src || draft.url || ""} />
    if (spreadsheetExtensions.has(extension) || draft.type === "spreadsheet") return <SpreadsheetQuickLook file={draft} />
    if (extension === "jsx" || extension === "tsx") return <iframe title={`${draft.name} preview`} srcDoc={reactPreview ?? "<p style='font-family:sans-serif;padding:24px'>Compiling preview…</p>"} sandbox="allow-scripts" className="h-full w-full border-0 bg-white" />
    if (["html", "htm", "css", "js"].includes(extension)) return <iframe title={`${draft.name} preview`} srcDoc={htmlDocument(draft.content ?? "", extension)} sandbox="allow-scripts allow-forms allow-modals" className="h-full w-full border-0 bg-white" />
    if (draft.type === "link" && draft.url && /^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/i.test(draft.url)) {
      const repositoryPath = draft.url.replace(/^https:\/\/github\.com\//i, "").replace(/\/$/, "")
      return <iframe title={`${draft.name} repository`} src={`https://github1s.com/${repositoryPath}`} className="h-full w-full border-0 bg-[#1e1e1e]" />
    }
    if (draft.type === "link" && draft.url) return <div className="grid h-full place-items-center"><a href={draft.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl bg-[#0a84ff] px-5 py-3 text-sm"><ExternalLink className="h-4 w-4" />Open link</a></div>
    if (draft.type === "archive") return <EmptyPreview icon={Archive} title="Archive" detail="Archive preview is not available." />
    if (draft.type === "video") return <EmptyPreview icon={Video} title="Video" detail="The media source is unavailable." />
    if (draft.type === "image") return <EmptyPreview icon={ImageIcon} title="Image" detail="Upload an image to preview it here." />
    return <EmptyPreview icon={FileQuestion} title={draft.name} detail={isCode ? "Choose Code to edit or Run to execute." : "Quick Look is not available for this file type."} />
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#1c1c1e] text-white">
      <input ref={replaceInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => { const replacement = event.target.files?.[0]; if (replacement) void replaceImage(replacement); event.target.value = "" }} />
      <header className="flex h-11 shrink-0 items-center gap-2 border-b border-white/10 bg-[#29292b] px-3">
        <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} className="min-w-24 flex-1 truncate bg-transparent text-[13px] font-semibold outline-none focus:rounded focus:border focus:border-[#0a84ff] focus:px-2" />
        <div className="flex overflow-hidden rounded-md border border-white/10 bg-black/15">
          {canPreview && <ModeButton active={mode === "preview"} onClick={() => setMode("preview")} icon={Eye} label="Preview" />}
          {isCode && <ModeButton active={mode === "code"} onClick={() => setMode("code")} icon={Code2} label="Code" />}
          {isCode && <ModeButton active={mode === "output"} onClick={() => setMode("output")} icon={Terminal} label="Output" />}
        </div>
        {draft.type === "image" && <button onClick={() => replaceInputRef.current?.click()} disabled={replacing} className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-white/70 hover:bg-white/10">{replacing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : draft.src ? <RefreshCw className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}{draft.src ? "Change" : "Upload"}</button>}
        {draft.src && <a href={draft.src} download={draft.name} title="Download" className="grid h-7 w-7 place-items-center rounded-md text-white/65 hover:bg-white/10"><Download className="h-4 w-4" /></a>}
        {isCode && <button onClick={() => onOpenInVSCode?.(draft)} className="flex h-7 items-center gap-1.5 rounded-md bg-[#333337] px-2 text-xs hover:bg-[#414146]"><Code2 className="h-3.5 w-3.5 text-[#23a8f2]" />VS Code</button>}
        {canRun && <button onClick={() => void run()} disabled={running} className="flex h-7 items-center gap-1.5 rounded-md bg-emerald-600 px-2 text-xs hover:bg-emerald-500 disabled:opacity-50">{running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}Run</button>}
        {isCode && <button onClick={() => void save()} disabled={saving} className="flex h-7 items-center gap-1.5 rounded-md bg-[#0a84ff] px-2 text-xs hover:bg-[#2795ff] disabled:opacity-50">{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}Save</button>}
      </header>
      <div className="min-h-0 flex-1 overflow-hidden">
        {mode === "preview" ? preview() : mode === "code" ? (
          <Editor
            height="100%"
            language={getLanguageFromExtension(draft.name)}
            value={extension === "json" ? prettyContent : draft.content ?? ""}
            onChange={(value) => setDraft((current) => ({ ...current, content: value ?? "" }))}
            theme="vs-dark"
            options={{ automaticLayout: true, minimap: { enabled: true }, fontSize: 13, fontFamily: "SFMono-Regular, Menlo, Monaco, Consolas, monospace", lineNumbers: "on", wordWrap: "on", formatOnPaste: true, formatOnType: true, tabSize: 2, scrollBeyondLastLine: false }}
          />
        ) : <pre className="h-full overflow-auto whitespace-pre-wrap bg-[#111113] p-5 font-mono text-[12px] leading-5 text-zinc-100">{output || "Run the file to see compiler and program output."}</pre>}
      </div>
      <footer className="flex h-6 shrink-0 items-center justify-between border-t border-white/10 bg-[#222224] px-3 text-[10px] text-white/35"><span className="flex items-center gap-2"><Check className="h-3 w-3 text-emerald-400" />Finder · {getLanguageFromExtension(draft.name)}</span><span>{draft.sizeBytes ? `${(draft.sizeBytes / 1024).toFixed(1)} KB` : ""}</span></footer>
    </div>
  )
}

function ModeButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return <button onClick={onClick} title={label} className={`flex h-7 items-center gap-1 border-r border-white/10 px-2 text-[11px] last:border-0 ${active ? "bg-white/15 text-white" : "text-white/55 hover:bg-white/[0.07]"}`}><Icon className="h-3.5 w-3.5" /><span className="hidden xl:inline">{label}</span></button>
}

function SpreadsheetQuickLook({ file }: { file: PreviewFile }) {
  const [sheets, setSheets] = useState<Record<string, unknown[][]>>({})
  const [active, setActive] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        let workbook: XLSX.WorkBook
        if (file.content && extensionOf(file.name) === "csv") {
          workbook = XLSX.read(file.content, { type: "string" })
        } else {
          const source = file.src || file.url
          if (!source) throw new Error("No spreadsheet data is available for preview.")
          const response = await fetch(source)
          if (!response.ok) throw new Error("The spreadsheet could not be downloaded for preview.")
          workbook = XLSX.read(await response.arrayBuffer(), { type: "array", cellDates: true })
        }
        const parsed = Object.fromEntries(workbook.SheetNames.map((name) => [name, XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[name], { header: 1, defval: "", raw: false })]))
        if (!cancelled) { setSheets(parsed); setActive(workbook.SheetNames[0] || "") }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Preview failed.")
      }
    }
    void load()
    return () => { cancelled = true }
  }, [file.content, file.name, file.src, file.url])

  if (error) return <EmptyPreview icon={Sheet} title="Spreadsheet preview unavailable" detail={error} />
  if (!active) return <div className="grid h-full place-items-center bg-[#f5f5f7] text-xs text-black/45"><Loader2 className="mb-2 h-5 w-5 animate-spin text-[#217346]" />Loading workbook…</div>
  const rows = sheets[active] || []
  const width = Math.max(1, ...rows.map((row) => row.length))
  return <div className="flex h-full min-h-0 flex-col bg-[#f5f5f7] text-[#1d1d1f]">
    <div className="min-h-0 flex-1 overflow-auto bg-white">
      <table className="min-w-full border-collapse text-[12px]">
        <thead className="sticky top-0 z-10 bg-[#f2f2f4] text-[#6e6e73]"><tr><th className="w-10 border border-[#d2d2d7] px-2 py-1.5" />{Array.from({ length: width }, (_, index) => <th key={index} className="min-w-24 border border-[#d2d2d7] px-2 py-1.5 font-medium">{XLSX.utils.encode_col(index)}</th>)}</tr></thead>
        <tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}><th className="sticky left-0 bg-[#f2f2f4] px-2 text-center font-normal text-[#6e6e73]">{rowIndex + 1}</th>{Array.from({ length: width }, (_, columnIndex) => <td key={columnIndex} className="max-w-72 truncate border border-[#e5e5e8] px-2 py-1.5" title={String(row[columnIndex] ?? "")}>{String(row[columnIndex] ?? "")}</td>)}</tr>)}</tbody>
      </table>
    </div>
    <div className="flex h-9 shrink-0 items-center gap-1 overflow-x-auto border-t border-black/10 px-2">{Object.keys(sheets).map((name) => <button key={name} onClick={() => setActive(name)} className={`h-8 border-b-2 px-4 text-xs ${active === name ? "border-[#217346] bg-white font-semibold text-[#185c37]" : "border-transparent text-black/50"}`}>{name}</button>)}</div>
  </div>
}

function EmptyPreview({ icon: Icon, title, detail }: { icon: React.ComponentType<{ className?: string }>; title: string; detail: string }) {
  return <div className="grid h-full place-items-center"><div className="text-center"><Icon className="mx-auto h-20 w-20 text-white/25" /><h3 className="mt-5 text-sm font-medium">{title}</h3><p className="mt-1 text-xs text-white/35">{detail}</p></div></div>
}
