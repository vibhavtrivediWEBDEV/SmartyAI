"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { Download, FilePlus2, Loader2, Plus, Redo2, Send, Sparkles, Table2, Undo2, Upload } from "lucide-react"
import { Spreadsheet, type CellBase } from "react-spreadsheet"
import { toast } from "sonner"
import * as XLSX from "xlsx"

import { applySpreadsheetActions, rectangularize, type SheetMatrix, type SpreadsheetAction } from "@/lib/spreadsheet/actions"

type WorkbookState = Record<string, SheetMatrix>
type ChatItem = { role: "user" | "assistant"; text: string }

const blankSheet = (): SheetMatrix => Array.from({ length: 20 }, () => Array.from({ length: 10 }, () => ""))
const AI_SUGGESTIONS = [
  "Create a professional monthly budget with formulas and totals",
  "Clean this data, remove duplicates, and standardize values",
  "Analyze this sheet and add a summary with key insights",
  "Add formulas for totals, averages, growth, and percentages",
]
const toSpreadsheetData = (matrix: SheetMatrix): CellBase<string>[][] => rectangularize(matrix).map((row) => row.map((value) => ({ value: value == null ? "" : String(value) })))
const fromSpreadsheetData = (data: Array<Array<CellBase<string> | undefined>>): SheetMatrix => data.map((row) => row.map((cell) => cell?.value ?? ""))

function worksheetToMatrix(worksheet: XLSX.WorkSheet): SheetMatrix {
  if (!worksheet["!ref"]) return blankSheet()
  const range = XLSX.utils.decode_range(worksheet["!ref"])
  const data: SheetMatrix = []
  for (let row = range.s.r; row <= range.e.r; row += 1) {
    const values = []
    for (let column = range.s.c; column <= range.e.c; column += 1) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: column })]
      values.push(cell?.f ? `=${cell.f}` : cell?.v ?? "")
    }
    data.push(values)
  }
  return rectangularize(data)
}

function matrixToWorksheet(matrix: SheetMatrix) {
  const worksheet = XLSX.utils.aoa_to_sheet(matrix)
  matrix.forEach((row, rowIndex) => row.forEach((value, columnIndex) => {
    if (typeof value !== "string" || !value.startsWith("=")) return
    const address = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex })
    worksheet[address] = { t: "n", f: value.slice(1) }
  }))
  return worksheet
}

