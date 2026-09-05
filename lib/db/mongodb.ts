import { Db, MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI ?? "";
const databaseName = process.env.MONGODB_DB || "hrms";

if (!uri) {
  throw new Error("MONGODB_URI is not configured");
}

declare global {
  // eslint-disable-next-line no-var
  var __smartyMongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise = global.__smartyMongoClientPromise;

function getClientPromise(): Promise<MongoClient> {
  if (!clientPromise) {
    const connection = new MongoClient(uri).connect();
    clientPromise = connection;

    if (process.env.NODE_ENV !== "production") {
      global.__smartyMongoClientPromise = connection;
    }

    void connection.catch(() => {
      if (clientPromise === connection) clientPromise = undefined;
      if (global.__smartyMongoClientPromise === connection) {
        global.__smartyMongoClientPromise = undefined;
      }
    });
  }

  return clientPromise;
}

export async function getMongoClient(): Promise<MongoClient> {
  return getClientPromise();
}

export async function getDatabase(): Promise<Db> {
  return (await getClientPromise()).db(databaseName);
}
