"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
  type GridApi,
  type ValueFormatterParams,
} from "ag-grid-community"
import { AgGridReact } from "ag-grid-react"
import {
  BarChart3,
  Check,
  Clipboard,
  Code2,
  Download,
  FileJson,
  Filter,
  FolderClock,
  LayoutTemplate,
  Loader2,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Search,
  Send,
  Sparkles,
  Table2,
  Trash2,
  Upload,
} from "lucide-react"
import { toast } from "sonner"

ModuleRegistry.registerModules([AllCommunityModule])

type Density = "compact" | "normal" | "comfortable"
type ChatItem = { role: "user" | "assistant"; text: string }
type SafeColumnDef = Omit<ColDef, "valueFormatter" | "cellStyle"> & { valueFormatter?: string; cellStyle?: string }
interface TableConfig {
  title: string
  description: string
  columnDefs: SafeColumnDef[]
  rowData: Record<string, unknown>[]
  gridOptions: {
    pagination?: boolean
    paginationPageSize?: number
    rowSelection?: "singleRow" | "multiRow"
    selectAllByDefault?: boolean
    animateRows?: boolean
    enableCellTextSelection?: boolean
    pinnedTopRowData?: Record<string, unknown>[]
    groupByField?: string
  }
  theme: { accent: string; density: Density }
  message?: string
}

interface SavedTable {
  id: string
  savedAt: string
  config: TableConfig
  chat?: ChatItem[]
  sourceData?: string
}

const TABLE_HISTORY_KEY = "smarty:table-studio:history"

type Template = { name: string; icon: string; prompt: string; accent: string; description: string }
const TEMPLATES: Template[] = [
  { name: "Project tracker", icon: "◫", accent: "#0a84ff", description: "Owners, status, dates and progress", prompt: "Create a polished software project tracker with realistic tasks, owners, priorities, due dates, status and progress percentages." },
  { name: "Student gradebook", icon: "A+", accent: "#af52de", description: "Scores, averages and performance", prompt: "Create a student gradebook with realistic students, subject scores, attendance, average, grade and performance status." },
  { name: "Sales dashboard", icon: "$", accent: "#30d158", description: "Revenue, targets and regions", prompt: "Create a sales performance table by representative with region, revenue, target, attainment percentage, deals and trend." },
  { name: "Inventory", icon: "▦", accent: "#ff9f0a", description: "Stock, suppliers and reorder alerts", prompt: "Create an inventory management table with SKU, product, category, stock, reorder level, supplier, unit cost and stock status." },
  { name: "Employee directory", icon: "◎", accent: "#ff375f", description: "Teams, roles and contact details", prompt: "Create a modern employee directory with name, role, department, location, email, start date and employment status." },
  { name: "Content calendar", icon: "□", accent: "#64d2ff", description: "Channels, dates and workflow", prompt: "Create a content calendar with campaign, channel, owner, publish date, audience, status and engagement goal." },
]

const starterConfig: TableConfig = {
  title: "Untitled table",
  description: "Choose a template, paste data, or describe anything you want to track.",
  columnDefs: [
    { field: "name", headerName: "Name", flex: 1, minWidth: 180 },
    { field: "category", headerName: "Category", flex: 1 },
    { field: "status", headerName: "Status", flex: 1, cellStyle: "status" },
  ],
  rowData: [],
  gridOptions: { pagination: true, paginationPageSize: 20, rowSelection: "multiRow", animateRows: true },
  theme: { accent: "#0a84ff", density: "normal" },
}

function displayFormatter(kind: string | undefined) {
  return ({ value }: ValueFormatterParams) => {
    if (value == null || value === "") return "—"
    if (kind === "currency") return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(Number(value))
    if (kind === "percent") return `${Number(value)}%`
    if (kind === "number") return new Intl.NumberFormat("en-US").format(Number(value))
    if (kind === "date") {
      const date = new Date(String(value))
      return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date)
    }
    return String(value)
  }
}

