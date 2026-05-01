import type { Patient } from "@/data/patients";

function escapeCsvCell(v: string): string {
  if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export function downloadPatientsCsv(rows: Patient[], filename = "patients-export.csv") {
  const headers = [
    "id",
    "name",
    "age",
    "gender",
    "status",
    "condition",
    "department",
    "doctor",
    "admittedAt",
    "phone",
    "email",
    "city",
  ];
  const lines = [
    headers.join(","),
    ...rows.map((p) =>
      [
        p.id,
        p.name,
        String(p.age),
        p.gender,
        p.status,
        p.condition,
        p.department,
        p.doctor,
        p.admittedAt,
        p.phone,
        p.email,
        p.city,
      ]
        .map((c) => escapeCsvCell(String(c)))
        .join(","),
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
