import { commands } from "@/lib/commands";
import type { JSX } from "react/jsx-runtime";

interface HistoryEntry {
  type: "input" | "output";
  value: string | JSX.Element;
}

interface CommandHandlerArgs {
  command: string;
  setHistory: React.Dispatch<React.SetStateAction<HistoryEntry[]>>;
  setCurrentInput: React.Dispatch<React.SetStateAction<string>>;
}

export async function executeCommand({
  command,
  setHistory,
  setCurrentInput,
}: CommandHandlerArgs) {
  const trimmedCommand = command.trim();
  let output: string | JSX.Element = "";

  const [baseCommand, ...args] = trimmedCommand.toLowerCase().split(" ");

  switch (baseCommand) {
    case "name":
      output = commands.name;
      break;
    case "title":
      output = commands.title;
      break;
    case "skills":
      output = commands.skills;
      break;
    case "projects":
      output = (
        <ul className="list-disc list-inside">
          {commands.projects.map((project, index) => (
            <li key={index}>
              <span className="font-bold">{project.title}:</span>{" "}
              {project.description}
            </li>
          ))}
        </ul>
      );
      break;
    case "contact":
      output = (
        <div>
          Email:{" "}
          <a
            href={`mailto:${commands.contact.email}`}
            className="underline text-blue-400"
          >
            {commands.contact.email}
          </a>
          <br />
          GitHub:{" "}
          <a
            href={commands.contact.github}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-400"
          >
            {commands.contact.github}
          </a>
        </div>
      );
      break;
    case "about":
      const subCommand = args[0];
      switch (subCommand) {
        case "name":
          output = commands.name;
          break;
        case "title":
          output = commands.title;
          break;
        case "skills":
          output = commands.skills;
          break;
        case "projects":
          output = (
            <ul className="list-disc list-inside">
              {commands.projects.map((project, index) => (
                <li key={index}>
                  <span className="font-bold">{project.title}:</span>{" "}
                  {project.description}
                </li>
              ))}
            </ul>
          );
          break;
        case "contact":
          output = (
            <div>
              Email:{" "}
              <a
                href={`mailto:${commands.contact.email}`}
                className="underline text-blue-400"
              >
                {commands.contact.email}
              </a>
              <br />
              GitHub:{" "}
              <a
                href={commands.contact.github}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-400"
              >
                {commands.contact.github}
              </a>
            </div>
          );
          break;
        default:
          output = `Invalid 'about' subcommand. Available: name, title, skills, projects, contact.`;
          break;
      }
      break;
    case "clear":
      setHistory([]);
      setCurrentInput(""); // Clear input immediately for clear command
      return; // Exit early as history is cleared
    case "help":
      output = (
        <div>
          <p className="mb-1">Available commands:</p>
          <ul className="list-disc list-inside">
            <li>
              <span className="font-bold">name</span>: Displays my name.
            </li>
            <li>
              <span className="font-bold">title</span>: Displays my professional title.
            </li>
            <li>
              <span className="font-bold">skills</span>: Lists my technical skills.
            </li>
            <li>
              <span className="font-bold">projects</span>: Shows a list of my projects.
            </li>
            <li>
              <span className="font-bold">contact</span>: Provides my contact information.
            </li>
            <li>
              <span className="font-bold">about [subcommand]</span>: Get information about Vibhav Trivedi.
              <ul className="list-circle list-inside ml-4">
                <li>
                  <span className="font-bold">name</span>: Displays my name.
                </li>
                <li>
                  <span className="font-bold">title</span>: Displays my professional title.
                </li>
                <li>
                  <span className="font-bold">skills</span>: Lists my technical skills.
                </li>
                <li>
                  <span className="font-bold">projects</span>: Shows a list of my projects.
                </li>
                <li>
                  <span className="font-bold">contact</span>: Provides my contact information.
                </li>
              </ul>
            </li>
            <li>
              <span className="font-bold">clear</span>: Clears the terminal screen.
            </li>
            <li>
              <span className="font-bold">help</span>: Displays this help message.
            </li>
          </ul>
        </div>
      );
      break;
    default:
      // Handle API call for unknown commands
      try {
        setHistory((prev) => [
          ...prev,
          { type: "output", value: "Thinking..." },
        ]);
        const response = await fetch("/api/terminalAI", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            messages: [{ type: "input", value: trimmedCommand }] 
          }),
        });

        const data = await response.json();
        console.log("data",data)

        if (data.success) {
          output = data.response;
        } else {
          output = `Error: ${data.error || "Failed to generate response."}`;
        }
      } catch (apiError: any) {
        console.error("API call error:", apiError);
        output = `Error communicating with AI: ${apiError.message || String(apiError)}`;
      }
      // Remove "Thinking..." message before adding actual output
      setHistory((prev) => prev.filter((entry) => entry.value !== "Thinking..."));
      break;
  }
  setHistory((prev) => [...prev, { type: "output", value: output }]);
  setCurrentInput("");
} 