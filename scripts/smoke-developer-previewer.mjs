import process from "node:process";
import { MongoClient, ObjectId } from "mongodb";
import { SignJWT } from "jose";
import { v2 as cloudinary } from "cloudinary";

const baseUrl = process.argv.includes("--base-url")
  ? process.argv[process.argv.indexOf("--base-url") + 1]
  : "http://localhost:3001";
if (!process.env.MONGODB_URI || !process.env.AUTH_SECRET) throw new Error("MONGODB_URI and AUTH_SECRET are required");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB || "hrms");
const user = await db.collection("users").findOne({}, { sort: { updatedAt: -1, createdAt: -1 } });
if (!user) throw new Error("No user exists for developer preview smoke test");
const token = await new SignJWT({}).setProtectedHeader({ alg: "HS256" }).setSubject(user._id.toHexString()).setIssuedAt().setExpirationTime("5m").sign(new TextEncoder().encode(process.env.AUTH_SECRET));
const cookie = `smarty_session=${token}`;
const jsonRequest = async (path, init = {}) => {
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers: { "Content-Type": "application/json", Cookie: cookie, ...init.headers } });
  const body = await response.json();
  if (!response.ok) throw new Error(`${init.method || "GET"} ${path}: ${body.error || response.status}`);
  return body;
};

const ids = [];
let replacementAsset;
let replacementBytes = 0;
let sourceBytes = 0;
try {
  const folder = (await jsonRequest("/api/Projects", { method: "POST", body: JSON.stringify({ name: `Developer Preview ${Date.now()}`, type: "folder" }) })).data;
  ids.push(folder.id);
  const samples = [
    { name: "index.html", content: "<!doctype html><html><body><h1>Live Finder Preview</h1></body></html>" },
    { name: "App.tsx", content: "function App(){ return <h1>TSX Preview</h1> }\nexport default App" },
    { name: "main.py", content: "print('Finder execution')" },
  ];
  const created = [];
  for (const sample of samples) {
    const sourceFile = new File([sample.content], sample.name, { type: sample.name.endsWith(".html") ? "text/html" : "text/plain" });
    sourceBytes += sourceFile.size;
    const form = new FormData();
    form.append("file", sourceFile);
    form.append("parentId", folder.id);
    const uploadResponse = await fetch(`${baseUrl}/api/Projects/upload`, { method: "POST", headers: { Cookie: cookie }, body: form });
    const uploadBody = await uploadResponse.json();
    if (!uploadResponse.ok) throw new Error(uploadBody.error || `Could not upload ${sample.name}`);
    const file = uploadBody.data;
    ids.push(file.id);
    created.push(file);
  }
  const vscodeSave = await jsonRequest(`/api/Projects/${created[2].id}`, { method: "PATCH", body: JSON.stringify({ content: "print('Saved from VS Code')" }) });

  const imagePlaceholder = (await jsonRequest(`/api/Projects/${folder.id}/files`, { method: "POST", body: JSON.stringify({ name: "preview.png", type: "document", content: "" }) })).data;
  ids.push(imagePlaceholder.id);
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=", "base64");
  const form = new FormData();
  form.append("file", new File([png], "preview.png", { type: "image/png" }));
  const replaceResponse = await fetch(`${baseUrl}/api/Projects/${imagePlaceholder.id}/replace`, { method: "POST", headers: { Cookie: cookie }, body: form });
  const replaceBody = await replaceResponse.json();
  if (!replaceResponse.ok) throw new Error(replaceBody.error || "Image replacement failed");
  const storedImage = await db.collection("fileNodes").findOne({ _id: new ObjectId(imagePlaceholder.id), ownerId: user._id });
  replacementAsset = storedImage?.storageKey;
  replacementBytes = storedImage?.sizeBytes || 0;

  const result = {
    htmlPreviewSourceStored: created[0].content.includes("Live Finder Preview"),
    tsxPreviewSourceStored: created[1].content.includes("TSX Preview"),
    backendSourceStored: created[2].content.includes("Finder execution"),
    vscodeSavePersisted: vscodeSave.data.content.includes("Saved from VS Code"),
    imageReplacementPersisted: storedImage?.mimeType === "image/png" && Boolean(storedImage.storageKey),
    sameFolder: [created[0], created[1], created[2], imagePlaceholder].every((item) => item.parentId === folder.id),
  };
  if (Object.values(result).some((value) => value !== true)) throw new Error(`Developer preview assertions failed: ${JSON.stringify(result)}`);
  console.log(JSON.stringify(result, null, 2));
} finally {
  if (replacementAsset) await cloudinary.uploader.destroy(replacementAsset, { resource_type: "image", type: "authenticated", invalidate: true }).catch(() => undefined);
  if (replacementBytes) await db.collection("storageUsage").updateOne({ userId: user._id }, { $inc: { fileBytesUsed: -replacementBytes } });
  if (sourceBytes) await db.collection("storageUsage").updateOne({ userId: user._id }, { $inc: { textBytesUsed: -sourceBytes } });
  if (ids.length) await db.collection("fileNodes").deleteMany({ _id: { $in: ids.map((id) => new ObjectId(id)) }, ownerId: user._id });
  await client.close();
}
