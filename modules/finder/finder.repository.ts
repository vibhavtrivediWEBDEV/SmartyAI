import { ObjectId, type Collection } from "mongodb";

import { getDatabase } from "@/lib/db/mongodb";
import type { FileNodeDocument } from "@/modules/storage/storage.repository";
import type { ResumeProfileData } from "@/modules/users/user.repository";

export type FinderNode = FileNodeDocument & { _id: ObjectId };

export interface SerializedFinderNode {
  id: string;
  name: string;
  type: string;
  kind: FileNodeDocument["kind"];
  parentId: string | null;
  size: string | null;
  sizeBytes: number;
  mimeType: string | null;
  content?: string;
  src?: string;
  url?: string;
  isStarred: boolean;
  showOnDesktop: boolean;
  isTrashed: boolean;
  createdAt: string;
  updatedAt: string;
  files: SerializedFinderNode[];
}

const TEXT_EXTENSIONS = new Set(["txt", "md", "json", "js", "ts", "jsx", "tsx", "html", "css", "py", "csv", "xml", "yaml", "yml"]);

async function nodes(): Promise<Collection<FileNodeDocument>> {
  const collection = (await getDatabase()).collection<FileNodeDocument>("fileNodes");
  await collection.createIndex({ ownerId: 1, parentId: 1, isTrashed: 1, name: 1 }, { name: "finder_directory_listing" });
  return collection;
}

function objectId(value?: string | null): ObjectId | null {
  return value && ObjectId.isValid(value) ? new ObjectId(value) : null;
}

function extension(name: string) {
  return name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
}

