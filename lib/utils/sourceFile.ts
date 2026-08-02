const SOURCE_EXTENSIONS = new Set([
  "html", "htm", "css", "scss", "sass", "less",
  "js", "jsx", "mjs", "cjs", "ts", "tsx",
  "json", "xml", "yaml", "yml", "md", "txt", "csv",
  "py", "java", "c", "cpp", "cc", "cxx", "h", "hpp",
  "go", "rs", "php", "rb", "swift", "kt", "kts", "scala",
  "sql", "sh", "bash", "zsh", "env", "toml", "ini", "gradle",
  "dockerfile", "makefile",
]);

const SOURCE_MIME_TYPES = new Set([
  "application/json",
  "application/ld+json",
  "application/javascript",
  "application/x-javascript",
  "application/typescript",
  "application/xml",
  "application/xhtml+xml",
  "application/x-httpd-php",
  "application/x-sh",
]);

export function sourceExtension(filename: string): string {
  const basename = filename.toLowerCase().split("/").pop() || "";
  if (!basename.includes(".")) return basename;
  return basename.split(".").pop() || "";
}

export function isSourceFile(filename: string, mimeType = ""): boolean {
  return mimeType.toLowerCase().startsWith("text/")
    || SOURCE_MIME_TYPES.has(mimeType.toLowerCase())
    || SOURCE_EXTENSIONS.has(sourceExtension(filename));
}
