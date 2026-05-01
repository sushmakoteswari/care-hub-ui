import type { Patient } from "@/data/patients";
import type { AuthRole } from "@/store/authStore";

/**
 * Demo mapping from signed-in clinician email to `patient.assignedDoctor`.
 * Firebase custom claims could override this in production.
 */
const EMAIL_TO_ASSIGNED_DOCTOR: Record<string, string> = {
  "clinician@careiq.dev": "Dr. Whitman",
};

/** Resolve which attending name filters the patient list for this user. */
export function clinicianAssignedDoctorName(
  email: string | null | undefined,
): string | null {
  if (!email) return null;
  return EMAIL_TO_ASSIGNED_DOCTOR[email.toLowerCase()] ?? "Dr. Whitman";
}

/** Patients visible in list, export, and dashboard stats (all for admin, assigned cohort for clinician). */
export function patientsVisibleToUser(
  all: Patient[],
  role: AuthRole,
  userEmail: string | null | undefined,
): Patient[] {
  if (role === "admin") return all;
  const doctor = clinicianAssignedDoctorName(userEmail);
  if (!doctor) return [];
  return all.filter((p) => p.assignedDoctor === doctor);
}

export function canAccessPatientRecord(
  patient: Patient,
  role: AuthRole,
  userEmail: string | null | undefined,
): boolean {
  if (role === "admin") return true;
  const doctor = clinicianAssignedDoctorName(userEmail);
  return doctor != null && patient.assignedDoctor === doctor;
}
