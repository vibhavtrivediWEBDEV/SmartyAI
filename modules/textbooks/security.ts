const APPROVED_TEXTBOOK_HOSTS = new Set(["ncert.nic.in", "epathshala.nic.in"]);

export function assertApprovedTextbookUrl(rawUrl: string): URL {
  const url = new URL(rawUrl);
  if (url.protocol !== "https:" || !APPROVED_TEXTBOOK_HOSTS.has(url.hostname) || url.username || url.password || url.port) {
    throw new Error("Textbook source is not approved.");
  }
  if (url.hostname === "ncert.nic.in" && !url.pathname.startsWith("/textbook/")) throw new Error("Unexpected NCERT source path.");
  return url;
}