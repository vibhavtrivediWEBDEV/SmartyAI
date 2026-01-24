"use client"

const admin = require("firebase-admin")

// Initialize Firebase Admin (you'll need to set up your service account)
const serviceAccount = {
  type: "service_account",
  project_id: "smarty-a99d5",
//   private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDdafxDbdFPkuov\ns0698o7nYedtPDEdTT2zW3sCGXVYoPDKxATKJ1aej0tBM/rHzeiSlE60OL7NPeT2\nIII8JMw+Kvhl/QGTA1LbXOIeCX6mlaYy93fZV0lTaEukwRTlYsm3ThNRem0vGvB3\n7B0bKnZwGv+g6hvVHO/VkcROM578P1Lg48ty0GJmiruGsv+g4BSqFztjSUL0YUYT\njnEDz6LzQ2BAA2wHl3wUguO4lKFRbUIwKgc71WSxr61of7/JgayBuFKzrKEMEAsm\ncMLNP8kzogIvat0ZhCF+p/cJrI6I2At5qzpak0jqvPfAWd1t65t2CBKHYqMQM4Nk\nrTDkF4KFAgMBAAECggEALSoAnV+CBeWNtBezDO90o3GW07MmwJegKZ0UOSAozeCc\nZXv5DyRZmKPZoa4A7m9LzNSIPl5h2ztQID2O20ZVTCwXObSTdOHFbb4jWKWuqjvV\n6EkO7yxNJoCch3mkMctGIshADAt5SJXJ7ehhoog1mxYCxVfjwAO0T1/5x0rj2AeQ\nkX/MXHuuxEPYOBwekOo49QMQZ7XslUY5xm3QOXeVGucNGO5BWTn0sIXSLevCm3zM\nUxhCxRRl6wLjGbcGsaDTpHoo1tm/y3C89xnEKCwS+U1Jx3bR01r74c7wcywMTiWt\ns1if+gia0uOTr51CuBUGzjPu1CbnNdETEOmwgq7msQKBgQDzNi5mh5IyRR+RTpgN\nqWwqoRAho+eTXL264PkB5KK6PjLqTyAEcdBzvPXLZJbn8JvRyokQRnlDhrg/jIs2\nw5TFrZoE75pnkJHQUOks1n6372IDOAkoJYYCugcTfMRUM4yx1TIOaEOBjzNS6CdE\nM8z2m/hYgRNuAmhwtOggPnnj1QKBgQDpDmQRRZJp8efcBsJZjWLEmPyAsluw8EhJ\n+Zs/dkXMMr8fKLLV04ob474Ca7p/f3DHa7ZFf/QmlFP0THylAfh2hy2VhmW7+HvJ\nBSG5CbtmrWRa7bziIQgvBU0KhKr/JFyrWYFHvVAXuFSGjPMHbYhIDoq01pQorwPj\nV/e1UaZr8QKBgBCYieIFLjyv6s+HhWipPvBJvUgOXyb3FRtDbrpqV5BN3juO2qhy\n+75qDnuqiYGaMYfHQkMSDARHlRsBBB7gia5TgkcD8o1OmCSW4NJmcI8sjouZr0ZG\nCTb2arUxtlPokJkx6xCAnNqiYuYtYUCOKFZLnk6rwB+pmmbWcWCB4t9hAoGAbGaQ\nLuRwVKz7DoFqVqMHxK/wCqBrO6KXzSi3iE4n6vHTqdeRTxnkzFIi6BdZmMIbH/a+\nwhbg5izp2+DTvSBshB0eG8V2fnb2hKrJY7reGsUdv5mC2J9KoixSCElrC9/K5rxs\nAIVSwqWvUyIuTE8rK3DwHWsNYNr+8PjSs9i1ktECgYEA1AvRL+YVkyn4zStia3VJ\nXcKSga5NO8Jp0aqgawIpODvcfLTconU/CRmZSaLPlvU21qdY7iM75TwASVwX9PZu\n/+l+032ZY+WK+SrNRHfPPYzWlquHXuByy3+jZdTxzfl66aiVeAQ7IfqhcJTpainD\nuq9ot7vwZA2mldL2FEbc66A=\n-----END PRIVATE KEY-----\n"?.replace(/\\n/g, "\n"),
  client_email: "firebase-adminsdk-fbsvc@smarty-a99d5.iam.gserviceaccount.com",
  // client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc@smarty-a99d5.iam.gserviceaccount.com`,
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://smarty-a99d5-default-rtdb.firebaseio.com`,
  })
}

const db = admin.firestore();

async function deleteProjectCategory() {
  const collectionRef = db.collection("ProjectCategory");
  const snapshot = await collectionRef.get();

  if (snapshot.empty) {
    console.log("No documents found in ProjectCategory collection.");
    return;
  }

  const batchSize = 500;
  let batchCount = 0;

  while (!snapshot.empty) {
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    batchCount++;
    console.log(`Batch ${batchCount} deleted`);
    // Fetch the next batch if more docs exist
    const newSnapshot = await collectionRef.get();
    if (newSnapshot.empty) break;
  }

  console.log("All documents deleted from ProjectCategory.");
}

deleteProjectCategory().catch(console.error);