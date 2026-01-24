"use client"
import React, { useState, useRef, useEffect, useMemo } from "react";
import { FaCheck, FaTimes } from "react-icons/fa";
import { EditableCellProps } from "@/types/table";
import BooleanCell from "./BooleanCell";
import DateCell from "./DateCell";
import OptionsCell from "./OptionsCell";

const EditableCell: React.FC<EditableCellProps> = ({ 
  value, 
  row, 
  column, 
  columnType, 
  onSave,
  padding = "p-2",
  options = []
}) => {
  const [editing, setEditing] = useState(false);
  const [cellValue, setCellValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Always declare all hooks, regardless of rendering path
  const [boolValue, setBoolValue] = useState(
    typeof value === 'string' ? value.toLowerCase() === 'true' : !!value
  );

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  // Update cell value when external value changes
  useEffect(() => {
    setCellValue(value);
    setBoolValue(typeof value === 'string' ? value.toLowerCase() === 'true' : !!value);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditing(false);
      setCellValue(value);
    }
  };

  const handleSave = () => {
    // Validate input based on column type
    let validatedValue = cellValue;
    
    if (columnType === 'number') {
      const num = Number(cellValue);
      if (isNaN(num)) {
        // Reset to original value if invalid
        setCellValue(value);
        setEditing(false);
        return;
      }
      validatedValue = num;
    } else if (columnType === 'price' && typeof cellValue === 'string') {
      if (!cellValue.startsWith('$')) {
        validatedValue = `$${cellValue}`;
      }
    } else if (columnType === 'boolean' && typeof cellValue === 'string') {
      validatedValue = cellValue.toLowerCase() === 'true';
    }
    
    onSave(row, column, validatedValue);
    setEditing(false);
  };

  const getInputType = () => {
    switch (columnType) {
      case 'number': return 'number';
      case 'date': return 'date';
      default: return 'text';
    }
  };

  // Format display value based on type
  const displayValue = useMemo(() => {
    if (columnType === 'boolean') {
      return boolValue ? '✓' : '✗';
    }
    return value;
  }, [value, columnType, boolValue]);

  // Render content based on editing state
  const renderEditContent = () => {
    if (columnType === 'boolean') {
      return (
        <BooleanCell 
          value={cellValue} 
          onChange={(newValue) => {
            setCellValue(newValue);
            onSave(row, column, newValue);
            setEditing(false);
          }} 
        />
      );
    }
    
    if (columnType === 'date') {
      return (
        <DateCell 
          value={cellValue} 
          onChange={(newValue) => {
            setCellValue(newValue);
            onSave(row, column, newValue);
            setEditing(false);
          }} 
        />
      );
    }
    
    if (columnType === 'options' && options.length > 0) {
      return (
        <OptionsCell 
          value={cellValue} 
          options={options}
          onChange={(newValue) => {
            setCellValue(newValue);
            onSave(row, column, newValue);
            setEditing(false);
          }} 
        />
      );
    }
    
    return (
      <div className="relative flex items-center h-full w-full">
        <input
          ref={inputRef}
          type={getInputType()}
          value={cellValue}
          onChange={(e) => setCellValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="w-full h-full p-2 border-2 border-primary rounded bg-background"
        />
        <div className="absolute right-2 flex space-x-1">
          <button onClick={handleSave} className="text-green-500 hover:text-green-700">
            <FaCheck size={12} />
          </button>
          <button 
            onClick={() => {
              setEditing(false);
              setCellValue(value);
            }} 
            className="text-red-500 hover:text-red-700"
          >
            <FaTimes size={12} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div 
      onClick={() => setEditing(true)}
      className={`w-full h-full cursor-pointer hover:bg-muted/30 rounded transition-colors ${padding}`}
    >
      {editing ? renderEditContent() : displayValue}
    </div>
  );
};

export default EditableCell;