export function ExcelEditor() {
  const [workbook, setWorkbook] = useState<WorkbookState>({ Sheet1: blankSheet() })
  const [activeSheet, setActiveSheet] = useState("Sheet1")
  const [fileName, setFileName] = useState("Untitled.xlsx")
  const [prompt, setPrompt] = useState("")
  const [isRunning, setIsRunning] = useState(false)
  const [remaining, setRemaining] = useState<number | null | undefined>(undefined)
  const [chat, setChat] = useState<ChatItem[]>([{ role: "assistant", text: "Import a workbook or describe the spreadsheet you want to create." }])
  const [undoStack, setUndoStack] = useState<WorkbookState[]>([])
  const [redoStack, setRedoStack] = useState<WorkbookState[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const activeMatrix = workbook[activeSheet] ?? blankSheet()
  const spreadsheetData = useMemo(() => toSpreadsheetData(activeMatrix), [activeMatrix])

  const commitWorkbook = useCallback((next: WorkbookState) => {
    setUndoStack((items) => [...items.slice(-29), workbook])
    setRedoStack([])
    setWorkbook(next)
  }, [workbook])

  const updateActiveSheet = useCallback((next: SheetMatrix) => {
    commitWorkbook({ ...workbook, [activeSheet]: rectangularize(next) })
  }, [activeSheet, commitWorkbook, workbook])

  const undo = () => {
    const previous = undoStack[undoStack.length - 1]
    if (!previous) return
    setRedoStack((items) => [...items, workbook])
    setUndoStack((items) => items.slice(0, -1))
    setWorkbook(previous)
    if (!previous[activeSheet]) setActiveSheet(Object.keys(previous)[0])
  }

  const redo = () => {
    const next = redoStack[redoStack.length - 1]
    if (!next) return
    setUndoStack((items) => [...items, workbook])
    setRedoStack((items) => items.slice(0, -1))
    setWorkbook(next)
    if (!next[activeSheet]) setActiveSheet(Object.keys(next)[0])
  }

  const importFile = useCallback(async (file: File) => {
    try {
      const bytes = await file.arrayBuffer()
      const parsed = XLSX.read(bytes, { type: "array", cellDates: true })
      const sheets = Object.fromEntries(parsed.SheetNames.map((name) => [name, worksheetToMatrix(parsed.Sheets[name])]))
      if (!parsed.SheetNames.length) throw new Error("This workbook has no visible sheets.")
      commitWorkbook(sheets)
      setActiveSheet(parsed.SheetNames[0])
      setFileName(file.name)
      setChat((items) => [...items, { role: "assistant", text: `${file.name} opened with ${parsed.SheetNames.length} sheet${parsed.SheetNames.length === 1 ? "" : "s"}.` }])
      toast.success("Spreadsheet opened")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The spreadsheet could not be opened.")
    }
  }, [commitWorkbook])

  const exportWorkbook = useCallback((format: "xlsx" | "csv") => {
    if (format === "csv") {
      const csv = XLSX.utils.sheet_to_csv(matrixToWorksheet(activeMatrix))
      const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }))
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = fileName.replace(/\.[^.]+$/, "") + ".csv"
      anchor.click()
      URL.revokeObjectURL(url)
      return
    }
    const output = XLSX.utils.book_new()
    Object.entries(workbook).forEach(([name, matrix]) => XLSX.utils.book_append_sheet(output, matrixToWorksheet(matrix), name.slice(0, 31)))
    XLSX.writeFile(output, fileName.replace(/\.[^.]+$/, "") + ".xlsx", { compression: true })
  }, [activeMatrix, fileName, workbook])

  const runPrompt = async () => {
    const userPrompt = prompt.trim()
    if (!userPrompt || isRunning) return
    setPrompt("")
    setIsRunning(true)
    setChat((items) => [...items, { role: "user", text: userPrompt }])
    try {
      const response = await fetch("/api/streamExcel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userPrompt, activeSheet, spreadsheet: activeMatrix }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Excel AI could not complete the request.")
      const actions = Array.isArray(result.actions) ? result.actions as SpreadsheetAction[] : []
      if (actions.length) updateActiveSheet(applySpreadsheetActions(activeMatrix, actions))
      setRemaining(result.remaining)
      setChat((items) => [...items, { role: "assistant", text: result.response || (actions.length ? "Changes applied." : "Done.") }])
      if (actions.length) toast.success("Changes applied live")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Excel AI failed."
      setChat((items) => [...items, { role: "assistant", text: message }])
      toast.error(message)
    } finally {
      setIsRunning(false)
    }
  }

  const addSheet = () => {
    let index = Object.keys(workbook).length + 1
    while (workbook[`Sheet${index}`]) index += 1
    const name = `Sheet${index}`
    commitWorkbook({ ...workbook, [name]: blankSheet() })
    setActiveSheet(name)
  }

  return (
    <div className="flex h-full min-h-[480px] w-full flex-col overflow-hidden bg-[#f5f5f7] font-sans text-[#1d1d1f]">
      <input ref={inputRef} type="file" className="hidden" accept=".xlsx,.xls,.xlsm,.xlsb,.csv,.tsv,.ods,.fods,.numbers" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importFile(file); event.target.value = "" }} />
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-black/10 bg-white/80 px-3 backdrop-blur-xl">
        <Table2 className="h-5 w-5 text-[#217346]" />
        <input value={fileName} onChange={(event) => setFileName(event.target.value)} className="min-w-0 flex-1 bg-transparent text-center text-[13px] font-semibold outline-none" aria-label="Workbook name" />
        <button onClick={undo} disabled={!undoStack.length} title="Undo" className="toolbar-button px-2 disabled:opacity-30"><Undo2 className="h-4 w-4" /></button>
        <button onClick={redo} disabled={!redoStack.length} title="Redo" className="toolbar-button px-2 disabled:opacity-30"><Redo2 className="h-4 w-4" /></button>
        <button onClick={() => inputRef.current?.click()} className="toolbar-button"><Upload className="h-4 w-4" />Open</button>
        <button onClick={() => exportWorkbook("csv")} className="toolbar-button">CSV</button>
        <button onClick={() => exportWorkbook("xlsx")} className="toolbar-button bg-[#217346] text-white hover:bg-[#185c37]"><Download className="h-4 w-4" />Export</button>
      </header>

      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-[1.7] flex-col border-r border-black/10 bg-white">
          <div className="flex h-10 shrink-0 items-center gap-2 border-b border-black/10 bg-[#fafafa] px-3 text-xs text-black/55">
            <span className="rounded bg-[#217346]/10 px-2 py-1 font-semibold text-[#217346]">fx</span>
            <span>Click any cell to edit · formulas start with =</span>
          </div>
          <div className="min-h-0 flex-1 overflow-auto spreadsheet-canvas">
            <Spreadsheet data={spreadsheetData} onChange={(data) => updateActiveSheet(fromSpreadsheetData(data))} />
          </div>
          <div className="flex h-9 shrink-0 items-center gap-1 overflow-x-auto border-t border-black/10 bg-[#f5f5f7] px-2">
            <button onClick={addSheet} title="Add sheet" className="grid h-7 w-7 place-items-center rounded hover:bg-black/5"><Plus className="h-4 w-4" /></button>
            {Object.keys(workbook).map((name) => <button key={name} onClick={() => setActiveSheet(name)} className={`h-8 border-b-2 px-4 text-xs font-medium ${activeSheet === name ? "border-[#217346] bg-white text-[#185c37]" : "border-transparent text-black/55 hover:bg-white/60"}`}>{name}</button>)}
          </div>
        </main>

        <aside className="flex min-w-[280px] flex-1 flex-col bg-[#f7f7f9]">
          <div className="border-b border-black/10 bg-white/70 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold"><span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[#34c759] to-[#0a84ff] text-white"><Sparkles className="h-4 w-4" /></span>Smarty Excel AI</div>
            <p className="mt-2 text-[11px] leading-4 text-black/45">Create, calculate, clean, sort, and transform the active sheet. Changes appear instantly.</p>
            <div className="mt-2 text-[10px] font-medium text-[#217346]">{remaining === null ? "Unlimited AI operations" : remaining === undefined ? "Free plan: 10 AI operations/month" : `${remaining} free AI operations remaining`}</div>
            <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
              {AI_SUGGESTIONS.map((suggestion, index) => <button key={suggestion} onClick={() => setPrompt(suggestion)} title={suggestion} className="shrink-0 rounded-full border border-[#217346]/15 bg-[#217346]/[0.07] px-2.5 py-1 text-[10px] font-medium text-[#185c37] hover:bg-[#217346]/15">{["Create", "Clean", "Analyze", "Formulas"][index]}</button>)}
            </div>
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            {chat.map((item, index) => <div key={index} className={`max-w-[92%] rounded-2xl px-3 py-2 text-xs leading-5 shadow-sm ${item.role === "user" ? "ml-auto bg-[#0a84ff] text-white" : "border border-black/[0.06] bg-white text-black/70"}`}>{item.text}</div>)}
            {isRunning && <div className="flex items-center gap-2 text-xs text-black/45"><Loader2 className="h-4 w-4 animate-spin text-[#217346]" />Building your spreadsheet…</div>}
          </div>
          <div className="border-t border-black/10 bg-white/80 p-3">
            <div className="flex items-end gap-2 rounded-2xl border border-black/10 bg-white p-2 shadow-sm focus-within:border-[#0a84ff]/50 focus-within:ring-2 focus-within:ring-[#0a84ff]/10">
              <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void runPrompt() } }} rows={2} disabled={isRunning} placeholder="Create a monthly budget with totals…" className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-1 text-xs leading-5 outline-none placeholder:text-black/30" />
              <button onClick={() => void runPrompt()} disabled={!prompt.trim() || isRunning} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#0a84ff] text-white disabled:opacity-35"><Send className="h-4 w-4" /></button>
            </div>
            <button onClick={() => { commitWorkbook({ Sheet1: blankSheet() }); setActiveSheet("Sheet1"); setFileName("Untitled.xlsx") }} className="mt-2 flex items-center gap-1 text-[10px] text-black/40 hover:text-black/70"><FilePlus2 className="h-3 w-3" />New blank workbook</button>
          </div>
        </aside>
      </div>
      <style jsx global>{`
        .toolbar-button { display:inline-flex; height:30px; align-items:center; gap:6px; border-radius:7px; padding:0 10px; font-size:11px; font-weight:600; color:#3a3a3c; transition:background .15s; }
        .toolbar-button:hover { background:rgba(0,0,0,.06); }
        .toolbar-button.bg-\[\#217346\] { color:white; }
        .spreadsheet-canvas table { font-size:12px; min-width:100%; }
        .spreadsheet-canvas td { min-width:96px; height:28px; border-color:#dedee2 !important; }
        .spreadsheet-canvas th { background:#f4f4f6 !important; color:#6e6e73 !important; border-color:#d2d2d7 !important; font-weight:500; }
        .spreadsheet-canvas .Spreadsheet__cell--selected { outline:2px solid #217346 !important; }
      `}</style>
    </div>
  )
}
