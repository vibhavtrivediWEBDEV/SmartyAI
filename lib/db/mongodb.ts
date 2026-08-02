import { Db, MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB || "hrms";

if (!uri) {
  throw new Error("MONGODB_URI is not configured");
}

declare global {
  // eslint-disable-next-line no-var
  var __smartyMongoClientPromise: Promise<MongoClient> | undefined;
}

const client = new MongoClient(uri);
const clientPromise = global.__smartyMongoClientPromise ?? client.connect();

if (process.env.NODE_ENV !== "production") {
  global.__smartyMongoClientPromise = clientPromise;
}

export async function getMongoClient(): Promise<MongoClient> {
  return clientPromise;
}

export async function getDatabase(): Promise<Db> {
  return (await clientPromise).db(databaseName);
}
