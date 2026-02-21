import {
  initializeApp,
  getApps,
  cert,
  type ServiceAccount,
  type App,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getDatabase } from "firebase-admin/database";
import { getAuth } from "firebase-admin/auth";

function getApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;

  if (!projectId) {
    // During build/dev without credentials, use a dummy app
    return initializeApp({
      projectId: "dummy-project",
      databaseURL: "https://dummy-project.firebaseio.com",
    });
  }

  const serviceAccount: ServiceAccount = {
    projectId,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  };

  return initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });
}

const app = getApp();

export const adminDb = getFirestore(app);
export const adminRtdb = getDatabase(app);
export const adminAuth = getAuth(app);
