/*
  Firebase helper (email/password)
  - Replace the firebaseConfig object with your real project values.
  - After adding real values, run `npm install` or `yarn` to install dependencies.
*/
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  initializeAuth,
  signInWithEmailAndPassword,
  UserCredential,
  type Auth,
  getReactNativePersistence
} from "firebase/auth";
// React Native AsyncStorage persistence for firebase/auth
// NOTE: make sure to install this in your project (see README below)
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getExtra } from "@/utils/config";

const EXTRA = getExtra();

// TODO: Replace the placeholder values below with your Firebase project's config.
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

// initialize (or reuse) the Firebase app instance
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize auth with React Native persistence when possible. If initialization
// for React Native fails (e.g., running in web), fall back to getAuth(app).
let auth: Auth;
try {
  // This will enable persistence across app restarts when AsyncStorage is available
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} catch (e) {
  // Fallback for environments where initializeAuth isn't available
  auth = getAuth(app);
}

// Keep the API client in sync with Firebase ID tokens. When the user's ID token
// changes (login, logout, refresh), update the `services/api` auth token so
// backend calls include the current bearer token.
try {
  // Import here to avoid circular import during module initialization in some cases
  // (services/api imports expo-constants and is small; this keeps ordering stable).
  // eslint-disable-next-line import/no-extraneous-dependencies
  // @ts-ignore
  const api = require("./api").default as {
    setAuthToken: (t: string | null) => void;
  };

  auth.onIdTokenChanged(async (user) => {
    if (!user) {
      api.setAuthToken(null);
      return;
    }
    try {
      // getIdToken() returns a current token (not forcing refresh)
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

export { auth };
