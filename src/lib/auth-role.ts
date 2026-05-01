import type { User } from "firebase/auth";
import type { AuthRole } from "@/store/authStore";

/** Demo accounts: role is enforced from email when present (no Firebase custom claim required). */
const DEMO_EMAIL_ROLE: Record<string, AuthRole> = {
  "admin@careiq.dev": "admin",
  "clinician@careiq.dev": "clinician",
};

export function resolveAuthRole(user: User, roleFromClaims: AuthRole): AuthRole {
  const key = user.email?.toLowerCase();
  if (key && key in DEMO_EMAIL_ROLE) {
    return DEMO_EMAIL_ROLE[key];
  }
  return roleFromClaims;
}
