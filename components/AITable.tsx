"use client"
import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { FaSearch, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import EditableCell from "@/components/table/EditableCell";
import { AITableProps, DataItem, ColumnMeta } from "@/types/table";
import { formatColumnHeader, getColumnWidth } from "@/utils/tableUtils";
import { detectFieldType, extractFieldOptions } from "@/utils/fieldDetection";

export default function AITable({ 
  data, 
  caption, 
  searchable = true, 
  sortable = true,
  selectable = false,
  onDataChange,
  onSelectionChange,
  cellPadding = "px-4 py-3",
  fixedWidths = {},
  isFieldDefinitionFormat = false,
  maxHeight = "600px"
}: AITableProps) {
  // Add IDs to data if they don't exist
  const processedData = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      id: item.id || index + 1
    }));
  }, [data]);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' | null }>({
    key: "",
    direction: null,
  });
  const [tableData, setTableData] = useState<DataItem[]>(processedData);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Update internal state when external data changes
  useEffect(() => {
    setTableData(processedData);
  }, [processedData]);

  // Get all column keys from the first data item
  const columns = useMemo(() => {
    if (tableData.length === 0) return [];
    return Object.keys(tableData[0]).filter(key => key !== 'id');
  }, [tableData]);
  
  const displayColumns = useMemo(() => {
    return selectable ? ['select', ...columns] : columns;
  }, [selectable, columns]);

  // Determine column types and options with enhanced detection
  const columnMeta = useMemo(() => {
    const meta: ColumnMeta = {};
    
    if (tableData.length > 0) {
      if (isFieldDefinitionFormat) {
        // Handle field definition format (label, type, default, etc.)
        tableData.forEach(field => {
          const fieldName = field.label || '';
          const fieldType = field.type || 'string';
          meta[fieldName] = { 
            type: fieldType as any,
            options: field.options
          };
        });
      } else {
        // Auto-detect types from data with enhanced detection
        const firstRow = tableData[0];
        
        Object.entries(firstRow).forEach(([key, value]) => {
          if (key === 'id') return;
          
          // Use the enhanced field detection that considers both key name and value
          meta[key] = { type: detectFieldType(key, value) };
          
          // Extract options for fields that might be select fields
          const options = extractFieldOptions(tableData, key);
          if (options.length > 0 && options.length <= 10) {
            meta[key].options = options;
            
            // If we have a small set of options, treat it as an options field
            if (options.length <= 5 && meta[key].type === 'string') {
              meta[key].type = 'options';
            }
          }
        });
      }
    }
    
    return meta;
  }, [tableData, isFieldDefinitionFormat]);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    return tableData.filter((item) => {
      if (searchTerm === "") return true;
      return Object.entries(item).some(([key, value]) => {
        if (key === 'id') return false;
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  }, [tableData, searchTerm]);

  // Sort data based on sort configuration
  const sortedData = useMemo(() => {
    let sortableData = [...filteredData];
    if (sortConfig.key && sortConfig.direction) {
      sortableData.sort((a, b) => {
        // Get the column type for proper sorting
        const columnType = columnMeta[sortConfig.key]?.type || 'string';
        
        // Handle different types of sorting
        switch (columnType) {
          case 'number':
          case 'price':
            // Convert to numbers for sorting
            const aNum = parseFloat(String(a[sortConfig.key]).replace(/[^0-9.-]+/g, ''));
            const bNum = parseFloat(String(b[sortConfig.key]).replace(/[^0-9.-]+/g, ''));
            
            if (isNaN(aNum)) return sortConfig.direction === 'ascending' ? 1 : -1;
            if (isNaN(bNum)) return sortConfig.direction === 'ascending' ? -1 : 1;
            
            return sortConfig.direction === 'ascending' ? aNum - bNum : bNum - aNum;
            
          case 'date':
          case 'datetime':
            // Convert to dates for sorting
            const aDate = new Date(a[sortConfig.key]);
            const bDate = new Date(b[sortConfig.key]);
            
            if (isNaN(aDate.getTime())) return sortConfig.direction === 'ascending' ? 1 : -1;
            if (isNaN(bDate.getTime())) return sortConfig.direction === 'ascending' ? -1 : 1;
            
            return sortConfig.direction === 'ascending' ? 
              aDate.getTime() - bDate.getTime() : 
              bDate.getTime() - aDate.getTime();
            
          case 'boolean':
            // Convert to boolean for sorting
            const aBool = typeof a[sortConfig.key] === 'boolean' ? 
              a[sortConfig.key] : 
              String(a[sortConfig.key]).toLowerCase() === 'true';
            const bBool = typeof b[sortConfig.key] === 'boolean' ? 
              b[sortConfig.key] : 
              String(b[sortConfig.key]).toLowerCase() === 'true';
            
            if (aBool === bBool) return 0;
            return sortConfig.direction === 'ascending' ? 
              (aBool ? 1 : -1) : 
              (aBool ? -1 : 1);
            
          default:
            // Default string comparison
            const aStr = String(a[sortConfig.key] || '').toLowerCase();
            const bStr = String(b[sortConfig.key] || '').toLowerCase();
            
            if (aStr < bStr) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (aStr > bStr) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        }
      });
    }
    return sortableData;
  }, [filteredData, sortConfig, columnMeta]);

  // Handle sort request
  const requestSort = (key: string) => {
    if (!sortable || key === 'select') return;
    
    let direction: 'ascending' | 'descending' | null = 'ascending';
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'ascending') {
        direction = 'descending';
      } else if (sortConfig.direction === 'descending') {
        direction = null;
      }
    }
    setSortConfig({ key, direction });
  };

  // Get sort icon based on current sort state
  const getSortIcon = (key: string) => {
    if (!sortable || key === 'select') return null;
    
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'ascending') {
        return <FaSortUp className="inline ml-1" />;
      } else if (sortConfig.direction === 'descending') {
        return <FaSortDown className="inline ml-1" />;
      }
    }
    return <FaSort className="inline ml-1 opacity-30" />;
  };

  // Handle cell value change
  const handleCellChange = (rowIndex: number, column: string, value: any) => {
    const newData = [...tableData];
    const dataIndex = sortedData[rowIndex] ? tableData.findIndex(item => 
      item.id === sortedData[rowIndex].id
    ) : -1;
    
    if (dataIndex !== -1) {
      newData[dataIndex] = {
        ...newData[dataIndex],
        [column]: value
      };
      
      setTableData(newData);
      
      // Notify parent component if callback provided
      if (onDataChange) {
        onDataChange(newData);
      }
    }
  };

  // Handle row selection
  const handleRowSelect = (id: number) => {
    let newSelectedRows: number[];
    
    if (selectedRows.includes(id)) {
      newSelectedRows = selectedRows.filter(rowId => rowId !== id);
    } else {
      newSelectedRows = [...selectedRows, id];
    }
    
    setSelectedRows(newSelectedRows);
    
    // Update select all state
    setSelectAll(newSelectedRows.length === sortedData.length);
    
    // Notify parent component
    if (onSelectionChange) {
      onSelectionChange(newSelectedRows);
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    let newSelectedRows: number[];
    
    if (!selectAll) {
      // Select all visible rows
      newSelectedRows = sortedData.map(row => row.id || 0);
    } else {
      // Deselect all
      newSelectedRows = [];
    }
    
    setSelectedRows(newSelectedRows);
    setSelectAll(!selectAll);
    
    // Notify parent component
    if (onSelectionChange) {
      onSelectionChange(newSelectedRows);
    }
  };

  return (
    <div className="w-full">
      {searchable && (
        <div className="mb-4 relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            className="bg-card/50 border border-border rounded-lg pl-10 p-2.5 w-full focus:ring-primary focus:border-primary"
            placeholder="Search in table..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}
      
      <div className="backdrop-blur-sm bg-card/30 rounded-xl border border-border p-4 w-full">
        <div className="overflow-auto" style={{ maxHeight }}>
          <Table className="w-full relative">
            {caption && <TableCaption>{caption}</TableCaption>}
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow className="w-full">
                {displayColumns.map((column) => (
                  <TableHead 
                    key={column}
                    onClick={() => column === 'select' ? handleSelectAll() : requestSort(column)}
                    className={column !== 'select' && sortable ? "cursor-pointer hover:bg-[#323545] transition-colors" : ""}
                    style={getColumnWidth(column, columnMeta, fixedWidths)}
                  >
                    {column === 'select' ? (
                      <div className="flex justify-center">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={handleSelectAll}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </div>
                    ) : (
                      <>
                        {formatColumnHeader(column)}
                        {getSortIcon(column)}
                      </>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.length > 0 ? (
                sortedData.map((item, rowIndex) => (
                  <TableRow 
                    key={item.id} 
                    className={`w-full ${selectedRows.includes(item.id || 0) ? 'bg-primary/10' : ''}`}
                  >
                    {displayColumns.map((column) => (
                      <TableCell 
                        key={`${item.id}-${column}`} 
                        className="p-0"
                        style={getColumnWidth(column, columnMeta, fixedWidths)}
                      >
                        {column === 'select' ? (
                          <div className="flex justify-center items-center h-full">
                            <input
                              type="checkbox"
                              checked={selectedRows.includes(item.id || 0)}
                              onChange={() => handleRowSelect(item.id || 0)}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                          </div>
                        ) : (
                          <EditableCell 
                            value={item[column]} 
                            row={rowIndex} 
                            column={column}
                            columnType={columnMeta[column]?.type || 'string'}
                            options={columnMeta[column]?.options}
                            onSave={handleCellChange}
                            padding={cellPadding}
                          />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={displayColumns.length} className="text-center py-8">
                    No data found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="text-sm text-muted-foreground mt-2 flex justify-between items-center">
        <span>Showing {sortedData.length} of {tableData.length} entries</span>
        {selectedRows.length > 0 && (
          <span className="text-primary font-medium">{selectedRows.length} selected</span>
        )}
      </div>
    </div>
  );
}