export function inferFinderType(node: Pick<FileNodeDocument, "kind" | "name" | "mimeType">) {
  if (node.kind === "folder") return "folder";
  if (node.kind === "link") return "link";
  const ext = extension(node.name);
  if (node.mimeType?.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp"].includes(ext)) return "image";
  if (node.mimeType?.startsWith("video/") || ["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) return "video";
  if (["xlsx", "xls", "csv", "ods"].includes(ext)) return "spreadsheet";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "archive";
  if (["js", "ts", "jsx", "tsx", "html", "css", "py", "java", "cpp", "json"].includes(ext)) return "code";
  if (["txt", "md", "doc", "docx", "pdf"].includes(ext) || node.kind === "text") return "document";
  return "other";
}

export function serializeFinderNode(node: FinderNode, children: FinderNode[] = []): SerializedFinderNode {
  return {
    id: node._id.toHexString(),
    name: node.name,
    type: inferFinderType(node),
    kind: node.kind,
    parentId: node.parentId?.toHexString() ?? null,
    size: node.sizeBytes ? `${(node.sizeBytes / 1024).toFixed(node.sizeBytes >= 1024 * 1024 ? 0 : 1)} KB` : null,
    sizeBytes: node.sizeBytes,
    mimeType: node.mimeType ?? null,
    content: node.content,
    src: node.storageKey ? `/api/Projects/${node._id.toHexString()}/download` : node.secureUrl,
    url: node.url,
    isStarred: node.isStarred,
    showOnDesktop: node.showOnDesktop ?? false,
    isTrashed: node.isTrashed,
    createdAt: node.createdAt.toISOString(),
    updatedAt: node.updatedAt.toISOString(),
    files: children.map((child) => serializeFinderNode(child)),
  };
}

export async function listFinderNodes(userId: string, includeTrash = false) {
  const collection = await nodes();
  const all = await collection
    .find({ ownerId: new ObjectId(userId), ...(includeTrash ? { isTrashed: true } : { isTrashed: false }) })
    .sort({ name: 1 })
    .toArray();
  const byParent = new Map<string, FinderNode[]>();
  for (const node of all) {
    const key = node.parentId?.toHexString() ?? "root";
    const siblings = byParent.get(key) ?? [];
    siblings.push(node);
    byParent.set(key, siblings);
  }
  return all.map((node) => serializeFinderNode(node, byParent.get(node._id.toHexString()) ?? []));
}

export async function ensureSystemFinderNodes(userId: string) {
  const collection = await nodes();
  const now = new Date();
  await collection.updateOne(
    { ownerId: new ObjectId(userId), legacyId: "system:dont-look" },
    {
      $setOnInsert: {
        ownerId: new ObjectId(userId),
        parentId: null,
        name: "Don't Look",
        kind: "folder",
        sizeBytes: 0,
        legacyId: "system:dont-look",
        migrationSource: "system",
        isStarred: false,
        showOnDesktop: false,
        isTrashed: false,
        createdAt: now,
        updatedAt: now,
      },
    },
    { upsert: true },
  );
}

export async function getFinderNode(userId: string, id: string): Promise<FinderNode | null> {
  if (!ObjectId.isValid(id)) return null;
  return (await nodes()).findOne({ _id: new ObjectId(id), ownerId: new ObjectId(userId), isTrashed: false });
}

export async function createFinderNode(userId: string, input: {
  name: string;
  type?: string;
  parentId?: string | null;
  content?: string;
  url?: string;
}) {
  const now = new Date();
  const ext = extension(input.name);
  const kind: FileNodeDocument["kind"] = input.type === "folder"
    ? "folder"
    : input.type === "link"
      ? "link"
      : TEXT_EXTENSIONS.has(ext) || typeof input.content === "string"
        ? "text"
        : "file";
  const document: FileNodeDocument = {
    ownerId: new ObjectId(userId),
    parentId: objectId(input.parentId),
    name: input.name.trim(),
    kind,
    mimeType: kind === "text" ? "text/plain" : undefined,
    sizeBytes: Buffer.byteLength(input.content ?? "", "utf8"),
    content: input.content,
    url: input.url,
    isStarred: false,
    showOnDesktop: false,
    isTrashed: false,
    createdAt: now,
    updatedAt: now,
  };
  const collection = await nodes();
  const result = await collection.insertOne(document);
  return serializeFinderNode({ ...document, _id: result.insertedId });
}

export async function updateFinderNode(userId: string, id: string, update: {
  name?: string;
  parentId?: string | null;
  content?: string;
  isStarred?: boolean;
  showOnDesktop?: boolean;
}) {
  if (!ObjectId.isValid(id)) return null;
  const collection = await nodes();
  const nodeId = new ObjectId(id);
  const ownerId = new ObjectId(userId);
  const current = await collection.findOne({ _id: nodeId, ownerId, isTrashed: false });
  if (!current) return null;

  if (update.parentId !== undefined) {
    const newParent = objectId(update.parentId);
    if (newParent?.equals(nodeId)) throw new Error("A folder cannot contain itself");
    if (newParent) {
      let cursor = await collection.findOne({ _id: newParent, ownerId, kind: "folder", isTrashed: false });
      if (!cursor) throw new Error("Target folder not found");
      while (cursor.parentId) {
        if (cursor.parentId.equals(nodeId)) throw new Error("A folder cannot be moved into its descendant");
        cursor = await collection.findOne({ _id: cursor.parentId, ownerId, kind: "folder", isTrashed: false });
        if (!cursor) break;
      }
    }
  }

  const set: Partial<FileNodeDocument> = { updatedAt: new Date() };
  if (update.name !== undefined) set.name = update.name.trim();
  if (update.parentId !== undefined) set.parentId = objectId(update.parentId);
  if (update.content !== undefined) {
    set.content = update.content;
    set.sizeBytes = Buffer.byteLength(update.content, "utf8");
  }
  if (update.isStarred !== undefined) set.isStarred = update.isStarred;
  if (update.showOnDesktop !== undefined) set.showOnDesktop = update.showOnDesktop;
  const updated = await collection.findOneAndUpdate({ _id: nodeId, ownerId }, { $set: set }, { returnDocument: "after" });
  return updated ? serializeFinderNode(updated) : null;
}

export async function replaceFinderAsset(userId: string, id: string, input: {
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  secureUrl: string;
  resourceType: "image" | "video" | "raw";
  reservedBytes: number;
}) {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDatabase();
  const ownerId = new ObjectId(userId);
  const nodeId = new ObjectId(id);
  const collection = await nodes();
  const previous = await collection.findOne({ _id: nodeId, ownerId, isTrashed: false });
  if (!previous || previous.kind === "folder") return null;

  const updated = await collection.findOneAndUpdate(
    { _id: nodeId, ownerId },
    {
      $set: {
        kind: "file",
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        storageProvider: "cloudinary",
        storageKey: input.storageKey,
        secureUrl: input.secureUrl,
        resourceType: input.resourceType,
        updatedAt: new Date(),
      },
      $unset: { content: "" },
    },
    { returnDocument: "after" },
  );
  if (!updated) return null;

  await db.collection("storageUsage").updateOne(
    { userId: ownerId },
    {
      $inc: {
        fileBytesUsed: input.sizeBytes - previous.sizeBytes,
        fileBytesReserved: -input.reservedBytes,
      },
      $set: { updatedAt: new Date() },
    },
    { upsert: true },
  );
  return { item: serializeFinderNode(updated), previousStorageKey: previous.storageKey, previousResourceType: previous.resourceType };
}

async function descendantIds(collection: Collection<FileNodeDocument>, ownerId: ObjectId, roots: ObjectId[]) {
  const collected = [...roots];
  let frontier = [...roots];
  while (frontier.length) {
    const children = await collection.find({ ownerId, parentId: { $in: frontier } }).project({ _id: 1 }).toArray();
    frontier = children.map((child) => child._id);
    collected.push(...frontier);
  }
  return collected;
}

export async function trashFinderNodes(userId: string, ids: string[]) {
  const collection = await nodes();
  const ownerId = new ObjectId(userId);
  const roots = ids.filter(ObjectId.isValid).map((id) => new ObjectId(id));
  const allIds = await descendantIds(collection, ownerId, roots);
  await collection.updateMany({ ownerId, _id: { $in: allIds } }, { $set: { isTrashed: true, updatedAt: new Date() } });
  return allIds.length;
}

function copyName(name: string) {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? `${name.slice(0, dot)} copy${name.slice(dot)}` : `${name} copy`;
}

export async function copyFinderNodes(userId: string, sourceIds: string[], targetParentId?: string | null) {
  const collection = await nodes();
  const ownerId = new ObjectId(userId);
  const copiedRoots: SerializedFinderNode[] = [];

  const clone = async (source: FinderNode, parentId: ObjectId | null, rename: boolean) => {
    const { _id: _ignored, ...rest } = source;
    const document: FileNodeDocument = {
      ...rest,
      ownerId,
      parentId,
      name: rename ? copyName(source.name) : source.name,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await collection.insertOne(document);
    const children = await collection.find({ ownerId, parentId: source._id, isTrashed: false }).toArray();
    for (const child of children) await clone(child, result.insertedId, false);
    return { ...document, _id: result.insertedId };
  };

  for (const id of sourceIds) {
    if (!ObjectId.isValid(id)) continue;
    const source = await collection.findOne({ _id: new ObjectId(id), ownerId, isTrashed: false });
    if (!source) continue;
    const copied = await clone(source, objectId(targetParentId), true);
    copiedRoots.push(serializeFinderNode(copied));
  }
  return copiedRoots;
}

export async function getCopiedTextBytes(userId: string, sourceIds: string[]): Promise<number> {
  const collection = await nodes();
  const ownerId = new ObjectId(userId);
  const roots = sourceIds.filter(ObjectId.isValid).map((id) => new ObjectId(id));
  if (!roots.length) return 0;
  const ids = await descendantIds(collection, ownerId, roots);
  const result = await collection.aggregate<{ bytes: number }>([
    { $match: { ownerId, _id: { $in: ids }, kind: "text", isTrashed: false } },
    { $group: { _id: null, bytes: { $sum: "$sizeBytes" } } },
  ]).next();
  return result?.bytes ?? 0;
}

interface GitHubRepositoryProfile {
  name: string;
  html_url: string;
  description?: string | null;
  language?: string | null;
  stargazers_count?: number;
}

export async function syncResumeProfileToFinder(
  userId: string,
  profile: ResumeProfileData,
  repositories: GitHubRepositoryProfile[] = [],
) {
  const collection = await nodes();
  const ownerId = new ObjectId(userId);
  const previous = await collection.find({ ownerId, migrationSource: "resume" }).toArray();
  const desktopPreferences = new Map(previous.map((node) => [node.legacyId, node.showOnDesktop ?? false]));
  await collection.deleteMany({ ownerId, migrationSource: "resume" });

  const insert = async (input: {
    legacyId: string;
    name: string;
    kind: FileNodeDocument["kind"];
    parentId?: ObjectId | null;
    content?: string;
    url?: string;
    showOnDesktop?: boolean;
  }) => {
    const now = new Date();
    const document: FileNodeDocument = {
      ownerId,
      parentId: input.parentId ?? null,
      name: input.name,
      kind: input.kind,
      mimeType: input.kind === "text" ? "text/markdown" : undefined,
      sizeBytes: Buffer.byteLength(input.content ?? "", "utf8"),
      content: input.content,
      url: input.url,
      legacyId: input.legacyId,
      migrationSource: "resume",
      isStarred: false,
      showOnDesktop: desktopPreferences.get(input.legacyId) ?? input.showOnDesktop ?? false,
      isTrashed: false,
      createdAt: now,
      updatedAt: now,
    };
    const result = await collection.insertOne(document);
    return result.insertedId;
  };

  const resumeFolder = await insert({ legacyId: "resume:root", name: "Resume", kind: "folder", showOnDesktop: true });
  await insert({ legacyId: "resume:file", name: "Resume.pdf", kind: "link", parentId: resumeFolder, url: "/api/profile/resume/file" });

  const aboutFolder = await insert({ legacyId: "profile:root", name: "About Me", kind: "folder", showOnDesktop: true });
  const contact = [
    profile.name ? `Name: ${profile.name}` : "",
    profile.email ? `Email: ${profile.email}` : "",
    profile.phone ? `Phone: ${profile.phone}` : "",
    profile.location ? `Location: ${profile.location}` : "",
  ].filter(Boolean).join("\n");
  const sections = [
    ["contact", "Contact.md", contact],
    ["about", "About.md", profile.about],
    ["experience", "Experience.md", profile.experience.map((item) => `- ${item}`).join("\n")],
    ["companies", "Companies.md", (profile.companies ?? []).map((item) => `- ${item}`).join("\n")],
    ["education", "Education.md", profile.education.map((item) => `- ${item}`).join("\n")],
    ["skills", "Skills.md", profile.skills.map((item) => `- ${item}`).join("\n")],
    ["achievements", "Achievements.md", (profile.achievements ?? []).map((item) => `- ${item}`).join("\n")],
    ["certifications", "Certifications.md", (profile.certifications ?? []).map((item) => `- ${item}`).join("\n")],
    ["languages", "Languages.md", (profile.languages ?? []).map((item) => `- ${item}`).join("\n")],
    ["interests", "Interests.md", profile.interests.map((item) => `- ${item}`).join("\n")],
    ["goals", "Goals.md", profile.goals.map((item) => `- ${item}`).join("\n")],
  ] as const;
  for (const [key, name, content] of sections) {
    if (content.trim()) await insert({ legacyId: `profile:${key}`, name, kind: "text", parentId: aboutFolder, content });
  }

  const socialFolder = await insert({ legacyId: "profile:social", name: "Social Links", kind: "folder", parentId: aboutFolder });
  for (const [index, link] of [...profile.socialLinks, ...profile.externalLinks].entries()) {
    await insert({
      legacyId: `profile:link:${index}`,
      name: link.platform || `Link ${index + 1}`,
      kind: "link",
      parentId: socialFolder,
      url: link.url,
    });
  }

  const projectsFolder = await insert({ legacyId: "projects:root", name: "Projects", kind: "folder", showOnDesktop: true });
  for (const [index, project] of profile.projects.entries()) {
    const projectFolder = await insert({ legacyId: `project:${index}`, name: project.name || `Project ${index + 1}`, kind: "folder", parentId: projectsFolder });
    const details = [project.description, project.technologies.length ? `\nTechnologies: ${project.technologies.join(", ")}` : ""].join("\n").trim();
    if (details) await insert({ legacyId: `project:${index}:readme`, name: "README.md", kind: "text", parentId: projectFolder, content: details });
    for (const [linkIndex, url] of project.links.entries()) {
      await insert({ legacyId: `project:${index}:link:${linkIndex}`, name: `Project Link ${linkIndex + 1}`, kind: "link", parentId: projectFolder, url });
    }
  }

  if (profile.githubUsername) {
    const githubFolder = await insert({ legacyId: "github:root", name: `GitHub — ${profile.githubUsername}`, kind: "folder" });
    for (const repository of repositories) {
      const repoFolder = await insert({ legacyId: `github:${repository.name}`, name: repository.name, kind: "folder", parentId: githubFolder });
      const details = [
        repository.description || "No description provided.",
        repository.language ? `Language: ${repository.language}` : "",
        `Stars: ${repository.stargazers_count ?? 0}`,
      ].filter(Boolean).join("\n\n");
      await insert({ legacyId: `github:${repository.name}:readme`, name: "Repository.md", kind: "text", parentId: repoFolder, content: details });
      await insert({ legacyId: `github:${repository.name}:link`, name: "Open Repository", kind: "link", parentId: repoFolder, url: repository.html_url });
    }
  }
}

interface LegacyFinderItem {
  id?: string;
  name?: string;
  type?: string;
  parentId?: string | null;
  content?: string;
  src?: string;
  url?: string;
  files?: LegacyFinderItem[];
}

export async function importLegacyFinderData(
  userId: string,
  legacyItems: LegacyFinderItem[],
  source: "firebase" | "fixture" = "firebase",
) {
  const collection = await nodes();
  const ownerId = new ObjectId(userId);
  const existing = await collection.find({ ownerId, legacyId: { $exists: true } }).toArray();
  const idMap = new Map(existing.filter((item) => item.legacyId).map((item) => [item.legacyId!, item._id]));
  let imported = 0;
  let skipped = 0;

  const insertLegacy = async (item: LegacyFinderItem, parentId: ObjectId | null, fallbackId: string) => {
    const legacyId = item.id || fallbackId;
    const mapped = idMap.get(legacyId);
    if (mapped) {
      skipped += 1;
      for (const [index, child] of (item.files ?? []).entries()) {
        await insertLegacy(child, mapped, `${legacyId}:file:${index}`)
      }
      return mapped
    }
    const name = item.name?.trim() || "Untitled"
    const ext = extension(name)
    const kind: FileNodeDocument["kind"] = item.type === "folder"
      ? "folder"
      : item.type === "link"
        ? "link"
        : TEXT_EXTENSIONS.has(ext) || typeof item.content === "string"
          ? "text"
          : "file"
    const now = new Date()
    const document: FileNodeDocument = {
      ownerId,
      parentId,
      name,
      kind,
      mimeType: kind === "text" ? "text/plain" : undefined,
      sizeBytes: Buffer.byteLength(item.content ?? "", "utf8"),
      content: item.content,
      secureUrl: item.src,
      url: item.url,
      legacyId,
      migrationSource: source,
      isStarred: false,
      isTrashed: false,
      createdAt: now,
      updatedAt: now,
    }
    const result = await collection.insertOne(document)
    idMap.set(legacyId, result.insertedId)
    imported += 1
    for (const [index, child] of (item.files ?? []).entries()) {
      await insertLegacy(child, result.insertedId, `${legacyId}:file:${index}`)
    }
    return result.insertedId
  }

  const pending = [...legacyItems]
  let progressed = true
  while (pending.length && progressed) {
    progressed = false
    for (let index = pending.length - 1; index >= 0; index -= 1) {
      const item = pending[index]
      const parent = item.parentId ? idMap.get(item.parentId) : null
      if (item.parentId && !parent) continue
      await insertLegacy(item, parent ?? null, `legacy:${index}`)
      pending.splice(index, 1)
      progressed = true
    }
  }

  const orphaned = pending.length
  for (const [index, item] of pending.entries()) {
    await insertLegacy(item, null, `orphan:${index}`)
  }

  return { imported, skipped, orphaned, unresolved: 0 }
}
