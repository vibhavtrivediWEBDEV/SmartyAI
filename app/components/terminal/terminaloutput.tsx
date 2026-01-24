interface TerminalOutputProps {
    history: Array<{ type: "input" | "output"; value: string | JSX.Element }>
  }
  
  export function TerminalOutput({ history }: TerminalOutputProps) {
    return (
      <div className="flex-1 overflow-y-auto p-4 text-sm">
        {history.map((entry, index) => (
          <div key={index} className="mb-1">
            {entry.type === "input" ? (
              <div className="text-green-400 font-mono">
                <span className="whitespace-nowrap">vibhav@MacBook-Pro ~ %   </span> {entry.value}
              </div>
            ) : (
              <div className="text-gray-300 font-mono">{entry.value}</div>
            )}
          </div>
        ))}
      </div>
    )
  }
  