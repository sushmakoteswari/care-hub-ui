import type { Patient } from "@/data/patients";

/** Demo risk score 10–99 from status and vitals (not clinical advice). */
export function computeDemoRiskScore(patient: Patient): number {
  let score = 18;
  if (patient.status === "critical") score += 48;
  else if (patient.status === "monitoring") score += 28;
  else if (patient.status === "stable") score += 8;
  else if (patient.status === "discharged") score += 4;

  const o2 = patient.vitals.oxygen;
  if (o2 < 92) score += 18;
  else if (o2 < 95) score += 10;
  else if (o2 < 98) score += 4;

  const hr = patient.vitals.heartRate;
  if (hr > 110 || hr < 50) score += 12;
  else if (hr > 100 || hr < 55) score += 6;

  const t = patient.vitals.temperature;
  if (t >= 38.3 || t <= 35.5) score += 8;

  const [sys] = patient.vitals.bloodPressure.split("/").map(Number);
  if (!Number.isNaN(sys) && (sys >= 160 || sys < 90)) score += 6;

  return Math.min(99, Math.max(10, Math.round(score)));
}

export function riskLevel(score: number): "low" | "moderate" | "high" {
  if (score < 40) return "low";
  if (score < 70) return "moderate";
  return "high";
}
