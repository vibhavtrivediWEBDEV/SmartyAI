import { describe, expect, it } from "vitest"

import { applySpreadsheetActions } from "./actions"

describe("spreadsheet actions", () => {
  it("applies AI cell updates immediately without mutating the source", () => {
    const source = [["Name", "Score"], ["Ada", 8]]
    const result = applySpreadsheetActions(source, [
      { type: "updateCells", payload: { updates: [{ rowIndex: 1, colIndex: 1, value: 10 }, { rowIndex: 2, colIndex: 0, value: "Grace" }] } },
    ])

    expect(result).toEqual([["Name", "Score"], ["Ada", 10], ["Grace", ""]])
    expect(source[1][1]).toBe(8)
  })

  it("can create and then sort an entire sheet", () => {
    const result = applySpreadsheetActions([[""]], [
      { type: "replaceSheet", payload: { data: [["Product", "Revenue"], ["B", 20], ["A", 30]] } },
      { type: "sort", payload: { colIndex: 1, order: "desc" } },
    ])

    expect(result).toEqual([["Product", "Revenue"], ["A", 30], ["B", 20]])
  })

  it("supports structural and range operations", () => {
    const result = applySpreadsheetActions([["A"], ["one"]], [
      { type: "addColumn", payload: { colIndex: -1, header: "B", data: ["two"] } },
      { type: "addRow", payload: { rowIndex: -1, data: ["three", "four"] } },
      { type: "clearRange", payload: { startRow: 1, endRow: 1, startCol: 0, endCol: 1 } },
    ])

    expect(result).toEqual([["A", "B"], ["", ""], ["three", "four"]])
  })
})
