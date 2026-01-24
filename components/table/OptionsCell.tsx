import React from "react";

interface OptionsCellProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

const OptionsCell: React.FC<OptionsCellProps> = ({ value, options, onChange }) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-full p-2 border-2 border-primary rounded bg-background"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
};

export default OptionsCell;