/*
  Firebase helper (email/password)
  - Replace the firebaseConfig object with your real project values.
  - After adding real values, run `npm install` or `yarn` to install dependencies.
*/
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  signInWithEmailAndPassword,
  signOut,
  UserCredential,
  type Auth,
} from "firebase/auth";

import { getExtra } from "@/utils/config";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

const EXTRA = getExtra();

const firebaseConfig = {
  apiKey: EXTRA.API_KEY,
  authDomain: EXTRA.AUTH_DOMAIN,
  databaseURL: EXTRA.DATABASE_URL,
  projectId: EXTRA.PROJECT_ID,
  storageBucket: EXTRA.STORAGE_BUCKET,
  messagingSenderId: EXTRA.MESSAGING_SENDER_ID,
  appId: EXTRA.APP_ID,
  measurementId: EXTRA.MEASUREMENT_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} catch (e) {
  // Fallback for environments where initializeAuth isn't available
  auth = getAuth(app);
}

try {
  const api = require("./api").default as {
    setAuthToken: (t: string | null) => void;
  };

  auth.onIdTokenChanged(async (user) => {
    if (!user) {
      api.setAuthToken(null);
      return;
    }
    try {
      const token = await user.getIdToken();
      api.setAuthToken(token);
    } catch (e) {
      api.setAuthToken(null);
    }
  });
} catch (e) {
  // If anything goes wrong (rare), don't crash app init; API token syncing is best-effort.
}

export async function registerWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function loginWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function logout(): Promise<void> {
  // Signs out the current user. onIdTokenChanged listener will clear API token.
  return signOut(auth);
}

export { auth };
