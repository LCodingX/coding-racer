import {
  initializeApp,
  getApps,
  cert,
  type ServiceAccount,
  type App,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getDatabase, type Database } from "firebase-admin/database";
import { getAuth, type Auth } from "firebase-admin/auth";

let _app: App | undefined;
let _db: Firestore | undefined;
let _rtdb: Database | undefined;
let _auth: Auth | undefined;

function getAdminApp(): App {
  if (_app) return _app;

  if (getApps().length > 0) {
    _app = getApps()[0];
    return _app;
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;

  if (!projectId) {
    throw new Error(
      "FIREBASE_ADMIN_PROJECT_ID is not set. Firebase Admin SDK cannot initialize."
    );
  }

  const serviceAccount: ServiceAccount = {
    projectId,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  };

  _app = initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });

  return _app;
}

export function getAdminDb(): Firestore {
  if (!_db) _db = getFirestore(getAdminApp());
  return _db;
}

export function getAdminRtdb(): Database {
  if (!_rtdb) _rtdb = getDatabase(getAdminApp());
  return _rtdb;
}

export function getAdminAuth(): Auth {
  if (!_auth) _auth = getAuth(getAdminApp());
  return _auth;
}
