import type { Patient } from "@/data/patients";

export type StatusCounts = {
  total: number;
  critical: number;
  monitoring: number;
  stable: number;
  discharged: number;
};

/** Single source of truth for status tallies (dashboard KPIs + analytics pie). */
export function getStatusCounts(cohort: Patient[]): StatusCounts {
  const counts = { critical: 0, monitoring: 0, stable: 0, discharged: 0 };
  for (const p of cohort) {
    counts[p.status]++;
  }
  return { total: cohort.length, ...counts };
}

const STATUS_CHART_ORDER = ["critical", "monitoring", "stable", "discharged"] as const;

/** Rows for Recharts pie / legend; only non-zero segments for the donut. */
export function statusDataForPieChart(cohort: Patient[]) {
  const c = getStatusCounts(cohort);
  return STATUS_CHART_ORDER.map((name) => ({
    name,
    value: c[name],
  })).filter((d) => d.value > 0);
}
