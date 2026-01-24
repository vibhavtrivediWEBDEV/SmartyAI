import type { Viewport } from "next"
import {TerminalUI} from "../../components/terminal/terminalUI"
import { Terminal } from "lucide-react"
export const viewport: Viewport = {
  themeColor: "black",
}

export default function Page() {
  return (
    <div className="flex min-h-screen bg-red-500 h-full items-center justify-center bg-gray-950 p-">
      <TerminalUI /> 
    </div>
  )
}
