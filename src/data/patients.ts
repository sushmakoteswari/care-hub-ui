export type PatientStatus = "stable" | "critical" | "monitoring" | "discharged";
export type Gender = "male" | "female" | "other";

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  bloodType: string;
  condition: string;
  status: PatientStatus;
  doctor: string;
  department: string;
  admittedAt: string; // ISO
  lastVisit: string;
  phone: string;
  email: string;
  city: string;
  vitals: {
    heartRate: number; // bpm
    bloodPressure: string; // "120/80"
    temperature: number; // °C
    oxygen: number; // %
  };
  avatarHue: number; // for deterministic avatar colors
}

const FIRST = ["Aarav", "Priya", "Rohan", "Sneha", "Vikram", "Ananya", "Kabir", "Ishita", "Arjun", "Meera", "Liam", "Olivia", "Noah", "Emma", "James", "Sophia", "Lucas", "Mia", "Ethan", "Ava", "Mason", "Isabella", "Logan", "Amelia", "Daniel", "Zara", "Yusuf", "Layla", "Omar", "Fatima"];
const LAST = ["Sharma", "Patel", "Khan", "Singh", "Gupta", "Reddy", "Nair", "Iyer", "Smith", "Johnson", "Williams", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "Hassan", "Ahmed", "Cohen", "Rossi", "Garcia"];
const CONDITIONS = ["Hypertension", "Type 2 Diabetes", "Asthma", "Migraine", "Post-op recovery", "Cardiac arrhythmia", "Pneumonia", "Fractured tibia", "Chronic kidney disease", "Rheumatoid arthritis", "Anxiety disorder", "Annual check-up", "COVID-19 recovery", "Acute bronchitis"];
const DEPARTMENTS = ["Cardiology", "Neurology", "Orthopedics", "Pediatrics", "Oncology", "General Medicine", "Pulmonology", "Endocrinology"];
const DOCTORS = ["Dr. Mehra", "Dr. Iyer", "Dr. Whitman", "Dr. Sato", "Dr. Okafor", "Dr. Kapoor", "Dr. Lindqvist", "Dr. Ramos"];
const CITIES = ["Mumbai", "Bangalore", "Delhi", "Pune", "London", "New York", "Berlin", "Singapore", "Toronto", "Dubai"];
const STATUSES: PatientStatus[] = ["stable", "stable", "stable", "monitoring", "monitoring", "critical", "discharged"];
const BLOOD = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

// Seedable PRNG so the list is stable across reloads
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function generatePatients(count = 36): Patient[] {
  const rng = mulberry32(42);
  const list: Patient[] = [];
  for (let i = 0; i < count; i++) {
    const first = pick(rng, FIRST);
    const last = pick(rng, LAST);
    const gender: Gender = rng() > 0.5 ? "female" : "male";
    const age = 4 + Math.floor(rng() * 80);
    const admittedDays = Math.floor(rng() * 120);
    const admittedAt = new Date(Date.now() - admittedDays * 86400000).toISOString();
    const lastVisitDays = Math.floor(rng() * Math.max(1, admittedDays));
    const lastVisit = new Date(Date.now() - lastVisitDays * 86400000).toISOString();
    const sys = 100 + Math.floor(rng() * 60);
    const dia = 60 + Math.floor(rng() * 30);
    list.push({
      id: `PT-${(1000 + i).toString()}`,
      name: `${first} ${last}`,
      age,
      gender,
      bloodType: pick(rng, BLOOD),
      condition: pick(rng, CONDITIONS),
      status: pick(rng, STATUSES),
      doctor: pick(rng, DOCTORS),
      department: pick(rng, DEPARTMENTS),
      admittedAt,
      lastVisit,
      phone: `+1 ${200 + Math.floor(rng() * 700)}-${100 + Math.floor(rng() * 900)}-${1000 + Math.floor(rng() * 9000)}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@medmail.io`,
      city: pick(rng, CITIES),
      vitals: {
        heartRate: 55 + Math.floor(rng() * 50),
        bloodPressure: `${sys}/${dia}`,
        temperature: +(36 + rng() * 2.4).toFixed(1),
        oxygen: 90 + Math.floor(rng() * 10),
      },
      avatarHue: Math.floor(rng() * 360),
    });
  }
  return list;
}

export const patients: Patient[] = generatePatients(36);

export const getPatientById = (id: string) => patients.find((p) => p.id === id);
