import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { getFirebaseAuth } from "./firebase";

const googleProvider = new GoogleAuthProvider();

export const authService = {
  signInWithEmail(email: string, password: string) {
    return signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  },

  signInWithGoogle() {
    return signInWithPopup(getFirebaseAuth(), googleProvider);
  },

  signOut() {
    return firebaseSignOut(getFirebaseAuth());
  },
};
