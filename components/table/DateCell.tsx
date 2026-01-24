import React from "react";

interface DateCellProps {
  value: string;
  onChange: (value: string) => void;
}

const DateCell: React.FC<DateCellProps> = ({ value, onChange }) => {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-full p-2 border-2 border-primary rounded bg-background"
    />
  );
};

export default DateCell;