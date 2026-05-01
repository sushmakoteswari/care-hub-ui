import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";

/** Strip quotes/commas often accidentally copied from `firebaseConfig` object literals. */
function viteFirebaseEnv(key: string): string | undefined {
  const raw = import.meta.env[key as keyof ImportMetaEnv];
  if (raw == null || raw === "") return undefined;
  let s = String(raw).trim();
  while (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  s = s.replace(/,\s*$/, "").trim();
  return s || undefined;
}

const firebaseConfig = {
  apiKey: viteFirebaseEnv("VITE_FIREBASE_API_KEY"),
  authDomain: viteFirebaseEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: viteFirebaseEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: viteFirebaseEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: viteFirebaseEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: viteFirebaseEnv("VITE_FIREBASE_APP_ID"),
};

let app: FirebaseApp | undefined;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    if (import.meta.env.DEV && !firebaseConfig.apiKey) {
      console.warn(
        "[firebase] Missing VITE_FIREBASE_* env vars. Add them to .env for auth to work.",
      );
    }
    app = initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}
