export type CellValue = string | number | boolean | null
export type SheetMatrix = CellValue[][]

export interface SpreadsheetAction {
  type: "replaceSheet" | "updateCell" | "updateCells" | "addRow" | "addColumn" | "deleteRow" | "deleteColumn" | "sort" | "clearRange"
  payload: Record<string, unknown>
}

const empty = () => ""

export function rectangularize(matrix: SheetMatrix): SheetMatrix {
  const width = Math.max(1, ...matrix.map((row) => row.length))
  return (matrix.length ? matrix : [Array.from({ length: width }, empty)]).map((row) => [
    ...row,
    ...Array.from({ length: width - row.length }, empty),
  ])
}

function clone(matrix: SheetMatrix): SheetMatrix {
  return rectangularize(matrix).map((row) => [...row])
}

function asIndex(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback
}

function ensureCell(data: SheetMatrix, rowIndex: number, colIndex: number) {
  const width = Math.max(colIndex + 1, ...data.map((row) => row.length), 1)
  while (data.length <= rowIndex) data.push(Array.from({ length: width }, empty))
  data.forEach((row) => {
    while (row.length < width) row.push("")
  })
}

export function applySpreadsheetAction(matrix: SheetMatrix, action: SpreadsheetAction): SheetMatrix {
  const payload = action.payload ?? {}
  if (action.type === "replaceSheet") {
    return rectangularize(Array.isArray(payload.data) ? payload.data as SheetMatrix : matrix)
  }

  let data = clone(matrix)
  if (action.type === "updateCell") {
    const rowIndex = asIndex(payload.rowIndex)
    const colIndex = asIndex(payload.colIndex)
    ensureCell(data, rowIndex, colIndex)
    data[rowIndex][colIndex] = payload.value as CellValue ?? ""
  } else if (action.type === "updateCells") {
    const updates = Array.isArray(payload.updates) ? payload.updates : []
    updates.forEach((update) => {
      if (!update || typeof update !== "object") return
      const item = update as Record<string, unknown>
      const rowIndex = asIndex(item.rowIndex)
      const colIndex = asIndex(item.colIndex)
      ensureCell(data, rowIndex, colIndex)
      data[rowIndex][colIndex] = item.value as CellValue ?? ""
    })
  } else if (action.type === "addRow") {
    const row = Array.isArray(payload.data) ? payload.data as CellValue[] : []
    const width = Math.max(row.length, ...data.map((item) => item.length), 1)
    const newRow = [...row, ...Array.from({ length: width - row.length }, empty)]
    const rowIndex = Number(payload.rowIndex)
    data.splice(rowIndex < 0 || rowIndex >= data.length ? data.length : rowIndex, 0, newRow)
  } else if (action.type === "addColumn") {
    const values = Array.isArray(payload.data) ? payload.data as CellValue[] : []
    const requestedIndex = Number(payload.colIndex)
    const width = Math.max(...data.map((row) => row.length), 1)
    const colIndex = requestedIndex < 0 || requestedIndex > width ? width : requestedIndex
    data.forEach((row, rowIndex) => row.splice(colIndex, 0, rowIndex === 0 ? payload.header as CellValue ?? "" : values[rowIndex - 1] ?? ""))
  } else if (action.type === "deleteRow") {
    const rowIndex = asIndex(payload.rowIndex, -1)
    if (rowIndex >= 0 && rowIndex < data.length) data.splice(rowIndex, 1)
  } else if (action.type === "deleteColumn") {
    const colIndex = asIndex(payload.colIndex, -1)
    if (colIndex >= 0) data.forEach((row) => row.splice(colIndex, 1))
  } else if (action.type === "sort") {
    const colIndex = asIndex(payload.colIndex)
    const direction = payload.order === "desc" ? -1 : 1
    const header = data[0]
    const rows = data.slice(1).sort((left, right) => {
      const a = left[colIndex] ?? ""
      const b = right[colIndex] ?? ""
      const numericA = Number(a)
      const numericB = Number(b)
      if (String(a).trim() && String(b).trim() && Number.isFinite(numericA) && Number.isFinite(numericB)) return (numericA - numericB) * direction
      return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" }) * direction
    })
    data = [header, ...rows]
  } else if (action.type === "clearRange") {
    const startRow = asIndex(payload.startRow)
    const endRow = asIndex(payload.endRow, startRow)
    const startCol = asIndex(payload.startCol)
    const endCol = asIndex(payload.endCol, startCol)
    ensureCell(data, endRow, endCol)
    for (let row = startRow; row <= endRow; row += 1) {
      for (let col = startCol; col <= endCol; col += 1) data[row][col] = ""
    }
  }

  return rectangularize(data)
}

export function applySpreadsheetActions(matrix: SheetMatrix, actions: SpreadsheetAction[]): SheetMatrix {
  return actions.reduce(applySpreadsheetAction, matrix)
}