function statusCellStyle(value: unknown) {
  const text = String(value ?? "").toLowerCase()
  if (/done|active|paid|complete|healthy|available|approved|ahead/.test(text)) return { color: "#147d3f", fontWeight: "600" }
  if (/blocked|late|failed|overdue|critical|out of stock|rejected/.test(text)) return { color: "#d92d20", fontWeight: "600" }
  if (/pending|progress|review|warning|low stock|at risk/.test(text)) return { color: "#b25e09", fontWeight: "600" }
  return undefined
}

function makeColumnDefs(config: TableConfig): ColDef[] {
  return config.columnDefs.map((column) => {
    const { valueFormatter, cellStyle, checkboxSelection: _checkboxSelection, ...safe } = column
    return {
      ...safe,
      valueFormatter: valueFormatter ? displayFormatter(valueFormatter) : undefined,
      cellStyle: cellStyle === "status" ? (params) => statusCellStyle(params.value) : cellStyle === "positive-negative" ? (params) => ({ color: Number(params.value) < 0 ? "#d92d20" : "#147d3f", fontWeight: "600" }) : undefined,
    }
  })
}

function normalizeConfig(value: unknown): TableConfig {
  const input = (value && typeof value === "object" ? value : {}) as Partial<TableConfig>
  return {
    title: typeof input.title === "string" ? input.title : "Generated table",
    description: typeof input.description === "string" ? input.description : "AI-generated data table",
    columnDefs: Array.isArray(input.columnDefs) ? input.columnDefs.filter((column) => column && typeof column.field === "string").slice(0, 80).map((column) => {
      const { checkboxSelection: _checkboxSelection, headerCheckboxSelection: _headerCheckboxSelection, ...safeColumn } = column as SafeColumnDef & { headerCheckboxSelection?: boolean }
      return safeColumn
    }) : [],
    rowData: Array.isArray(input.rowData) ? input.rowData.filter((row) => row && typeof row === "object") : [],
    gridOptions: input.gridOptions && typeof input.gridOptions === "object" ? input.gridOptions : {},
    theme: {
      accent: input.theme?.accent?.match(/^#[0-9a-f]{6}$/i) ? input.theme.accent : "#0a84ff",
      density: ["compact", "normal", "comfortable"].includes(input.theme?.density ?? "") ? input.theme!.density : "normal",
    },
    message: typeof input.message === "string" ? input.message : undefined,
  }
}

export function DynamicAgGridConfigurator() {
  const [config, setConfig] = useState<TableConfig>(starterConfig)
  const [sourceData, setSourceData] = useState("")
  const [prompt, setPrompt] = useState("")
  const [quickFilter, setQuickFilter] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [remaining, setRemaining] = useState<number | null | undefined>(undefined)
  const [leftMode, setLeftMode] = useState<"ai" | "data" | "templates" | "history">("ai")
  const [rightMode, setRightMode] = useState<"preview" | "json" | "design">("preview")
  const [chat, setChat] = useState<ChatItem[]>([{ role: "assistant", text: "Describe a table and I’ll generate the data, columns, filters, formatting, and controls. You can then ask for changes in real time." }])
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<SavedTable[]>([])
  const [sidebarWidth, setSidebarWidth] = useState(310)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isTableCollapsed, setIsTableCollapsed] = useState(false)
  const gridApi = useRef<GridApi | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(TABLE_HISTORY_KEY) || "[]")
      if (Array.isArray(saved)) setHistory(saved.slice(0, 50))
    } catch {
      localStorage.removeItem(TABLE_HISTORY_KEY)
    }
  }, [])

  useEffect(() => {
    const api = gridApi.current
    if (!api || !config.rowData.length) return
    if (config.gridOptions.selectAllByDefault) api.selectAll()
    else api.deselectAll()
  }, [config.gridOptions.selectAllByDefault, config.rowData])

  const saveVersion = useCallback((nextConfig: TableConfig, nextChat: ChatItem[], nextSourceData: string) => {
    setHistory((items) => {
      const next = [{ id: crypto.randomUUID(), savedAt: new Date().toISOString(), config: nextConfig, chat: nextChat, sourceData: nextSourceData }, ...items].slice(0, 50)
      localStorage.setItem(TABLE_HISTORY_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const startSidebarResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isSidebarCollapsed || isTableCollapsed) return
    event.preventDefault()
    const startX = event.clientX
    const startWidth = sidebarWidth
    const move = (pointerEvent: PointerEvent) => setSidebarWidth(Math.min(520, Math.max(250, startWidth + pointerEvent.clientX - startX)))
    const stop = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", stop)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", stop)
  }

  const columns = useMemo(() => makeColumnDefs(config), [config])
  const density = config.theme.density
  const tableTheme = useMemo(() => themeQuartz.withParams({
    accentColor: config.theme.accent,
    backgroundColor: "#ffffff",
    borderColor: "#e5e5ea",
    browserColorScheme: "light",
    foregroundColor: "#1d1d1f",
    headerBackgroundColor: "#f7f7f9",
    headerFontSize: 12,
    headerFontWeight: 600,
    oddRowBackgroundColor: "#fafafa",
    rowHoverColor: `${config.theme.accent}0d`,
    selectedRowBackgroundColor: `${config.theme.accent}18`,
    spacing: density === "compact" ? 5 : density === "comfortable" ? 9 : 7,
  }), [config.theme.accent, density])

  const generate = useCallback(async (request: string) => {
    const cleanPrompt = request.trim()
    if (!cleanPrompt || isLoading) return
    const userItem: ChatItem = { role: "user", text: cleanPrompt }
    setIsLoading(true)
    setPrompt("")
    setChat((items) => [...items, userItem])
    try {
      const response = await fetch("/api/streamTable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: cleanPrompt, data: sourceData, current: config.rowData.length ? config : null }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Table AI could not complete the request.")
      const next = normalizeConfig(result.config)
      const assistantItem: ChatItem = { role: "assistant", text: next.message || `Updated ${next.title} with ${next.rowData.length} rows.` }
      const nextChat = [...chat, userItem, assistantItem]
      setConfig(next)
      saveVersion(next, nextChat, sourceData)
      setRemaining(result.remaining)
      setRightMode("preview")
      setChat(nextChat)
      toast.success("Table updated live")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Table generation failed."
      setChat((items) => [...items, { role: "assistant", text: message }])
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [chat, config, isLoading, saveVersion, sourceData])

  const deleteVersion = (id: string) => {
    setHistory((items) => {
      const next = items.filter((item) => item.id !== id)
      localStorage.setItem(TABLE_HISTORY_KEY, JSON.stringify(next))
      return next
    })
  }

  const loadTemplate = (template: Template) => {
    setConfig((current) => ({ ...current, theme: { ...current.theme, accent: template.accent } }))
    setLeftMode("ai")
    void generate(template.prompt)
  }

  const importData = async (file: File) => {
    const text = await file.text()
    setSourceData(text)
    setLeftMode("data")
    toast.success(`${file.name} ready to use`)
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${config.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "table"}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const copyJson = async () => {
    await navigator.clipboard.writeText(JSON.stringify(config, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex h-full min-h-[560px] w-full flex-col overflow-hidden bg-[#ececef] font-sans text-[#1d1d1f]">
      <input ref={fileInput} type="file" accept=".json,.csv,.txt" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importData(file); event.target.value = "" }} />
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-black/10 bg-white/85 px-4 backdrop-blur-2xl">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[#0a84ff] to-[#5856d6] text-white shadow-sm"><Table2 className="h-4 w-4" /></span>
        <div className="min-w-0"><div className="truncate text-[13px] font-semibold">Table Studio</div><div className="text-[9px] text-black/40">AI data workspace</div></div>
        <div className="flex items-center gap-1 border-l border-black/10 pl-2">
          <button onClick={() => { setIsSidebarCollapsed((value) => !value); if (isTableCollapsed) setIsTableCollapsed(false) }} title={isSidebarCollapsed ? "Show chat" : "Collapse chat"} className="grid h-7 w-7 place-items-center rounded-md text-black/45 hover:bg-black/[0.06] hover:text-black/70">{isSidebarCollapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}</button>
          <button onClick={() => { setIsTableCollapsed((value) => !value); if (isSidebarCollapsed) setIsSidebarCollapsed(false) }} title={isTableCollapsed ? "Show table" : "Collapse table"} className="grid h-7 w-7 place-items-center rounded-md text-black/45 hover:bg-black/[0.06] hover:text-black/70">{isTableCollapsed ? <PanelRightOpen className="h-3.5 w-3.5" /> : <PanelRightClose className="h-3.5 w-3.5" />}</button>
        </div>
        <div className="mx-auto hidden items-center rounded-lg bg-black/[0.055] p-0.5 md:flex">
          {(["preview", "json", "design"] as const).map((mode) => <button key={mode} onClick={() => setRightMode(mode)} className={`flex h-7 items-center gap-1.5 rounded-md px-3 text-[11px] font-medium capitalize ${rightMode === mode ? "bg-white shadow-sm" : "text-black/45 hover:text-black/70"}`}>{mode === "preview" ? <Table2 className="h-3.5 w-3.5" /> : mode === "json" ? <Code2 className="h-3.5 w-3.5" /> : <Palette className="h-3.5 w-3.5" />}{mode}</button>)}
        </div>
        <span className="hidden rounded-full bg-[#34c759]/10 px-2.5 py-1 text-[10px] font-semibold text-[#248a3d] sm:inline">{remaining === null ? "Unlimited" : remaining === undefined ? "Free · 50 tables/month" : `${remaining} tables left`}</span>
        <button onClick={() => gridApi.current?.exportDataAsCsv({ fileName: `${config.title}.csv` })} className="mac-action"><Download className="h-3.5 w-3.5" />CSV</button>
        <button onClick={exportJson} className="mac-action"><FileJson className="h-3.5 w-3.5" />JSON</button>
      </header>

      <div className="flex min-h-0 flex-1 gap-px bg-black/10">
        <aside className="flex w-[310px] shrink-0 flex-col bg-[#f7f7f9]">
          <div className="grid grid-cols-4 gap-1 border-b border-black/[0.07] p-2">
            <button onClick={() => setLeftMode("ai")} className={`studio-tab ${leftMode === "ai" ? "studio-tab-active" : ""}`}><Sparkles className="h-3.5 w-3.5" />AI</button>
            <button onClick={() => setLeftMode("data")} className={`studio-tab ${leftMode === "data" ? "studio-tab-active" : ""}`}><FileJson className="h-3.5 w-3.5" />Data</button>
            <button onClick={() => setLeftMode("templates")} className={`studio-tab ${leftMode === "templates" ? "studio-tab-active" : ""}`}><LayoutTemplate className="h-3.5 w-3.5" />Templates</button>
            <button onClick={() => setLeftMode("history")} className={`studio-tab ${leftMode === "history" ? "studio-tab-active" : ""}`}><FolderClock className="h-3.5 w-3.5" />Files</button>
          </div>

          {leftMode === "ai" && <>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
              {chat.map((item, index) => <div key={index} className={`rounded-2xl px-3 py-2.5 text-[11px] leading-[17px] ${item.role === "user" ? "ml-7 bg-[#0a84ff] text-white" : "mr-4 border border-black/[0.06] bg-white text-black/65 shadow-sm"}`}>{item.text}</div>)}
              {isLoading && <div className="flex items-center gap-2 px-2 text-[11px] text-black/45"><Loader2 className="h-4 w-4 animate-spin text-[#0a84ff]" />Designing your table…</div>}
            </div>
            <div className="border-t border-black/[0.08] bg-white/80 p-3">
              <div className="rounded-2xl border border-black/10 bg-white p-2 shadow-sm focus-within:border-[#0a84ff]/50 focus-within:ring-2 focus-within:ring-[#0a84ff]/10">
                <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void generate(prompt) } }} rows={3} placeholder={config.rowData.length ? "Ask for any change…" : "Describe any table. Data is optional…"} className="w-full resize-none bg-transparent px-1 text-xs leading-5 outline-none placeholder:text-black/30" disabled={isLoading} />
                <div className="flex items-center justify-between"><span className="text-[9px] text-black/30">↵ Apply live · ⇧↵ New line</span><button onClick={() => void generate(prompt)} disabled={!prompt.trim() || isLoading} className="grid h-8 w-8 place-items-center rounded-full bg-[#0a84ff] text-white shadow-sm disabled:opacity-30"><Send className="h-3.5 w-3.5" /></button></div>
              </div>
            </div>
          </>}

          {leftMode === "data" && <div className="flex flex-1 flex-col gap-3 p-3">
            <div><div className="text-xs font-semibold">Source data</div><p className="mt-1 text-[10px] leading-4 text-black/45">Paste JSON or CSV. Leave it empty and AI will create realistic data from your request.</p></div>
            <textarea value={sourceData} onChange={(event) => setSourceData(event.target.value)} placeholder={'[{"name":"Ada","score":98}]\n\nor paste CSV rows'} className="min-h-0 flex-1 resize-none rounded-xl border border-black/10 bg-white p-3 font-mono text-[10px] leading-4 outline-none focus:border-[#0a84ff]/50" />
            <button onClick={() => fileInput.current?.click()} className="flex h-9 items-center justify-center gap-2 rounded-lg border border-black/10 bg-white text-[11px] font-medium shadow-sm hover:bg-black/[0.03]"><Upload className="h-3.5 w-3.5" />Import JSON or CSV</button>
            <button onClick={() => { setLeftMode("ai"); setPrompt(config.rowData.length ? "Replace this table using the source data I provided." : "Build the best professional table for this source data.") }} disabled={!sourceData.trim()} className="h-9 rounded-lg bg-[#0a84ff] text-[11px] font-semibold text-white disabled:opacity-30">Use this data</button>
          </div>}

          {leftMode === "templates" && <div className="min-h-0 flex-1 overflow-y-auto p-3"><div className="mb-3"><div className="text-xs font-semibold">Start with a template</div><p className="mt-1 text-[10px] text-black/40">Every template remains fully editable with AI.</p></div><div className="grid gap-2">{TEMPLATES.map((template) => <button key={template.name} onClick={() => loadTemplate(template)} disabled={isLoading} className="group flex items-center gap-3 rounded-xl border border-black/[0.07] bg-white p-3 text-left shadow-sm transition hover:-translate-y-px hover:border-black/15 hover:shadow-md disabled:opacity-40"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xs font-bold text-white" style={{ background: template.accent }}>{template.icon}</span><span className="min-w-0"><span className="block text-[11px] font-semibold">{template.name}</span><span className="mt-0.5 block truncate text-[9px] text-black/40">{template.description}</span></span><Plus className="ml-auto h-3.5 w-3.5 text-black/20 group-hover:text-black/50" /></button>)}</div></div>}

          {leftMode === "history" && <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <div className="mb-3"><div className="text-xs font-semibold">Saved table history</div><p className="mt-1 text-[10px] leading-4 text-black/40">Every AI change is saved automatically on this device. Open any earlier version.</p></div>
            {history.length ? <div className="grid gap-2">{history.map((item) => <div key={item.id} className="group flex items-center gap-2 rounded-xl border border-black/[0.07] bg-white p-2.5 shadow-sm">
              <button onClick={() => { setConfig(normalizeConfig(item.config)); setChat(item.chat?.length ? item.chat : [{ role: "assistant", text: `Opened ${item.config.title}. Ask for any change to continue working.` }]); setSourceData(item.sourceData ?? ""); setLeftMode("ai"); setRightMode("preview"); setIsSidebarCollapsed(false); setIsTableCollapsed(false); toast.success("Table and chat restored") }} className="min-w-0 flex-1 text-left"><span className="block truncate text-[11px] font-semibold">{item.config.title}</span><span className="mt-0.5 block text-[9px] text-black/40">{new Date(item.savedAt).toLocaleString()} · {item.config.rowData.length} rows</span></button>
              <button onClick={() => deleteVersion(item.id)} title="Delete saved version" className="grid h-7 w-7 place-items-center rounded-md text-black/25 opacity-0 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>)}</div> : <div className="rounded-xl border border-dashed border-black/10 bg-white/50 p-5 text-center"><FolderClock className="mx-auto h-6 w-6 text-black/20" /><p className="mt-2 text-[10px] text-black/40">Generated tables and edits will appear here.</p></div>}
          </div>}
        </aside>

        <main className="flex min-w-0 flex-1 flex-col bg-white">
          <div className="flex h-[58px] shrink-0 items-center gap-3 border-b border-black/[0.07] px-4">
            <div className="min-w-0"><h2 className="truncate text-base font-semibold tracking-[-0.01em]">{config.title}</h2><p className="truncate text-[10px] text-black/40">{config.description}</p></div>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative"><Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black/30" /><input value={quickFilter} onChange={(event) => setQuickFilter(event.target.value)} placeholder="Search rows" className="h-8 w-40 rounded-lg border border-black/10 bg-[#f5f5f7] pl-8 pr-2 text-[11px] outline-none focus:border-[#0a84ff]/40" /></div>
              <span className="flex h-8 items-center gap-1.5 rounded-lg border border-black/[0.07] px-2.5 text-[10px] text-black/45"><BarChart3 className="h-3.5 w-3.5" />{config.rowData.length} rows</span>
              <span className="flex h-8 items-center gap-1.5 rounded-lg border border-black/[0.07] px-2.5 text-[10px] text-black/45"><Filter className="h-3.5 w-3.5" />{config.columnDefs.length} columns</span>
            </div>
          </div>

          <div className="min-h-0 flex-1">
            {rightMode === "preview" && <div className="h-full w-full p-3"><div className="h-full overflow-hidden rounded-xl border border-black/10 shadow-sm">{config.rowData.length ? <AgGridReact theme={tableTheme} columnDefs={columns} rowData={config.rowData} defaultColDef={{ sortable: true, filter: true, resizable: true, editable: true, minWidth: 100 }} pagination={config.gridOptions.pagination ?? true} paginationPageSize={config.gridOptions.paginationPageSize ?? 20} paginationPageSizeSelector={[10, 20, 50, 100]} rowSelection={{ mode: config.gridOptions.rowSelection ?? "multiRow", checkboxes: true, headerCheckbox: true }} animateRows={config.gridOptions.animateRows ?? true} enableCellTextSelection={config.gridOptions.enableCellTextSelection ?? true} pinnedTopRowData={config.gridOptions.pinnedTopRowData} quickFilterText={quickFilter} onGridReady={(event) => { gridApi.current = event.api; event.api.sizeColumnsToFit() }} onGridSizeChanged={(event) => event.api.sizeColumnsToFit()} /> : <div className="grid h-full place-items-center bg-[#fafafa]"><div className="max-w-sm text-center"><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[#0a84ff]/10 to-[#af52de]/10 text-[#0a84ff]"><Table2 className="h-7 w-7" /></span><h3 className="mt-4 text-sm font-semibold">Your table will appear here</h3><p className="mt-1 text-[11px] leading-5 text-black/40">Pick a template or tell AI what you need. Source data is completely optional.</p><button onClick={() => setLeftMode("templates")} className="mt-4 rounded-lg bg-[#0a84ff] px-4 py-2 text-[11px] font-semibold text-white">Browse templates</button></div></div>}</div></div>}

            {rightMode === "json" && <div className="flex h-full flex-col bg-[#1e1e20] text-white"><div className="flex h-10 items-center border-b border-white/10 px-4"><span className="text-[10px] font-medium text-white/50">table.config.json</span><button onClick={() => void copyJson()} className="ml-auto flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-1 text-[10px] hover:bg-white/15">{copied ? <Check className="h-3 w-3" /> : <Clipboard className="h-3 w-3" />}{copied ? "Copied" : "Copy"}</button></div><pre className="min-h-0 flex-1 overflow-auto p-5 text-[11px] leading-5 text-[#d7d7dc]">{JSON.stringify(config, null, 2)}</pre></div>}

            {rightMode === "design" && <div className="h-full overflow-y-auto bg-[#f7f7f9] p-6"><div className="mx-auto max-w-xl space-y-5"><div><h3 className="text-sm font-semibold">Appearance</h3><p className="mt-1 text-[10px] text-black/40">Tune the table visually. Changes update the preview immediately.</p></div><section className="rounded-2xl border border-black/[0.07] bg-white p-4 shadow-sm"><label className="text-[11px] font-semibold">Accent color</label><div className="mt-3 flex items-center gap-2">{["#0a84ff", "#5856d6", "#af52de", "#ff375f", "#ff9f0a", "#30d158"].map((color) => <button key={color} onClick={() => setConfig((current) => ({ ...current, theme: { ...current.theme, accent: color } }))} className="grid h-8 w-8 place-items-center rounded-full ring-offset-2" style={{ background: color, boxShadow: config.theme.accent === color ? `0 0 0 2px white, 0 0 0 4px ${color}` : undefined }}>{config.theme.accent === color && <Check className="h-4 w-4 text-white" />}</button>)}<input type="color" value={config.theme.accent} onChange={(event) => setConfig((current) => ({ ...current, theme: { ...current.theme, accent: event.target.value } }))} className="ml-2 h-8 w-10 cursor-pointer rounded border-0 bg-transparent" /></div></section><section className="rounded-2xl border border-black/[0.07] bg-white p-4 shadow-sm"><label className="text-[11px] font-semibold">Row density</label><div className="mt-3 grid grid-cols-3 gap-2">{(["compact", "normal", "comfortable"] as Density[]).map((item) => <button key={item} onClick={() => setConfig((current) => ({ ...current, theme: { ...current.theme, density: item } }))} className={`h-9 rounded-lg border text-[10px] font-medium capitalize ${density === item ? "border-transparent text-white" : "border-black/10 bg-[#f7f7f9] text-black/55"}`} style={density === item ? { background: config.theme.accent } : undefined}>{item}</button>)}</div></section><button onClick={() => setRightMode("preview")} className="h-10 w-full rounded-xl bg-[#1d1d1f] text-[11px] font-semibold text-white">Done</button></div></div>}
          </div>
        </main>
      </div>
      <style jsx global>{`
        .mac-action { display:flex; height:30px; align-items:center; gap:5px; border-radius:7px; border:1px solid rgba(0,0,0,.08); background:white; padding:0 9px; font-size:10px; font-weight:600; box-shadow:0 1px 2px rgba(0,0,0,.04); }
        .mac-action:hover { background:#f5f5f7; }
        .studio-tab { display:flex; height:30px; align-items:center; justify-content:center; gap:5px; border-radius:7px; font-size:10px; font-weight:600; color:rgba(0,0,0,.42); }
        .studio-tab:hover { color:rgba(0,0,0,.7); }
        .studio-tab-active { background:white; color:#1d1d1f; box-shadow:0 1px 3px rgba(0,0,0,.09); }
      `}</style>
    </div>
  )
}
