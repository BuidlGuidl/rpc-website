import serviceAccount from "../firebase-service-account.json";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

export const adminDb = admin.firestore();
export { admin };
