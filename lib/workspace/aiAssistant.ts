export type CodingAssistantAction = 'explain' | 'fix' | 'generate';

interface CodingAssistantRequest {
  action: CodingAssistantAction;
  path: string;
  language: string;
  code: string;
  instruction?: string;
}

export function buildCodingAssistantPrompt(request: CodingAssistantRequest): string {
  const task = request.action === 'explain'
    ? 'Explain the code clearly, identify important behavior, and mention any correctness or performance risks.'
    : request.action === 'fix'
      ? 'Fix bugs, correctness issues, and obvious performance problems while preserving intended behavior.'
      : `Generate code that satisfies this instruction: ${request.instruction || 'Complete the implementation.'}`;

  const outputRule = request.action === 'explain'
    ? 'Return concise Markdown. Do not repeat the full source code.'
    : 'Return a short summary followed by the complete replacement code in one fenced code block. Do not omit unchanged required code.';

  return `You are the coding assistant inside a VS Code-style editor.
File: ${request.path}
Language: ${request.language}
Action: ${request.action}

${task}
${outputRule}

Source:
\`\`\`${request.language}
${request.code}
\`\`\``;
}

export function parseCodingAssistantResponse(
  content: string,
  action: CodingAssistantAction
): { summary: string; code?: string } {
  if (action === 'explain') return { summary: content.trim() };

  const fencedCode = content.match(/```(?:[\w+-]+)?\s*\n([\s\S]*?)```/);
  if (!fencedCode) {
    return { summary: 'AI generated a code update.', code: content.trim() };
  }

  const summary = content
    .slice(0, fencedCode.index)
    .replace(/^\s*(summary\s*:)?\s*/i, '')
    .trim();

  return {
    summary: summary || 'AI generated a code update.',
    code: fencedCode[1].trimEnd(),
  };
}