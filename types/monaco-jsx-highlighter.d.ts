declare module 'monaco-jsx-highlighter' {
  export function makeBabelParse(parse: unknown, enableTsxHighlight?: boolean): unknown;

  export default class MonacoJSXHighlighter {
    constructor(monaco: unknown, parse: unknown, traverse: unknown, editor: unknown);
    highlightOnDidChangeModelContent(
      debounceTime?: number,
      afterHighlight?: unknown,
      onHighlightError?: unknown,
      getAstPromise?: unknown,
      onParseAstError?: unknown
    ): () => void;
  }
}