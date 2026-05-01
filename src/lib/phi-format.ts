import type { Patient } from "@/data/patients";

export function maskName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return "•••";
  if (parts.length === 1) return `${parts[0].slice(0, 1)}.`;
  const last = parts[parts.length - 1]!;
  return `${parts[0]!.slice(0, 1)}. ${last.slice(0, 1)}.`;
}

export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return "•••";
  const u = user ?? "";
  const prefix = u.slice(0, Math.min(2, u.length));
  return `${prefix}•••@${domain}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const last4 = digits.slice(-4);
  if (last4.length < 4) return "•••";
  return `•••-•••-${last4}`;
}

export function maskId(id: string): string {
  if (id.length <= 6) return "•••";
  return `${id.slice(0, 3)}•••${id.slice(-2)}`;
}

/** Display line for patient card row secondary text */
export function formatPatientSubtitle(patient: Patient, mask: boolean): string {
  if (!mask) {
    return `${patient.id} · ${patient.age}y · ${patient.gender}`;
  }
  return `${maskId(patient.id)} · ${patient.age}y · ${patient.gender}`;
}
