"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DownloadIcon, UploadIcon } from "lucide-react"
import { CodeViewer } from "./CodeViwer"
import type { JSX } from "react/jsx-runtime"

import { Spreadsheet, type DataViewer } from "react-spreadsheet"
import * as XLSX from "xlsx"

// Dummy Excel data (will be replaced by file upload)
const initialExcelData = [

]

export function ExcelEditor() {
  const [spreadsheetData, setSpreadsheetData] = useState<DataViewer[][]>(
    initialExcelData.map((row) => row.map((cell) => ({ value: String(cell) }))),
  )
  const [spreadsheetRenderKey, setSpreadsheetRenderKey] = useState(0) // New state for forcing re-render
  const [chatQuery, setChatQuery] = useState("")
  const [chatResponse, setChatResponse] = useState<string | JSX.Element>("")
  const [isChatLoading, setIsChatLoading] = useState(false)
  const chatInputRef = useRef<HTMLInputElement>(null)
  const chatResponseRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatInputRef.current) {
      chatInputRef.current.focus()
    }
  }, [])

  useEffect(() => {
    if (chatResponseRef.current) {
      chatResponseRef.current.scrollTop = chatResponseRef.current.scrollHeight
    }
  }, [chatResponse])

  // Function to parse AI response for code blocks and plain text
  const parseAIResponse = (text: string): JSX.Element => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g
    const elements: (string | JSX.Element)[] = []
    let lastIndex = 0
    let match

    while ((match = codeBlockRegex.exec(text)) !== null) {
      const [fullMatch, language, codeContent] = match
      const startIndex = match.index!
      const endIndex = startIndex + fullMatch.length

      if (startIndex > lastIndex) {
        elements.push(text.substring(lastIndex, startIndex))
      }
      elements.push(<CodeViewer key={startIndex} code={codeContent.trim() || 'smarty'} language={language || "text"} />)
      lastIndex = endIndex
    }

    if (lastIndex < text.length) {
      elements.push(text.substring(lastIndex))
    }

    return (
      <>
        {elements.map((el, i) =>
          typeof el === "string"
            ? el.split("\n").map((line, lineIdx) => (
                <p key={`${i}-${lineIdx}`} className="text-sm whitespace-pre-wrap mb-2">
                  {line}
                </p>
              ))
            : el,
        )}
      </>
    )
  }

  const performSpreadsheetAction = useCallback(
    (actionType: string, payload: any) => {
      setSpreadsheetData((prevData) => {
        console.log("--- performSpreadsheetAction ---")
        console.log("Previous Data:", JSON.stringify(prevData))
        console.log("Action Type:", actionType)
        console.log("Payload:", JSON.stringify(payload))

        let newData = [...prevData.map((row) => [...row])] // Deep copy to ensure immutability
        let maxCols = Math.max(...newData.map((row) => row.length)) // Current max columns

        if (actionType === "addRow") {
          const { rowIndex, data } = payload
          maxCols = Math.max(maxCols, data.length) // Update maxCols if new row is wider

          const newRow = Array(maxCols).fill({ value: "" }) // Create a row filled with empty cells
          data.forEach((cellValue: string, i: number) => {
            if (i < maxCols) {
              newRow[i] = { value: cellValue } // Populate with provided data
            }
          })

          if (rowIndex === -1 || rowIndex >= newData.length) {
            newData.push(newRow)
          } else {
            newData.splice(rowIndex, 0, newRow)
          }
          console.log("After addRow:", JSON.stringify(newData))
        } else if (actionType === "updateCell") {
          // Ensure payload is an array of updates, even if it's a single update
          const updates = Array.isArray(payload) ? payload : [payload]

          updates.forEach(({ rowIndex, colIndex, value }) => {
            maxCols = Math.max(maxCols, colIndex + 1) // Update maxCols if cell is beyond current max

            // Ensure row exists
            while (newData.length <= rowIndex) {
              newData.push(Array(maxCols).fill({ value: "" })) // Use maxCols for new rows
            }
            // Ensure column exists in that row
            while (newData[rowIndex].length <= colIndex) {
              newData[rowIndex].push({ value: "" })
            }
            newData[rowIndex][colIndex] = { value: String(value) }
          })
          console.log("After updateCell (batch):", JSON.stringify(newData))
        } else if (actionType === "addColumn") {
          const { colIndex, header, data } = payload
          const targetColIndex = colIndex === -1 ? maxCols : colIndex // -1 means add to end
          maxCols = Math.max(maxCols, targetColIndex + 1) // Update maxCols

          // Add header to the first row
          if (newData.length > 0) {
            while (newData[0].length <= targetColIndex) {
              newData[0].push({ value: "" }) // Pad if necessary
            }
            newData[0].splice(targetColIndex, 0, { value: header || "" })
          } else {
            // If no data, create a new first row with the header
            newData.push(Array(targetColIndex + 1).fill({ value: "" }))
            newData[0][targetColIndex] = { value: header || "" }
          }

          // Add data to subsequent rows or empty cells
          for (let i = 1; i < newData.length; i++) {
            while (newData[i].length <= targetColIndex) {
              newData[i].push({ value: "" }) // Pad if necessary
            }
            const cellValue = data && data[i - 1] !== undefined ? data[i - 1] : ""
            newData[i].splice(targetColIndex, 0, { value: cellValue })
          }
          console.log("After addColumn:", JSON.stringify(newData))
        } else if (actionType === "deleteRow") {
          const { rowIndex } = payload
          if (rowIndex >= 0 && rowIndex < newData.length) {
            newData.splice(rowIndex, 1)
          }
          console.log("After deleteRow:", JSON.stringify(newData))
        } else if (actionType === "deleteColumn") {
          const { colIndex } = payload
          if (colIndex >= 0 && colIndex < maxCols) {
            newData = newData.map((row) => {
              const newRow = [...row]
              newRow.splice(colIndex, 1)
              return newRow
            })
            maxCols-- // Decrement max columns
          }
          console.log("After deleteColumn:", JSON.stringify(newData))
        } else if (actionType === "sort") {
          const { colIndex, order } = payload
          if (newData.length < 2) return newData // No header or only header row

          const headerRow = newData[0]
          const dataRows = newData.slice(1)

          if (colIndex >= 0 && colIndex < headerRow.length) {
            dataRows.sort((a, b) => {
              const valA = a[colIndex]?.value || ""
              const valB = b[colIndex]?.value || ""

              // Attempt numerical comparison first
              const numA = Number.parseFloat(valA)
              const numB = Number.parseFloat(valB)

              if (!isNaN(numA) && !isNaN(numB)) {
                return order === "asc" ? numA - numB : numB - numA
              } else {
                // Fallback to string comparison
                return order === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA)
              }
            })
          }
          newData = [headerRow, ...dataRows]
          console.log("After sort:", JSON.stringify(newData))
        }

        // Ensure all rows have the same number of columns as the new maxCols
        // This is crucial for react-spreadsheet to render correctly after structural changes
        for (let i = 0; i < newData.length; i++) {
          while (newData[i].length < maxCols) {
            newData[i].push({ value: "" })
          }
          // Trim excess columns if maxCols decreased (e.g., after deleteColumn)
          newData[i] = newData[i].slice(0, maxCols)
        }

        // Increment the key to force re-render of Spreadsheet component
        setSpreadsheetRenderKey((prevKey) => prevKey + 1)
        console.log("Final Data (before set):", JSON.stringify(newData))
        console.log("New Render Key:", spreadsheetRenderKey + 1)
        console.log("--- End performSpreadsheetAction ---")
        return newData
      })
    },
    [spreadsheetRenderKey],
  )

  const handleChatSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!chatQuery.trim()) return

    const userQuery = chatQuery.trim()
    setChatQuery("")
    setIsChatLoading(true)
    setChatResponse("") // Clear previous response

    try {
      // Convert current spreadsheet data to a simple 2D array for AI context
      const currentSheetData = spreadsheetData.map((row) => row.map((cell) => cell.value))

      const response = await fetch("/api/streamExcel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userQuery, spreadsheet: currentSheetData }),
      })

      if (!response.ok || !response.body) {
        throw new Error("No stream returned from AI API.")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder("utf-8")
      let accumulated = ""

      // Read the entire stream first
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
      }

      console.log("accumulated (raw):", accumulated) // Log raw accumulated string

      // Attempt to extract JSON from a Markdown code block if present
      let jsonString = accumulated.trim()
      // Updated regex to find JSON code block anywhere in the string
      const jsonCodeBlockMatch = jsonString.match(/```json\n([\s\S]*?)\n```/)
      if (jsonCodeBlockMatch && jsonCodeBlockMatch[1]) {
        jsonString = jsonCodeBlockMatch[1].trim()
        console.log("Extracted JSON string:", jsonString)
      } else {
        console.log("No JSON code block detected, attempting to parse raw accumulated string.")
      }

      // After stream is done, attempt to parse as JSON
      try {
        const aiResponse = JSON.parse(jsonString) // Parse the extracted/trimmed string
        console.log("aiResponse (parsed):", aiResponse) // Log parsed JSON
       

        if (aiResponse.action) {
          performSpreadsheetAction(aiResponse.action.type, aiResponse.action.payload)
        }
        setChatResponse(parseAIResponse(aiResponse.response || "Action performed successfully."))
      } catch (jsonError) {
        console.error("JSON parsing error:", jsonError) // Log the actual error
        // If JSON parsing fails, treat the original accumulated string as plain text
        setChatResponse(parseAIResponse(accumulated))
      }
    } catch (error) {
      console.error("Stream error:", error)
      setChatResponse(<p className="text-red-400">Something went wrong. Please try again.</p>)
    } finally {
      setIsChatLoading(false)
      if (chatInputRef.current) chatInputRef.current.focus()
    }
  }

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleChatSearch()
    }
  }

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const data = e.target?.result
      if (data) {
        try {
          const workbook = XLSX.read(data, { type: "binary" })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]

          const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1")
          const formattedData: DataViewer[][] = []

          // Determine the maximum number of columns across all rows
          let maxCols = 0
          for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
              const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
              if (worksheet[cellAddress]) {
                maxCols = Math.max(maxCols, C + 1)
              }
            }
          }

          for (let R = range.s.r; R <= range.e.r; ++R) {
            const row: DataViewer[] = []
            for (let C = range.s.c; C < maxCols; ++C) {
              // Iterate up to maxCols
              const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
              const cell = worksheet[cellAddress]

              let cellValue = ""
              if (cell) {
                if (cell.f) {
                  // If it's a formula cell, get the formula string
                  cellValue = "=" + cell.f
                } else if (cell.v !== undefined) {
                  // Otherwise, get the value
                  cellValue = String(cell.v)
                }
              }
              row.push({ value: cellValue })
            }
            formattedData.push(row)
          }

          setSpreadsheetData(formattedData)
          setSpreadsheetRenderKey((prevKey) => prevKey + 1) // Force re-render on file upload
        } catch (error) {
          console.error("Error parsing Excel file:", error)
          alert("Failed to parse Excel file. Please ensure it's a valid .xlsx or .csv.")
        }
      }
    }
    reader.readAsBinaryString(file)
  }, [])

  const handleDownloadExcel = useCallback(() => {
    const ws = XLSX.utils.json_to_sheet([]) // Start with an empty sheet

    spreadsheetData.forEach((row, rIdx) => {
      row.forEach((cell, cIdx) => {
        const cellAddress = XLSX.utils.encode_cell({ r: rIdx, c: cIdx })
        const cellValue = cell.value

        let cellObj: XLSX.CellObject = { t: "s", v: cellValue } // Default to string type

        if (typeof cellValue === "string" && cellValue.startsWith("=")) {
          cellObj = { t: "f", f: cellValue.substring(1) } // Formula type, remove leading '='
        } else if (!isNaN(Number(cellValue)) && cellValue !== "") {
          cellObj = { t: "n", v: Number(cellValue) } // Number type
        }

        // Add cell to worksheet
        XLSX.utils.sheet_add_json(ws, [[cellObj]], { origin: cellAddress, skipHeader: true })
      })
    })

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1")
    XLSX.writeFile(wb, "excel_output.xlsx")
  }, [spreadsheetData])

  return (
    <div className="flex w-full h-full bg-gray-900 text-gray-300 rounded-lg overflow-hidden ">
      {/* Left Side: Excel Viewer */}
      <div className="flex-1 p-4 overflow-auto border-r border-gray-700 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-green-400">Excel Viewer</h2>
          <div className="flex gap-2">
            <Label htmlFor="file-upload" className="cursor-pointer">
              <Button asChild className="bg-gray-700 hover:bg-gray-600 text-white">
                <span>
                  <UploadIcon className="h-4 w-4 mr-2" /> Upload Excel
                </span>
              </Button>
            </Label>
            <Input
              id="file-upload"
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button onClick={handleDownloadExcel} className="bg-blue-600 hover:bg-blue-700 text-white">
              <DownloadIcon className="h-4 w-4 mr-2" /> Download Excel
            </Button>
          </div>
        </div>
        <div className="flex-1 max-h-[300px] overflow-auto border border-gray-700 rounded-md">
          <Spreadsheet key={spreadsheetRenderKey} data={spreadsheetData} onChange={setSpreadsheetData} />
        </div>
        <p className="text-xs text-gray-500 mt-4">* This is a simulated Excel view. You can edit cells directly.</p>
      </div>

      {/* Right Side: AI Chatbox */}
      <div className="flex-1 flex flex-col p-4">
        <h2 className="text-xl font-bold text-blue-400 mb-4">Excel AI Assistant</h2>
        <div className=" h-auto  overflow-y-auto  pr-2 mb-4 border-b border-gray-700 pb-2" ref={chatResponseRef}>
          {chatResponse && <div className="mb-4">{chatResponse}</div>}
          {isChatLoading && (
            <p className="text-yellow-400">
              Thinking...
              <span className="blinking-cursor bg-yellow-400 w-2 h-4 ml-1 inline-block" />
            </p>
          )}
        </div>
        <form onSubmit={handleChatSearch} className="flex items-center">
          <span className="text-blue-400 mr-2">Excel AI&gt;</span>
          <Input
            ref={chatInputRef}
            type="text"
            value={chatQuery}
            onChange={(e) => setChatQuery(e.target.value)}
            onKeyDown={handleChatKeyDown}
            className="flex-1 bg-transparent border-b border-gray-600 outline-none text-gray-200 caret-blue-400 pb-1"
            placeholder="Ask about Excel shortcuts or formulas..."
            disabled={isChatLoading}
          />
          <Button
            type="submit"
            className="ml-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm disabled:opacity-50"
            disabled={isChatLoading}
          >
            Send
          </Button>
        </form>
        <style jsx>{`
          @keyframes blink {
            0%,
            100% {
              opacity: 1;
            }
            50% {
              opacity: 0;
            }
          }
          .blinking-cursor {
            animation: blink 1s step-end infinite;
          }
        `}</style>
      </div>
    </div>
  )
}
