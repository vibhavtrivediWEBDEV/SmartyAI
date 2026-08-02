import { getDatabase } from "@/lib/db/mongodb";

export type TextbookPageDocument = { editionId: string; pdfHash: string; pdfPage: number; text: string; sourceUrl: string; pageCount: number; createdAt: Date; updatedAt: Date };

let indexes: Promise<unknown> | null = null;
async function pages() {
  const collection = (await getDatabase()).collection<TextbookPageDocument>("textbookPages");
  indexes ??= Promise.all([
    collection.createIndex({ editionId: 1, pdfPage: 1 }, { unique: true, name: "textbook_edition_page_unique" }),
    collection.createIndex({ pdfHash: 1, pdfPage: 1 }, { name: "textbook_hash_page" }),
  ]);
  await indexes;
  return collection;
}

export async function findCachedPage(editionId: string, pdfPage: number) {
  return (await pages()).findOne({ editionId, pdfPage });
}

export async function findRelevantCachedPage(editionId: string, terms: string[]) {
  const escaped = terms.filter(Boolean).map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!escaped.length) return null;
  return (await pages()).findOne({ editionId, $and: escaped.map((term) => ({ text: { $regex: term, $options: "i" } })) });
}

export async function cacheTextbookPages(documents: TextbookPageDocument[]) {
  if (!documents.length) return;
  const collection = await pages();
  await collection.bulkWrite(documents.map((document) => ({
    updateOne: { filter: { editionId: document.editionId, pdfPage: document.pdfPage }, update: { $set: document }, upsert: true },
  })), { ordered: false });
}