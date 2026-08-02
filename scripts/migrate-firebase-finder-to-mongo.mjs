import fs from "node:fs/promises";
import process from "node:process";
import { MongoClient } from "mongodb";
import { SignJWT } from "jose";

const valueAfter = (flag) => {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const email = valueAfter("--email");
const fixturePath = valueAfter("--fixture");
const baseUrl = valueAfter("--base-url") || "http://localhost:3001";
if (!process.env.MONGODB_URI || !process.env.AUTH_SECRET) throw new Error("MONGODB_URI and AUTH_SECRET are required");

const mongo = new MongoClient(process.env.MONGODB_URI);
await mongo.connect();
const db = mongo.db(process.env.MONGODB_DB || "hrms");
const user = email
  ? await db.collection("users").findOne({ email: email.trim().toLowerCase() })
  : await db.collection("users").findOne({}, { sort: { updatedAt: -1, createdAt: -1 } });
if (!user) throw new Error("No MongoDB user found. Create an account or pass --email.");

const token = await new SignJWT({})
  .setProtectedHeader({ alg: "HS256" })
  .setSubject(user._id.toHexString())
  .setIssuedAt()
  .setExpirationTime("10m")
  .sign(new TextEncoder().encode(process.env.AUTH_SECRET));

let items;
let source;
if (fixturePath) {
  items = JSON.parse(await fs.readFile(fixturePath, "utf8"));
  source = "fixture";
} else {
  const { cert, getApps, initializeApp } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");
  if (!getApps().length) {
    initializeApp({ credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }) });
  }
  const snapshot = await getFirestore().collection("ProjectCategory").get();
  items = snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
  source = "firebase";
}

const response = await fetch(`${baseUrl}/api/Projects/import`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Cookie: `smarty_session=${token}`,
  },
  body: JSON.stringify({ source, items }),
});
const result = await response.json();
if (!response.ok) throw new Error(result.error || `Migration failed (${response.status})`);
console.log(JSON.stringify({ userId: user._id.toHexString(), source, inputItems: items.length, result: result.data }, null, 2));
await mongo.close();
