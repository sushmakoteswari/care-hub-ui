import { getStatusCounts } from "@/lib/patient-census";
import type { Patient } from "@/data/patients";
import { groqChatCompletion, groqIsConfigured } from "@/server/groq-proxy";

async function runGroq(prompt: string, maxTokens = 500): Promise<string> {
  return groqChatCompletion({ data: { prompt, maxTokens } });
}

/** Generic completion (API key stays on server). */
export async function completeGroq(prompt: string, maxTokens = 500): Promise<string> {
  return runGroq(prompt, maxTokens);
}

export { groqIsConfigured };

export async function isGroqAvailable(): Promise<boolean> {
  try {
    const { configured } = await groqIsConfigured();
    return configured;
  } catch {
    return false;
  }
}

function daysAdmitted(admittedAt: string): number {
  const ms = Date.now() - new Date(admittedAt).getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

function topEntry(map: Map<string, number>): string {
  let best = "";
  let n = 0;
  for (const [k, v] of map) {
    if (v > n) {
      n = v;
      best = k;
    }
  }
  return n > 0 ? best : "None";
}

export async function fetchWardInsight(cohort: Patient[]): Promise<string> {
  const counts = getStatusCounts(cohort);
  const critical = cohort.filter((p) => p.status === "critical");
  const monitoring = cohort.filter((p) => p.status === "monitoring");
  const stable = cohort.filter((p) => p.status === "stable");
  const criticalPct =
    counts.total > 0 ? Math.round((counts.critical / counts.total) * 100) : 0;

  const deptMap = new Map<string, number>();
  const condMap = new Map<string, number>();
  let losSum = 0;
  for (const p of cohort) {
    deptMap.set(p.department, (deptMap.get(p.department) ?? 0) + 1);
    condMap.set(p.condition, (condMap.get(p.condition) ?? 0) + 1);
    losSum += daysAdmitted(p.admittedAt);
  }
  const topDept = topEntry(deptMap);
  const topCondition = topEntry(condMap);
  const avgLOS = cohort.length > 0 ? Math.round((losSum / cohort.length) * 10) / 10 : 0;

  const criticalLine = critical
    .map((p) => `${p.name} (${p.department}, ${p.doctor})`)
    .join(", ");

  const prompt = `You are a clinical AI assistant for a hospital dashboard.
Here is the current patient census:
- Total patients: ${counts.total}
- Critical: ${counts.critical} (${criticalPct}%)
- Monitoring: ${monitoring.length}
- Stable: ${stable.length}
- Discharged (in snapshot): ${counts.discharged}
- Most loaded department: ${topDept}
- Most common condition: ${topCondition}
- Average length of stay (days since admission in this demo): ${avgLOS} days
- Critical patients: ${criticalLine || "none"}

Write a concise 3-sentence clinical ward briefing for the attending administrator.
Be specific, use the numbers, sound clinical not robotic. Do not invent patients beyond the list.`;

  return runGroq(prompt, 400);
}

export async function fetchRiskExplanationGroq(patient: Patient): Promise<string> {
  const los = daysAdmitted(patient.admittedAt);
  const prompt = `You are a clinical decision support AI.
Patient: ${patient.name}, Age: ${patient.age}, Gender: ${patient.gender}
Condition: ${patient.condition}, Department: ${patient.department}
Status: ${patient.status}
Vitals:
- Heart Rate: ${patient.vitals.heartRate} bpm
- Blood Pressure: ${patient.vitals.bloodPressure} mmHg
- Temperature: ${patient.vitals.temperature}°C
- Oxygen Saturation: ${patient.vitals.oxygen}%
Days since admission (demo): ${los}
Attending: ${patient.doctor}

In 2-3 sentences, explain why this patient is classified as ${patient.status} acuity.
Flag any vitals that are outside common ward norms. Recommend one concrete next step.
Be clinical and direct. Add one short line: this is decision support only, not a diagnosis.`;

  return runGroq(prompt, 350);
}

export async function fetchNotesSummaryGroq(patient: Patient): Promise<string> {
  const los = daysAdmitted(patient.admittedAt);
  const prompt = `You are a clinical documentation AI.
Summarize this patient record into a structured clinical note:

Patient: ${patient.name} (${patient.age}y ${patient.gender})
Admitted: ${los} days ago (relative to today in demo)
Primary condition: ${patient.condition}
Department: ${patient.department}
Attending: ${patient.doctor}
Current status: ${patient.status}
Vitals: HR ${patient.vitals.heartRate}, BP ${patient.vitals.bloodPressure}, Temp ${patient.vitals.temperature}°C, SpO₂ ${patient.vitals.oxygen}%

Write a 3-bullet SOAP-style summary:
• Subjective:
• Objective (vitals assessment):
• Plan:`;

  return runGroq(prompt, 400);
}

function parseJsonIdArray(raw: string): string[] {
  let s = raw.trim();
  const fence = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence) s = fence[1].trim();
  const arr = JSON.parse(s) as unknown;
  if (!Array.isArray(arr)) throw new Error("Expected JSON array of IDs");
  return arr.map((x) => String(x).trim()).filter(Boolean);
}

export async function fetchAIPatientFilter(userQuery: string, list: Patient[]): Promise<string[]> {
  const compact = list.map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    department: p.department,
    condition: p.condition,
    age: p.age,
    doctor: p.doctor,
  }));
  const prompt = `You are a patient filter AI.
Given this patient list: ${JSON.stringify(compact)}

User query: ${JSON.stringify(userQuery)}

Return ONLY a JSON array of patient id strings that match the query (subset of the list).
Example: ["PT-1000", "PT-1003"]
No explanation, no markdown, just the JSON array.`;

  const text = await runGroq(prompt, 800);
  try {
    return parseJsonIdArray(text);
  } catch {
    const m = text.match(/\[[\s\S]*?\]/);
    if (m) return parseJsonIdArray(m[0]);
    throw new Error("Could not parse patient IDs from the model response.");
  }
}
