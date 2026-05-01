import { useEffect, useCallback, type ReactNode } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/services/firebase";
import { authService } from "@/services/authService";
import { useAuthStore, type AuthRole } from "@/store/authStore";
import { resolveAuthRole } from "@/lib/auth-role";

/** Shallow session shape for call sites that still expect `session`. */
export type AuthSessionShim = {
  user: User;
} | null;

export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        let role: AuthRole = "clinician";
        try {
          const tr = await user.getIdTokenResult();
          const r = tr.claims.role;
          if (typeof r === "string") role = r as AuthRole;
        } catch {
          /* keep default */
        }
        role = resolveAuthRole(user, role);
        useAuthStore.getState().setFromFirebase(user, role);
      } else {
        useAuthStore.getState().setFromFirebase(null, "clinician");
      }
    });
    return unsub;
  }, []);

  return children;
}

export function useAuth(): {
  user: User | null;
  role: AuthRole;
  /** Prefer `user`; kept for routes that checked `session`. */
  session: AuthSessionShim;
  loading: boolean;
  signOut: () => Promise<void>;
} {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const loading = useAuthStore((s) => s.isLoading);

  const signOut = useCallback(() => authService.signOut(), []);

  return {
    user,
    role,
    session: user ? { user } : null,
    loading,
    signOut,
  };
}
