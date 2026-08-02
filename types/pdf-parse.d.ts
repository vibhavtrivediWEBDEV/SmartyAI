declare module "pdf-parse" {
  interface PdfParseResult {
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: unknown;
    text: string;
    version: string;
  }

  function pdfParse(data: Buffer): Promise<PdfParseResult>;
  export = pdfParse;
}

declare module "pdf-parse/lib/pdf-parse.js" {
  interface PdfParseResult {
    text: string;
  }

  function pdfParse(data: Buffer): Promise<PdfParseResult>;
  export = pdfParse;
}

declare module "pdfjs-dist/legacy/build/pdf.worker.js" {
  const worker: { WorkerMessageHandler: unknown };
  export = worker;
}
