"use client"

import type React from "react"

import { useState, useCallback, useMemo } from "react"
import { AgGridReact } from "ag-grid-react"
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// No direct CSS imports for AG Grid themes to avoid MIME type errors in preview.
// The theme class is applied, and colors are overridden via CSS variables.

ModuleRegistry.registerModules([AllCommunityModule])

export default function CustomizableAgGrid() {
  // State for customizable theme colors
  const [themeColors, setThemeColors] = useState({
    backgroundColor: "#2d3748", // Dark background
    foregroundColor: "#cbd5e0", // Light text
    headerTextColor: "#a0aec0", // Header text
    headerBackgroundColor: "#1a202c", // Header background
    oddRowBackgroundColor: "rgba(255, 255, 255, 0.05)", // Slightly lighter odd rows
    headerColumnResizeHandleColor: "#4a5568", // Resize handle
  })

  const handleColorChange = useCallback((key: keyof typeof themeColors, value: string) => {
    setThemeColors((prevColors) => ({
      ...prevColors,
      [key]: value,
    }))
  }, [])

  // Dummy Data
  const columnDefs = useMemo(
    () => [
      { field: "Product", headerName: "Product", sortable: true, filter: true, resizable: true, editable: true },
      { field: "Quantity", headerName: "Quantity", sortable: true, filter: true, resizable: true, editable: true },
      { field: "Price", headerName: "Price", sortable: true, filter: true, resizable: true, editable: true },
      { field: "Total", headerName: "Total", sortable: true, filter: true, resizable: true, editable: true },
    ],
    [],
  )

  const rowData = useMemo(
    () => [
      { Product: "Laptop", Quantity: 5, Price: 1200, Total: 6000 },
      { Product: "Mouse", Quantity: 10, Price: 25, Total: 250 },
      { Product: "Keyboard", Quantity: 7, Price: 75, Total: 525 },
      { Product: "Monitor", Quantity: 3, Price: 300, Total: 900 },
      { Product: "Webcam", Quantity: 8, Price: 50, Total: 400 },
      { Product: "Headphones", Quantity: 12, Price: 150, Total: 1800 },
      { Product: "Printer", Quantity: 2, Price: 250, Total: 500 },
      { Product: "Router", Quantity: 4, Price: 100, Total: 400 },
      { Product: "SSD", Quantity: 6, Price: 80, Total: 480 },
      { Product: "USB Drive", Quantity: 20, Price: 15, Total: 300 },
    ],
    [],
  )

  // Default column definitions for sorting, filtering, resizing, and editing
  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      editable: true, // Make all cells editable by default
    }),
    [],
  )

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

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 min-h-screen bg-gray-800 text-gray-100">
      {/* Color Customization Panel */}
      <div className="w-full lg:w-1/3 bg-gray-900 border border-gray-700 shadow-lg">
        <div>
          <div className="text-xl text-blue-400">Customize Grid Theme</div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {Object.entries(themeColors).map(([key, value]) => (
            <div key={key} className="flex flex-col gap-1">
              <Label htmlFor={key} className="capitalize text-gray-300">
                {key.replace(/([A-Z])/g, " $1").trim()}:
              </Label>
              <Input
                id={key}
                type="color"
                value={value.startsWith("rgb") ? "#000000" : value} // Color input doesn't support rgba directly, use a placeholder or convert
                onChange={(e) => handleColorChange(key as keyof typeof themeColors, e.target.value)}
                className="w-full h-10 p-1 border border-gray-600 rounded-md bg-gray-700 cursor-pointer"
              />
              <Input
                type="text"
                value={value}
                onChange={(e) => handleColorChange(key as keyof typeof themeColors, e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-gray-200 focus:outline-none focus:border-blue-500"
                placeholder="e.g., #RRGGBB or rgba(R,G,B,A)"
              />
            </div>
          ))}
        </div>
      </div>

      {/* AG Grid Table */}
      <div className="w-full lg:w-2/3 bg-gray-900 border border-gray-700 shadow-lg">
        <div>
          <div className="text-xl text-blue-400">Editable Product Sales Data</div>
        </div>
        <div>
          <div
            className="ag-theme-quartz-dark h-[400px] w-full rounded-lg overflow-hidden"
            style={gridStyle as React.CSSProperties} // Apply dynamic CSS variables
          >
            <AgGridReact
              columnDefs={columnDefs}
              rowData={rowData}
              defaultColDef={defaultColDef}
              pagination={true}
              paginationPageSize={10}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
