import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { patients } from "@/data/patients";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo } from "react";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({
    meta: [{ title: "Analytics — MedCare" }],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const stats = useMemo(() => {
    // Admissions by month (last 6 months)
    const months: { label: string; key: string }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleString("en", { month: "short" }),
        key: `${d.getFullYear()}-${d.getMonth()}`,
      });
    }
    const admissions = months.map((m) => ({
      month: m.label,
      patients: patients.filter((p) => {
        const d = new Date(p.admittedAt);
        return `${d.getFullYear()}-${d.getMonth()}` === m.key;
      }).length,
    }));

    // Status distribution
    const statusMap: Record<string, number> = {};
    for (const p of patients) statusMap[p.status] = (statusMap[p.status] ?? 0) + 1;
    const statusData = Object.entries(statusMap).map(([name, value]) => ({
      name,
      value,
    }));

    // By department
    const deptMap: Record<string, number> = {};
    for (const p of patients) deptMap[p.department] = (deptMap[p.department] ?? 0) + 1;
    const deptData = Object.entries(deptMap)
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count);

    // Avg vitals
    const avgHr = Math.round(
      patients.reduce((s, p) => s + p.vitals.heartRate, 0) / patients.length,
    );
    const avgOx = Math.round(
      patients.reduce((s, p) => s + p.vitals.oxygen, 0) / patients.length,
    );
    const avgTemp = +(
      patients.reduce((s, p) => s + p.vitals.temperature, 0) / patients.length
    ).toFixed(1);

    return { admissions, statusData, deptData, avgHr, avgOx, avgTemp };
  }, []);

  const STATUS_COLORS: Record<string, string> = {
    stable: "oklch(0.65 0.15 160)",
    monitoring: "oklch(0.78 0.16 75)",
    critical: "oklch(0.6 0.22 25)",
    discharged: "oklch(0.7 0.03 230)",
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Real-time clinical metrics across your facility.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Total patients" value={patients.length.toString()} />
        <MetricCard label="Avg heart rate" value={`${stats.avgHr} bpm`} />
        <MetricCard label="Avg SpO₂" value={`${stats.avgOx}%`} />
        <MetricCard label="Avg temperature" value={`${stats.avgTemp}°C`} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div>
            <h2 className="font-semibold text-foreground">Admissions trend</h2>
            <p className="text-xs text-muted-foreground">Last 6 months</p>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.admissions} margin={{ left: -16, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="adm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.62 0.09 215)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.62 0.09 215)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.012 220)" />
                <XAxis dataKey="month" stroke="oklch(0.5 0.03 240)" fontSize={12} />
                <YAxis stroke="oklch(0.5 0.03 240)" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="patients"
                  stroke="oklch(0.62 0.09 215)"
                  strokeWidth={2}
                  fill="url(#adm)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div>
            <h2 className="font-semibold text-foreground">Status mix</h2>
            <p className="text-xs text-muted-foreground">Current patient status</p>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.statusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {stats.statusData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={STATUS_COLORS[entry.name] ?? "oklch(0.62 0.09 215)"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                    textTransform: "capitalize",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {stats.statusData.map((s) => (
              <div key={s.name} className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: STATUS_COLORS[s.name] }}
                />
                <span className="capitalize text-muted-foreground">{s.name}</span>
                <span className="ml-auto font-medium text-foreground">{s.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div>
          <h2 className="font-semibold text-foreground">Patients by department</h2>
          <p className="text-xs text-muted-foreground">
            Distribution across clinical departments
          </p>
        </div>
        <div className="mt-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.deptData} margin={{ left: -16, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.012 220)" />
              <XAxis dataKey="department" stroke="oklch(0.5 0.03 240)" fontSize={11} />
              <YAxis stroke="oklch(0.5 0.03 240)" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" fill="oklch(0.4 0.07 250)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
    </Card>
  );
}
