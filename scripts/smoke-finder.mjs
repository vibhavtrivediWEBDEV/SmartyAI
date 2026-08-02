import process from "node:process";
import { MongoClient, ObjectId } from "mongodb";
import { SignJWT } from "jose";

const baseUrl = process.argv.includes("--base-url")
  ? process.argv[process.argv.indexOf("--base-url") + 1]
  : "http://localhost:3001";

if (!process.env.MONGODB_URI || !process.env.AUTH_SECRET) {
  throw new Error("MONGODB_URI and AUTH_SECRET are required");
}

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB || "hrms");
const user = await db.collection("users").findOne({}, { sort: { updatedAt: -1, createdAt: -1 } });
if (!user) throw new Error("No user exists for Finder smoke test");

const token = await new SignJWT({})
  .setProtectedHeader({ alg: "HS256" })
  .setSubject(user._id.toHexString())
  .setIssuedAt()
  .setExpirationTime("5m")
  .sign(new TextEncoder().encode(process.env.AUTH_SECRET));

const headers = { "Content-Type": "application/json", Cookie: `smarty_session=${token}` };
const request = async (path, init = {}) => {
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers: { ...headers, ...init.headers } });
  const body = await response.json();
  if (!response.ok) throw new Error(`${init.method || "GET"} ${path}: ${body.error || response.status}`);
  return body;
};

const suffix = Date.now().toString(36);
const createdIds = [];
try {
  const folder = (await request("/api/Projects", {
    method: "POST",
    body: JSON.stringify({ name: `Finder Smoke ${suffix}`, type: "folder", parentId: null }),
  })).data;
  createdIds.push(folder.id);

  const file = (await request(`/api/Projects/${folder.id}/files`, {
    method: "POST",
    body: JSON.stringify({ name: "smoke.json", type: "document", content: "{\n  \"step\": 1\n}" }),
  })).data;
  createdIds.push(file.id);

  const updated = await request(`/api/Projects/${folder.id}/files/${file.id}`, {
    method: "PATCH",
    body: JSON.stringify({ content: "{\n  \"step\": 2,\n  \"saved\": true\n}" }),
  });

  const copied = (await request("/api/Projects/copy", {
    method: "POST",
    body: JSON.stringify({ sourceIds: [file.id], targetParentId: null }),
  })).data[0];
  createdIds.push(copied.id);

  await request("/api/Projects", {
    method: "DELETE",
    body: JSON.stringify({ ids: [folder.id] }),
  });

  const active = (await request("/api/Projects")).data;
  const trash = (await request("/api/Projects?trash=true")).data;
  const ownerMatches = await db.collection("fileNodes").countDocuments({
    _id: { $in: createdIds.map((id) => new ObjectId(id)) },
    ownerId: user._id,
  });

  const result = {
    authenticated: true,
    folderCreated: Boolean(folder.id),
    jsonCreated: Boolean(file.id),
    jsonEdited: JSON.parse(updated.content).saved === true,
    copied: Boolean(copied.id),
    recursiveTrash: trash.some((item) => item.id === folder.id) && trash.some((item) => item.id === file.id),
    copiedFileStillActive: active.some((item) => item.id === copied.id),
    ownerScoped: ownerMatches === createdIds.length,
  };
  if (Object.values(result).some((value) => value !== true)) throw new Error(`Smoke assertions failed: ${JSON.stringify(result)}`);
  console.log(JSON.stringify(result, null, 2));
} finally {
  if (createdIds.length) {
    await db.collection("fileNodes").deleteMany({ _id: { $in: createdIds.map((id) => new ObjectId(id)) }, ownerId: user._id });
  }
  await client.close();
}
