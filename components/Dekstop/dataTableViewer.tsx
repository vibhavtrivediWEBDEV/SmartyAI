"use client"

import type React from "react"
import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, EyeIcon, Code2Icon, Palette  } from "lucide-react" // Import Palette icon
// Removed: import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CodeViewer } from "@/app/components/terminal/CodeViwer" // Import the new CodeViewer component


// AG Grid imports
import { AgGridReact } from "ag-grid-react"
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community"
// Import Enterprise Modules for advanced features
import { MasterDetailModule, RowGroupingModule, TreeDataModule } from "ag-grid-enterprise"

// No direct CSS imports for AG Grid themes to avoid MIME type errors.
// The theme class is applied, and colors are overridden via CSS variables.

// Register all necessary modules
ModuleRegistry.registerModules([AllCommunityModule, MasterDetailModule, RowGroupingModule, TreeDataModule])

// Types
interface ColumnDef {
  field: string
  headerName: string
  sortable?: boolean
  filter?: boolean
  editable?: boolean
  resizable?: boolean
  width?: number
  flex?: number
  // For row grouping
  rowGroup?: boolean
  enableRowGroup?: boolean
  // For master-detail
  cellRenderer?: string // To indicate a custom renderer like 'agGroupCellRenderer'
  cellRendererParams?: any
  // For value formatters
  valueFormatter?: string
}

interface GridOptions {
  pagination?: boolean
  paginationPageSize?: number
  defaultColDef?: {
    sortable?: boolean
    filter?: boolean
    resizable?: boolean
    editable?: boolean
  }
  // Tree Data specific options
  treeData?: boolean
  getDataPath?: string | ((data: any) => string[]) // Can be string from AI, or function in component
  autoGroupColumnDef?: ColumnDef
  // Master-Detail specific options
  masterDetail?: boolean
  detailCellRenderer?: any // Can be a component or string name
  detailCellRendererParams?: any
  // Row Grouping specific options
  groupDisplayType?: "singleColumn" | "multipleColumns" | "custom" | "groupRows"
  rowGroupPanelShow?: "always" | "onlyWhenGrouping" | "never"
  // Side Bar
  sideBar?: boolean | string | string[]
}

interface ThemeColors {
  backgroundColor?: string
  foregroundColor?: string
  headerTextColor?: string
  headerBackgroundColor?: string
  oddRowBackgroundColor?: string
  headerColumnResizeHandleColor?: string
  // Add more AG Grid CSS variables as needed for full customization
}

interface AIResponseData {
  columnDefs: ColumnDef[]
  rowData: Record<string, any>[]
  gridOptions?: GridOptions // gridOptions can now include treeData and getDataPath string
  themeColors?: ThemeColors // AI can now suggest theme colors
  error?: string
}

