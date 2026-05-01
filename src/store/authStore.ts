import { create } from "zustand";
import type { User } from "firebase/auth";

export type AuthRole = "admin" | "clinician" | (string & {});

type AuthState = {
  user: User | null;
  role: AuthRole;
  isLoading: boolean;
  setFromFirebase: (user: User | null, role: AuthRole) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: "clinician",
  isLoading: true,
  setFromFirebase: (user, role) =>
    set({
      user,
      role: user ? role : "clinician",
      isLoading: false,
    }),
}));
