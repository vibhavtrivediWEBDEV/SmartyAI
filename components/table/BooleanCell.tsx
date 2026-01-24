import React from "react";

interface BooleanCellProps {
  value: boolean | string;
  onChange: (value: boolean) => void;
}

const BooleanCell: React.FC<BooleanCellProps> = ({ value, onChange }) => {
  const boolValue = typeof value === 'string' ? value.toLowerCase() === 'true' : !!value;
  
  return (
    <div className="flex justify-center items-center h-full">
      <input
        type="checkbox"
        checked={boolValue}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
      />
    </div>
  );
};

export default BooleanCell;