// A simple detail cell renderer for master-detail
const DetailCellRenderer: React.FC<any> = ({ data }) => {
  return (
    <div className="p-4 bg-gray-700 text-gray-200 rounded-md m-2">
      <h4 className="font-bold mb-2">Detail for {data.name || data.id || "item"}:</h4>
      <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}

export function DynamicAgGridConfigurator() {
  const [inputData, setInputData] = useState("")
  const [aiPrompt, setAiPrompt] = useState(
    "Analyze the data and configure the grid appropriately. For example, if it's sales data, suggest relevant columns. If it's hierarchical, enable tree data. If it has nested details, enable master-detail. If it has categories, suggest row grouping. You can also ask for specific theme colors here.",
  )
  const [columnDefs, setColumnDefs] = useState<ColumnDef[]>([])
  const [rowData, setRowData] = useState<Record<string, any>[]>([])
  const [gridOptions, setGridOptions] = useState<GridOptions>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiRawResponse, setAiRawResponse] = useState<string>("")
  const [generatedComponentCode, setGeneratedComponentCode] = useState<string>("")
  const [rightPanelMode, setRightPanelMode] = useState<"preview" | "code" | "theme">("preview") // State for right panel toggle (Preview/Code/Theme)
  const [leftPanelMode, setLeftPanelMode] = useState<"input" | "prompt">("input") // State for left panel toggle (Input Data/AI Prompt)

  // State for customizable theme colors, initialized with a default dark theme
  const [themeColors, setThemeColors] = useState<ThemeColors>({
    backgroundColor: "#2d3748", // Dark background
    foregroundColor: "#cbd5e0", // Light text
    headerTextColor: "#a0aec0", // Header text
    headerBackgroundColor: "#1a202c", // Header background
    oddRowBackgroundColor: "rgba(255, 255, 255, 0.05)", // Slightly lighter odd rows
    headerColumnResizeHandleColor: "#4a5568", // Resize handle
  })

  const handleColorChange = useCallback((key: keyof ThemeColors, value: string) => {
    setThemeColors((prevColors) => ({
      ...prevColors,
      [key]: value,
    }))
  }, [])

  const handleGenerateTable = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setAiRawResponse("")
    setGeneratedComponentCode("")
    setColumnDefs([])
    setRowData([])
    setRightPanelMode("preview") // Reset to preview mode on new generation

    let dataToProcess = inputData.trim()
    let isApiUrl = false

    try {
      new URL(dataToProcess)
      isApiUrl = true
    } catch {
      isApiUrl = false
    }

    if (isApiUrl) {
      try {
        const response = await fetch(dataToProcess)
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        dataToProcess = JSON.stringify(await response.json(), null, 2)
      } catch (fetchError: any) {
        setError(`Failed to fetch data from URL: ${fetchError.message}`)
        setIsLoading(false)
        return
      }
    }

    const promptForAI = `
**Input Data (JSON):**
\`\`\`json
${dataToProcess}
\`\`\`

**User Instructions:**
${aiPrompt}
`

    try {
      const response = await fetch("/api/streamTable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptForAI, messages: [] }),
      })

      if (!response.ok || !response.body) throw new Error("No stream returned from AI API.")

      const reader = response.body.getReader()
      const decoder = new TextDecoder("utf-8")
      let accumulated = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setAiRawResponse(accumulated)
      }

      const jsonMatch = accumulated.match(/```json\n([\s\S]*?)\n```/)
      let parsedData: AIResponseData

      try {
        if (jsonMatch && jsonMatch[1]) {
          parsedData = JSON.parse(jsonMatch[1])
        } else {
          parsedData = JSON.parse(accumulated)
        }
      } catch (parseErr: any) {
        console.error("Failed to parse AI response:", accumulated, parseErr)
        setError(`Failed to parse AI's JSON response: ${parseErr.message}. Raw response: ${accumulated}`)
        return
      }

      if (parsedData.error) {
        setError(`AI Error: ${parsedData.error}`)
      } else if (parsedData.columnDefs && parsedData.rowData) {
        const computedRowData = parsedData.rowData.map((row) => {
          const newRow = { ...row }
          for (const key in newRow) {
            if (typeof newRow[key] === "string" && newRow[key].startsWith("=")) {
              newRow[key] = "⚠ Formula not supported"
            }
          }
          return newRow
        })
        setColumnDefs(parsedData.columnDefs)
        setRowData(computedRowData)

        const newGridOptions: GridOptions = {
          ...gridOptions,
          ...(parsedData.gridOptions || {}),
          defaultColDef: {
            ...(gridOptions.defaultColDef || {}),
            ...(parsedData.gridOptions?.defaultColDef || {}),
          },
        }

        // Handle tree data specific configuration
        if (newGridOptions.treeData && typeof parsedData.gridOptions?.getDataPath === "string") {
          const pathField = parsedData.gridOptions.getDataPath
          newGridOptions.getDataPath = (data: any) => data[pathField]
          if (!newGridOptions.autoGroupColumnDef) {
            newGridOptions.autoGroupColumnDef = {
              headerName: "Hierarchy",
              minWidth: 200,
              cellRendererParams: {
                suppressCount: true,
              },
            }
          }
        } else {
          newGridOptions.treeData = false
          newGridOptions.getDataPath = undefined
          newGridOptions.autoGroupColumnDef = undefined
        }

        // Handle Master-Detail specific configuration
        if (newGridOptions.masterDetail && parsedData.gridOptions?.detailCellRenderer === "DetailCellRenderer") {
          newGridOptions.detailCellRenderer = DetailCellRenderer
        } else if (!newGridOptions.masterDetail) {
          newGridOptions.detailCellRenderer = undefined
          newGridOptions.detailCellRendererParams = undefined
        }

        setGridOptions(newGridOptions)

        if (parsedData.themeColors) {
          setThemeColors((prev) => ({ ...prev, ...parsedData.themeColors }))
        }

        // --- Generate the full component code ---
        const generatedCode = `
"use client"

import { AgGridReact } from "ag-grid-react"
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community"
import { MasterDetailModule, RowGroupingModule, TreeDataModule } from "ag-grid-enterprise"
import React, { useMemo } from "react"

// No direct CSS imports for AG Grid themes to avoid MIME type errors.
// The theme class is applied, and colors are overridden via CSS variables.

ModuleRegistry.registerModules([AllCommunityModule, MasterDetailModule, RowGroupingModule, TreeDataModule])

${
  newGridOptions.masterDetail
    ? `
const DetailCellRenderer: React.FC<any> = ({ data }) => {
  return (
    <div className="p-4 bg-gray-700 text-gray-200 rounded-md m-2">
      <h4 className="font-bold mb-2">Detail for {data.name || data.id || "item"}:</h4>
      <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
`
    : ""
}

export default function TABLECOMPONENT() {
  const columnDefs = useMemo(() => ${JSON.stringify(parsedData.columnDefs, null, 2)}, []);
  const rowData = useMemo(() => ${JSON.stringify(computedRowData, null, 2)}, []);
  const themeColors = useMemo(() => ${JSON.stringify(parsedData.themeColors || themeColors, null, 2)}, []);

  const gridOptions = useMemo(() => ({
    pagination: ${newGridOptions.pagination ?? false},
    paginationPageSize: ${newGridOptions.paginationPageSize ?? 10},
    defaultColDef: ${JSON.stringify(newGridOptions.defaultColDef || { sortable: true, filter: true, resizable: true, editable: true }, null, 2)},
    treeData: ${newGridOptions.treeData ?? false},
    getDataPath: ${newGridOptions.treeData && typeof parsedData.gridOptions?.getDataPath === "string" ? `(data) => data.${parsedData.gridOptions.getDataPath}` : "undefined"},
    autoGroupColumnDef: ${JSON.stringify(newGridOptions.autoGroupColumnDef, null, 2)},
    masterDetail: ${newGridOptions.masterDetail ?? false},
    detailCellRenderer: ${newGridOptions.masterDetail ? "DetailCellRenderer" : "undefined"},
    detailCellRendererParams: ${JSON.stringify(newGridOptions.detailCellRendererParams, null, 2)},
    groupDisplayType: ${newGridOptions.groupDisplayType ? `'${newGridOptions.groupDisplayType}'` : "undefined"},
    rowGroupPanelShow: ${newGridOptions.rowGroupPanelShow ? `'${newGridOptions.rowGroupPanelShow}'` : "undefined"},
    sideBar: ${newGridOptions.sideBar ? (typeof newGridOptions.sideBar === "string" ? `'${newGridOptions.sideBar}'` : JSON.stringify(newGridOptions.sideBar)) : "undefined"},
  }), []);

  const gridStyle = useMemo(
    () => ({
      "--ag-background-color": themeColors.backgroundColor,
      "--ag-foreground-color": themeColors.foregroundColor,
      "--ag-header-foreground-color": themeColors.headerTextColor,
      "--ag-header-background-color": themeColors.headerBackgroundColor,
      "--ag-odd-row-background-color": themeColors.oddRowBackgroundColor,
      "--ag-header-column-resize-handle-color": themeColors.headerColumnResizeHandleColor,
    }),
    [themeColors],
  );

  const components = useMemo(
    () => ({
      ${newGridOptions.masterDetail ? "DetailCellRenderer: DetailCellRenderer," : ""}
    }),
    [],
  );

  return (
    <div className="ag-theme-quartz-dark h-[500px] w-full rounded-lg overflow-hidden" style={gridStyle as React.CSSProperties}>
      <AgGridReact
        columnDefs={columnDefs}
        rowData={rowData}
        defaultColDef={gridOptions.defaultColDef}
        pagination={gridOptions.pagination}
        paginationPageSize={gridOptions.paginationPageSize}
        treeData={gridOptions.treeData}
        getDataPath={gridOptions.getDataPath}
        autoGroupColumnDef={gridOptions.autoGroupColumnDef}
        masterDetail={gridOptions.masterDetail}
        detailCellRenderer={gridOptions.detailCellRenderer}
        detailCellRendererParams={gridOptions.detailCellRendererParams}
        groupDisplayType={gridOptions.groupDisplayType}
        rowGroupPanelShow={gridOptions.rowGroupPanelShow}
        sideBar={gridOptions.sideBar}
        components={components}
      />
    </div>
  );
}
        `.trim()
        setGeneratedComponentCode(generatedCode)
      } else {
        setError("AI response missing 'columnDefs' or 'rowData'.")
      }
    } catch (err: any) {
      setError(`Error generating table: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }, [inputData, aiPrompt, gridOptions, themeColors])

  // Create a style object for CSS variables
  const gridStyle = useMemo(
    () => ({
      "--ag-background-color": themeColors.backgroundColor,
      "--ag-foreground-color": themeColors.foregroundColor,
      "--ag-header-foreground-color": themeColors.headerTextColor,
      "--ag-header-background-color": themeColors.headerBackgroundColor,
      "--ag-odd-row-background-color": themeColors.oddRowBackgroundColor,
      "--ag-header-column-resize-handle-color": themeColors.headerColumnResizeHandleColor,
      // Add other AG Grid CSS variables as needed for full customization
    }),
    [themeColors],
  )

  // Register custom cell renderers
  const components = useMemo(
    () => ({
      DetailCellRenderer: DetailCellRenderer,
    }),
    [],
  )

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 min-h-screen bg-gray-800 text-gray-100">
      {/* Left Section: AI Input and Controls */}
      <div className="w-full lg:w-1/2 bg-gray-900 border border-gray-700 shadow-lg rounded-lg">
        <div className="flex flex-row items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-blue-400">AG Grid AI Configurator</h2>
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <Button
              variant="ghost"
              className={`px-3 py-2 rounded-l-md rounded-r-none border border-gray-600 bg-gray-700 hover:bg-slate-900 text-gray-300 ${
                leftPanelMode === "input" ? "bg-black text-white hover:bg-slate-700" : ""
              }`}
              onClick={() => setLeftPanelMode("input")}
              size="sm"
              aria-label="Show Input Data"
            >
              []
              {/* <EyeIcon className="h-4 w-4" /> */}
            </Button>
            <Button
              variant="ghost"
              className={`px-3 py-2 rounded-r-md rounded-l-none border border-gray-600 border-l-0 bg-gray-700 hover:bg-gray-600 text-gray-300 ${
                leftPanelMode === "prompt" ? "bg-black text-white hover:bg-slate-900" : ""
              }`}
              onClick={() => setLeftPanelMode("prompt")}
              size="sm"
              aria-label="Show AI Prompt"
            >
              ✨
              {/* <Code2Icon className="h-4 w-4" /> */}
            </Button>
          </div>
        </div>
        <div className="p-4 grid grid-cols-1 gap-4">
          {leftPanelMode === "input" ? (
            <div>
              <Label htmlFor="input-data" className="mb-1 block text-gray-400">
                Input Data (JSON or API URL):
              </Label>
              <textarea
                id="input-data"
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                placeholder="Paste JSON data here or API URL (e.g., https://api.example.com/data)"
                rows={10}
                className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-gray-200 focus:outline-none focus:border-blue-500 resize-y"
                disabled={isLoading}
              />
            </div>
          ) : (
            <div>
              <Label htmlFor="ai-prompt" className="mb-1 block text-gray-400">
                AI Prompt (Optional, for specific requests):
              </Label>
              <textarea
                id="ai-prompt"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g., 'Add a column for 'status' and make it a dropdown', or 'Change header background to red'."
                rows={10}
                className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-gray-200 focus:outline-none focus:border-blue-500 resize-y"
                disabled={isLoading}
              />
            </div>
          )}
          <Button
            onClick={handleGenerateTable}
            className="mt-4 w-full bg-gray-700 pointer hover:bg-slate-700 text-white font-semibold py-2 rounded-md disabled:opacity-50"
            disabled={isLoading || !inputData.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
              </>
            ) : (
              "Generate AG Grid Table"
            )}
          </Button>
          {error && (
            <div className="bg-red-900 text-red-300 p-3 rounded-md">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>
      </div>

      {/* Right Section: Grid Display, Code, and Color Customization */}
      <div className="w-full lg:w-1/2 bg-gray-900 border border-gray-700 shadow-lg rounded-lg">
        <div className="flex flex-row items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-blue-400">AG Grid Table & Configuration</h2>
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <Button
              variant="ghost"
              className={`px-3 py-2 rounded-l-md rounded-r-none border border-gray-600 bg-gray-700 hover:bg-gray-600 text-gray-300 ${
                rightPanelMode === "preview" ? "bg-black text-white hover:bg-slate-700" : ""
              }`}
              onClick={() => setRightPanelMode("preview")}
              size="sm"
              aria-label="Show Preview"
            >
              <EyeIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              className={`px-3 py-2 rounded-none border border-gray-600 border-l-0 bg-gray-700 hover:bg-gray-600 text-gray-300 ${
                rightPanelMode === "code" ? "bg-black text-white hover:bg-slate-700" : ""
              }`}
              onClick={() => setRightPanelMode("code")}
              size="sm"
              aria-label="Show Code"
            >
              <Code2Icon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              className={`px-3 py-2 rounded-r-md rounded-l-none border border-gray-600 border-l-0 bg-gray-700 hover:bg-gray-600 text-gray-300 ${
                rightPanelMode === "theme" ? "bg-black text-white hover:bg-slate-700" : ""
              }`}
              onClick={() => setRightPanelMode("theme")}
              size="sm"
              aria-label="Customize Theme Colors"
            >
              <Palette className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="p-4 flex flex-col gap-6">
          {rightPanelMode === "preview" && (
            <div
              className="ag-theme-quartz-dark h-[400px] w-full rounded-lg overflow-hidden"
              style={gridStyle as React.CSSProperties} // Apply dynamic CSS variables
            >
              {rowData.length > 0 ? (
                <AgGridReact
                  columnDefs={columnDefs}
                  rowData={rowData}
                  defaultColDef={
                    gridOptions.defaultColDef || { sortable: true, filter: true, resizable: true, editable: true }
                  }
                  pagination={gridOptions.pagination ?? false}
                  paginationPageSize={gridOptions.paginationPageSize ?? 10}
                  treeData={gridOptions.treeData ?? false}
                  getDataPath={gridOptions.getDataPath}
                  autoGroupColumnDef={gridOptions.autoGroupColumnDef}
                  masterDetail={gridOptions.masterDetail ?? false}
                  detailCellRenderer={gridOptions.detailCellRenderer}
                  detailCellRendererParams={gridOptions.detailCellRendererParams}
                  groupDisplayType={gridOptions.groupDisplayType}
                  rowGroupPanelShow={gridOptions.rowGroupPanelShow}
                  sideBar={gridOptions.sideBar}
                  components={components} // Register custom components
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  {isLoading ? "Loading table data..." : "Enter data and prompt to generate an AG Grid table."}
                </div>
              )}
            </div>
          )}

          {rightPanelMode === "code" && (
            <div className="h-[500px] w-full rounded-lg overflow-y-auto">
              {generatedComponentCode ? (
                <CodeViewer code={generatedComponentCode} language="tsx" />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Generate a table to see the component code here.
                </div>
              )}
            </div>
          )}

          {rightPanelMode === "theme" && (
            <div>
              <h3 className="text-lg font-bold text-gray-300 mb-3">Customize Theme Colors</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(themeColors).map(([key, value]) => (
                  <div key={key} className="flex flex-col gap-1">
                    <Label htmlFor={`color-${key}`} className="capitalize text-gray-400">
                      {key.replace(/([A-Z])/g, " $1").trim()}:
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id={`color-${key}`}
                        type="color"
                        value={value?.startsWith("rgb") ? "#000000" : value || "#000000"} // Handle rgba for color picker
                        onChange={(e) => handleColorChange(key as keyof ThemeColors, e.target.value)}
                        className="w-12 h-10 p-1 border border-gray-600 rounded-md bg-gray-700 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={value || ""}
                        onChange={(e) => handleColorChange(key as keyof ThemeColors, e.target.value)}
                        className="flex-1 bg-gray-700 border border-gray-600 text-gray-200 focus:outline-none focus:border-blue-500"
                        placeholder="e.g., #RRGGBB or rgba(R,G,B,A)"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
