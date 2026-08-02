import process from "node:process";
import { MongoClient, ObjectId } from "mongodb";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const valueAfter = (flag) => {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const email = valueAfter("--email")?.trim().toLowerCase();
const firebaseUserId = valueAfter("--firebase-user-id");
const dryRun = process.argv.includes("--dry-run");
if (!email) throw new Error("Pass --email for the MongoDB account that owns the migrated interviews.");
if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required.");

if (!getApps().length) {
  initializeApp({ credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }) });
}

const mongo = new MongoClient(process.env.MONGODB_URI);
await mongo.connect();
try {
  const database = mongo.db(process.env.MONGODB_DB || "hrms");
  const user = await database.collection("users").findOne({ email });
  if (!user) throw new Error(`No MongoDB user found for ${email}.`);

  const firestore = getFirestore();
  let interviewQuery = firestore.collection("interviews");
  if (firebaseUserId) interviewQuery = interviewQuery.where("userId", "==", firebaseUserId);
  const interviewSnapshot = await interviewQuery.get();
  const feedbackSnapshot = await firestore.collection("feedback").get();
  const interviewIdMap = new Map();
  let interviewCount = 0;
  let feedbackCount = 0;

  for (const document of interviewSnapshot.docs) {
    const source = document.data();
    const existing = await database.collection("interviews").findOne({ legacyFirebaseId: document.id });
    const mongoInterviewId = existing?._id ?? new ObjectId();
    interviewIdMap.set(document.id, mongoInterviewId);
    if (dryRun) continue;

    const questions = (Array.isArray(source.questions) ? source.questions : []).map((question, index) => {
      if (typeof question === "string") {
        const coding = question.startsWith("[CODING]");
        return { id: `q${index + 1}`, text: question.replace("[CODING]", "").trim(), type: coding ? "coding" : "regular" };
      }
      return { id: question.id || `q${index + 1}`, ...question };
    });
    const createdAt = source.createdAt?.toDate?.() ?? new Date(source.createdAt || Date.now());
    await database.collection("interviews").updateOne(
      { legacyFirebaseId: document.id },
      {
        $set: {
          role: source.role || "General professional",
          type: source.type || "mixed",
          level: source.level || "intermediate",
          techstack: Array.isArray(source.techstack) ? source.techstack : [],
          questions,
          userId: user._id,
          finalized: source.finalized !== false,
          coverImage: source.coverImage || "/covers/adobe.png",
          createdAt,
          updatedAt: new Date(),
          legacyFirebaseId: document.id,
          legacyFirebaseUserId: source.userId,
        },
        $setOnInsert: { _id: mongoInterviewId },
      },
      { upsert: true },
    );
    interviewCount += 1;
  }

  for (const document of feedbackSnapshot.docs) {
    const source = document.data();
    if (firebaseUserId && source.userId !== firebaseUserId) continue;
    const interviewId = interviewIdMap.get(source.interviewId);
    if (!interviewId || dryRun) continue;
    const createdAt = source.createdAt?.toDate?.() ?? new Date(source.createdAt || Date.now());
    await database.collection("interviewFeedback").updateOne(
      { legacyFirebaseId: document.id },
      {
        $set: {
          interviewId,
          userId: user._id,
          totalScore: Number(source.totalScore) || 0,
          categoryScores: source.categoryScores || [],
          strengths: source.strengths || [],
          areasForImprovement: source.areasForImprovement || [],
          finalAssessment: source.finalAssessment || "",
          createdAt,
          updatedAt: new Date(),
          legacyFirebaseId: document.id,
        },
      },
      { upsert: true },
    );
    feedbackCount += 1;
  }

  console.log(JSON.stringify({
    dryRun,
    mongoUserId: user._id.toHexString(),
    firebaseUserId: firebaseUserId || "all interview records",
    interviewsFound: interviewSnapshot.size,
    interviewsMigrated: dryRun ? 0 : interviewCount,
    feedbackMigrated: dryRun ? 0 : feedbackCount,
  }, null, 2));
} finally {
  await mongo.close();
}
