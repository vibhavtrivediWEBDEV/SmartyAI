import process from "node:process";
import { MongoClient } from "mongodb";
import { v2 as cloudinary } from "cloudinary";

if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const sourcePattern = /\.(html?|css|jsx?|tsx?|json|xml|ya?ml|py|java|c|cc|cpp|cxx|go|rs|php|rb|md|txt|csv)$/i;
const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB || "hrms");
const candidates = await db.collection("fileNodes").find({
  storageKey: { $exists: true },
  $or: [{ content: { $exists: false } }, { content: "" }],
}).toArray();

const recovered = [];
const failed = [];
for (const node of candidates.filter((item) => sourcePattern.test(item.name))) {
  try {
    const url = cloudinary.url(node.storageKey, {
      resource_type: node.resourceType || "raw",
      type: "authenticated",
      sign_url: true,
      secure: true,
    });
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Cloudinary download returned ${response.status}`);
    const content = await response.text();
    const bytes = Buffer.byteLength(content, "utf8");
    if (!content.trim()) throw new Error("Downloaded source is empty");
    if (bytes > 8 * 1024 * 1024) throw new Error("Source exceeds 8 MB inline limit");

    await db.collection("fileNodes").updateOne(
      { _id: node._id, ownerId: node.ownerId },
      {
        $set: {
          kind: "text",
          content,
          sizeBytes: bytes,
          mimeType: node.mimeType || "text/plain",
          updatedAt: new Date(),
        },
        $unset: {
          storageProvider: "",
          storageKey: "",
          secureUrl: "",
          resourceType: "",
        },
      },
    );
    await db.collection("storageUsage").updateOne(
      { userId: node.ownerId },
      {
        $inc: {
          fileBytesUsed: -Math.max(0, node.sizeBytes || 0),
          textBytesUsed: bytes,
        },
        $set: { updatedAt: new Date() },
      },
      { upsert: true },
    );
    await cloudinary.uploader.destroy(node.storageKey, {
      resource_type: node.resourceType || "raw",
      type: "authenticated",
      invalidate: true,
    }).catch(() => undefined);
    recovered.push({ id: node._id.toHexString(), name: node.name, bytes });
  } catch (error) {
    failed.push({ id: node._id.toHexString(), name: node.name, error: error instanceof Error ? error.message : String(error) });
  }
}

console.log(JSON.stringify({ recovered, failed }, null, 2));
await client.close();
