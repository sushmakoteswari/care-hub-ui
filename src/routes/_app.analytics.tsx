import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { patients } from "@/data/patients";
import { useAuth } from "@/lib/auth-context";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo } from "react";
import { ShimmerBox, useInitialPageShimmer } from "@/components/page-shimmer";

const ACCENT_STROKE = "oklch(0.629 0.181 264.4)";
const ACCENT_SOFT = "oklch(0.74 0.095 264.4)";

const aiAccuracyData = [
  { month: "Nov", accuracy: 87.2 },
  { month: "Dec", accuracy: 89.1 },
  { month: "Jan", accuracy: 90.4 },
  { month: "Feb", accuracy: 91.8 },
  { month: "Mar", accuracy: 93.2 },
  { month: "Apr", accuracy: 94.7 },
];

const riskTrendData = [
  { month: "Nov", high: 8, medium: 14, low: 12 },
  { month: "Dec", high: 7, medium: 15, low: 13 },
  { month: "Jan", high: 9, medium: 13, low: 14 },
  { month: "Feb", high: 6, medium: 16, low: 14 },
  { month: "Mar", high: 5, medium: 15, low: 16 },
  { month: "Apr", high: 4, medium: 14, low: 18 },
];

const chartTooltip = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    fontSize: 12,
    boxShadow: "0 10px 40px -10px oklch(0 0 0 / 0.25)",
  },
} as const;

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({
    meta: [{ title: "Analytics - MedCare" }],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { role } = useAuth();
  const showShimmer = useInitialPageShimmer();
  const stats = useMemo(() => {
    const total = patients.length;

    const avgLOS = +(
      patients.reduce((sum, p) => {
        const days = (Date.now() - new Date(p.admittedAt).getTime()) / 86_400_000;
        return sum + days;
      }, 0) / total
    ).toFixed(1);

    const critical = patients.filter((p) => p.status === "critical").length;
    const criticalPct = Math.round((critical / total) * 100);
    const claimDenialKpi = 5;
    const aiAccuracyKpi = 94.7;

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
        const dt = new Date(p.admittedAt);
        return `${dt.getFullYear()}-${dt.getMonth()}` === m.key;
      }).length,
    }));

    const claimDenial = [
      { month: "Jan", beforeAI: 22, afterAI: 9 },
      { month: "Feb", beforeAI: 19, afterAI: 8 },
      { month: "Mar", beforeAI: 24, afterAI: 7 },
      { month: "Apr", beforeAI: 17, afterAI: 6 },
      { month: "May", beforeAI: 21, afterAI: 5 },
      { month: "Jun", beforeAI: 18, afterAI: 5 },
    ];

    const admAvg =
      admissions.reduce((sum, row) => sum + row.patients, 0) / Math.max(admissions.length, 1);

    const riskByDeptMap: Record<
      string,
      { dept: string; critical: number; monitoring: number; stable: number }
    > = {};
    for (const p of patients) {
      if (!riskByDeptMap[p.department]) {
        riskByDeptMap[p.department] = { dept: p.department, critical: 0, monitoring: 0, stable: 0 };
      }
      if (p.status === "critical") riskByDeptMap[p.department].critical++;
      else if (p.status === "monitoring") riskByDeptMap[p.department].monitoring++;
      else if (p.status === "stable" || p.status === "discharged")
        riskByDeptMap[p.department].stable++;
    }
    const riskByDept = Object.values(riskByDeptMap).sort((a, b) => b.critical - a.critical);

    const conditionMap: Record<string, number> = {};
    for (const p of patients) {
      conditionMap[p.condition] = (conditionMap[p.condition] ?? 0) + 1;
    }
    const conditionData = Object.entries(conditionMap)
      .map(([condition, count]) => ({ condition, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const doctorMap: Record<string, { doctor: string; patients: number; critical: number }> = {};
    for (const p of patients) {
      if (!doctorMap[p.doctor])
        doctorMap[p.doctor] = { doctor: p.doctor, patients: 0, critical: 0 };
      doctorMap[p.doctor].patients++;
      if (p.status === "critical") doctorMap[p.doctor].critical++;
    }
    const doctorWorkload = Object.values(doctorMap).sort((a, b) => b.patients - a.patients);

    return {
      admissions,
      claimDenial,
      admAvg,
      kpis: {
        total,
        avgLOS,
        critical,
        criticalPct,
        claimDenial: claimDenialKpi,
        aiAccuracy: aiAccuracyKpi,
      },
      riskByDept,
      conditionData,
      doctorWorkload,
    };
  }, []);

  if (role !== "admin") {
    return <Navigate to="/dashboard" />;
  }

  if (showShimmer) {
    return <AnalyticsShimmer />;
  }

  const { kpis } = stats;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Real-time clinical metrics across your facility.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Avg length of stay"
          value={`${kpis.avgLOS}d`}
          delta="0.4d vs last month"
          deltaUp={false}
        />
        <MetricCard
          label="Critical patients"
          value={`${kpis.critical}`}
          delta={`${kpis.criticalPct}% of census`}
          deltaUp={false}
        />
        <MetricCard
          label="AI diagnostic accuracy"
          value={`${kpis.aiAccuracy}%`}
          delta="↑ 1.5% vs last month"
          deltaUp={true}
        />
        <MetricCard
          label="Claim denial rate"
          value={`${kpis.claimDenial}%`}
          delta="↓ from 22% pre-AI"
          deltaUp={true}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden border-border/80 bg-gradient-to-b from-card to-secondary/20 p-5">
          <div>
            <h2 className="font-semibold text-foreground">Admissions trajectory</h2>
            <p className="text-xs text-muted-foreground">
              Count of patients admitted per month (last 6 months)
            </p>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.admissions} margin={{ left: -16, right: 12, top: 16 }}>
                <defs>
                  <linearGradient id="admFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ACCENT_STROKE} stopOpacity={0.55} />
                    <stop offset="55%" stopColor={ACCENT_STROKE} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={ACCENT_STROKE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 6"
                  stroke="oklch(0.92 0.012 220)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  stroke="oklch(0.5 0.03 240)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: "oklch(0.88 0.02 240)" }}
                />
                <YAxis
                  stroke="oklch(0.5 0.03 240)"
                  fontSize={12}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip {...chartTooltip} formatter={(value: number) => [value, "Admissions"]} />
                <ReferenceLine
                  y={stats.admAvg}
                  stroke={ACCENT_SOFT}
                  strokeDasharray="6 4"
                  label={{
                    value: `Avg ${stats.admAvg.toFixed(1)}`,
                    position: "right",
                    fill: "oklch(0.45 0.03 240)",
                    fontSize: 11,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="patients"
                  name="Admissions"
                  stroke={ACCENT_STROKE}
                  strokeWidth={2}
                  fill="url(#admFill)"
                  dot={{ r: 4, fill: "var(--card)", stroke: ACCENT_STROKE, strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: ACCENT_STROKE, stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="overflow-hidden border-border/80 bg-gradient-to-b from-card to-secondary/20 p-5">
          <div>
            <h2 className="font-semibold text-foreground">Risk load by department</h2>
            <p className="text-xs text-muted-foreground">
              Critical · Monitoring · Stable patients per ward
            </p>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={stats.riskByDept}
                margin={{ left: 8, right: 24, top: 8, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 6"
                  stroke="oklch(0.92 0.012 220)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  fontSize={12}
                  tickLine={false}
                  stroke="oklch(0.5 0.03 240)"
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="dept"
                  width={118}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  stroke="oklch(0.5 0.03 240)"
                />
                <Tooltip {...chartTooltip} />
                <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
                <Bar
                  dataKey="critical"
                  name="Critical"
                  stackId="a"
                  fill="oklch(0.58 0.22 25)"
                  radius={[0, 0, 0, 0]}
                  barSize={14}
                />
                <Bar
                  dataKey="monitoring"
                  name="Monitoring"
                  stackId="a"
                  fill="oklch(0.78 0.16 75)"
                  barSize={14}
                />
                <Bar
                  dataKey="stable"
                  name="Stable"
                  stackId="a"
                  fill="oklch(0.65 0.16 160)"
                  radius={[0, 6, 6, 0]}
                  barSize={14}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden border-border/80 bg-gradient-to-b from-card to-secondary/20 p-5">
        <div>
          <h2 className="font-semibold text-foreground">Claim denial rate: before vs after AI</h2>
          <p className="max-w-3xl text-xs text-muted-foreground">
            <span className="font-medium text-foreground">How to read:</span> each month has two
            bars. The <span className="text-foreground">purple</span> bar is simulated denial %{" "}
            <em>before</em> AI assistance; the <span className="text-foreground">green</span> bar is{" "}
            <em>after</em>. Lower is better; the gap shows the lift from AI (demo data, not live
            claims).
          </p>
        </div>
        <div className="mt-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.claimDenial} margin={{ left: -12, right: 12, top: 16 }}>
              <defs>
                <linearGradient id="claimBefore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.5 0.1 265)" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="oklch(0.45 0.06 265)" stopOpacity={0.85} />
                </linearGradient>
                <linearGradient id="claimAfter" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.62 0.16 155)" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="oklch(0.5 0.12 155)" stopOpacity={0.85} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 6"
                stroke="oklch(0.92 0.012 220)"
                vertical={false}
              />
              <XAxis dataKey="month" stroke="oklch(0.5 0.03 240)" fontSize={12} tickLine={false} />
              <YAxis
                stroke="oklch(0.5 0.03 240)"
                fontSize={12}
                label={{
                  value: "Denial rate (%)",
                  angle: -90,
                  position: "insideLeft",
                  fill: "oklch(0.5 0.03 240)",
                  style: { fontSize: 11 },
                }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                {...chartTooltip}
                formatter={(value: number, name: string) => [`${value}%`, name]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
              <Bar
                dataKey="beforeAI"
                name="Before AI"
                fill="url(#claimBefore)"
                radius={[8, 8, 0, 0]}
                maxBarSize={34}
              />
              <Bar
                dataKey="afterAI"
                name="After AI"
                fill="url(#claimAfter)"
                radius={[8, 8, 0, 0]}
                maxBarSize={34}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Illustrative operational metrics for stakeholder demos; not tied to live claims data.
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden border-border/80 bg-gradient-to-b from-card to-secondary/20 p-5">
          <div>
            <h2 className="font-semibold text-foreground">Top presenting conditions</h2>
            <p className="text-xs text-muted-foreground">
              Most frequent diagnoses across all wards
            </p>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={stats.conditionData}
                margin={{ left: 8, right: 40, top: 8, bottom: 8 }}
              >
                <defs>
                  <linearGradient id="condBar" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="oklch(0.5 0.07 250)" stopOpacity={0.9} />
                    <stop offset="100%" stopColor={ACCENT_STROKE} stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 6"
                  stroke="oklch(0.92 0.012 220)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  fontSize={12}
                  tickLine={false}
                  stroke="oklch(0.5 0.03 240)"
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="condition"
                  width={140}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  stroke="oklch(0.5 0.03 240)"
                />
                <Tooltip {...chartTooltip} formatter={(v: number) => [`${v} patients`, "Count"]} />
                <Bar
                  dataKey="count"
                  fill="url(#condBar)"
                  radius={[0, 8, 8, 0]}
                  barSize={14}
                  label={{ position: "right", fontSize: 11, fill: "oklch(0.5 0.03 240)" }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="overflow-hidden border-border/80 bg-gradient-to-b from-card to-secondary/20 p-5">
          <div>
            <h2 className="font-semibold text-foreground">Physician workload</h2>
            <p className="text-xs text-muted-foreground">
              Patient load per attending; critical cases highlighted
            </p>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.doctorWorkload} margin={{ left: -16, right: 12, top: 8 }}>
                <CartesianGrid
                  strokeDasharray="3 6"
                  stroke="oklch(0.92 0.012 220)"
                  vertical={false}
                />
                <XAxis
                  dataKey="doctor"
                  fontSize={10}
                  tickLine={false}
                  stroke="oklch(0.5 0.03 240)"
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={48}
                />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  stroke="oklch(0.5 0.03 240)"
                  allowDecimals={false}
                />
                <Tooltip {...chartTooltip} />
                <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
                <Bar
                  dataKey="patients"
                  name="Total patients"
                  fill={ACCENT_STROKE}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="critical"
                  name="Critical"
                  fill="oklch(0.58 0.22 25)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden border-border/80 bg-gradient-to-b from-card to-secondary/20 p-5">
          <div>
            <h2 className="font-semibold text-foreground">AI Diagnostic Accuracy</h2>
            <p className="text-xs text-muted-foreground">
              Model performance across clinical decision support tasks
            </p>
          </div>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={aiAccuracyData} margin={{ left: -16, right: 12, top: 16 }}>
                <defs>
                  <linearGradient id="aiAccFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ACCENT_STROKE} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={ACCENT_STROKE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 6"
                  stroke="oklch(0.92 0.012 220)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  stroke="oklch(0.5 0.03 240)"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="oklch(0.5 0.03 240)"
                  fontSize={12}
                  domain={[80, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  {...chartTooltip}
                  formatter={(value: number) => [`${value}%`, "Accuracy"]}
                />
                <ReferenceLine
                  y={90}
                  stroke="oklch(0.65 0.12 75)"
                  strokeDasharray="5 4"
                  label={{
                    value: "90% target",
                    position: "insideTopRight",
                    fill: "oklch(0.45 0.04 75)",
                    fontSize: 10,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="accuracy"
                  name="Accuracy"
                  stroke={ACCENT_STROKE}
                  strokeWidth={2}
                  fill="url(#aiAccFill)"
                  dot={{ r: 4, strokeWidth: 2, stroke: "var(--card)", fill: ACCENT_STROKE }}
                  activeDot={{ r: 8 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Illustrative trend aligned with RagaAI-style evaluation (demo dataset).
          </p>
        </Card>

        <Card className="overflow-hidden border-border/80 bg-gradient-to-b from-card to-secondary/20 p-5">
          <div>
            <h2 className="font-semibold text-foreground">Patient Risk Trend</h2>
            <p className="text-xs text-muted-foreground">
              Stacked population strata, month over month
            </p>
          </div>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={riskTrendData} margin={{ left: -16, right: 12, top: 12 }}>
                <defs>
                  <linearGradient id="riskLowG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.72 0.14 150)" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="oklch(0.6 0.14 150)" stopOpacity={0.55} />
                  </linearGradient>
                  <linearGradient id="riskMedG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.82 0.14 75)" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="oklch(0.68 0.14 75)" stopOpacity={0.65} />
                  </linearGradient>
                  <linearGradient id="riskHighG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.62 0.2 25)" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="oklch(0.52 0.2 25)" stopOpacity={0.65} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 6"
                  stroke="oklch(0.92 0.012 220)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  stroke="oklch(0.5 0.03 240)"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="oklch(0.5 0.03 240)"
                  fontSize={12}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip {...chartTooltip} />
                <Legend wrapperStyle={{ fontSize: 12 }} iconType="rect" />
                <Area
                  type="monotone"
                  dataKey="low"
                  name="Low risk"
                  stackId="risk"
                  stroke="oklch(0.5 0.12 150)"
                  strokeWidth={1}
                  fill="url(#riskLowG)"
                />
                <Area
                  type="monotone"
                  dataKey="medium"
                  name="Medium risk"
                  stackId="risk"
                  stroke="oklch(0.65 0.1 75)"
                  strokeWidth={1}
                  fill="url(#riskMedG)"
                />
                <Area
                  type="monotone"
                  dataKey="high"
                  name="High risk"
                  stackId="risk"
                  stroke="oklch(0.55 0.18 25)"
                  strokeWidth={1}
                  fill="url(#riskHighG)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Demo cohort; not derived from live risk models.
          </p>
        </Card>
      </div>
    </div>
  );
}

function AnalyticsShimmer() {
  return (
    <div className="mx-auto max-w-7xl space-y-6" aria-busy="true" aria-label="Loading analytics">
      <div className="space-y-2">
        <ShimmerBox className="h-9 w-48" />
        <ShimmerBox className="h-4 w-full max-w-xl" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i} className="border-border/80 bg-gradient-to-b from-card to-secondary/20 p-5">
            <ShimmerBox className="h-3 w-28" />
            <ShimmerBox className="mt-2 h-9 w-24" />
            <ShimmerBox className="mt-1 h-3 w-32" />
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AnalyticsChartShimmerCard />
        <AnalyticsChartShimmerCard />
      </div>
      <Card className="overflow-hidden border-border/80 bg-gradient-to-b from-card to-secondary/20 p-5">
        <ShimmerBox className="h-5 w-72 max-w-full" />
        <div className="mt-2 space-y-2">
          <ShimmerBox className="h-3 w-full max-w-3xl" />
          <ShimmerBox className="h-3 w-full max-w-2xl" />
        </div>
        <ShimmerBox className="mt-4 h-80 w-full rounded-lg" />
      </Card>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AnalyticsChartShimmerCard />
        <AnalyticsChartShimmerCard />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AnalyticsChartShimmerCard />
        <AnalyticsChartShimmerCard />
      </div>
    </div>
  );
}

function AnalyticsChartShimmerCard() {
  return (
    <Card className="overflow-hidden border-border/80 bg-gradient-to-b from-card to-secondary/20 p-5">
      <ShimmerBox className="h-5 w-44" />
      <ShimmerBox className="mt-2 h-3 w-full max-w-sm" />
      <ShimmerBox className="mt-4 h-72 w-full rounded-lg" />
    </Card>
  );
}

function MetricCard({
  label,
  value,
  delta,
  deltaUp,
}: {
  label: string;
  value: string;
  delta: string;
  deltaUp: boolean;
}) {
  return (
    <Card className="border-border/80 bg-gradient-to-b from-card to-secondary/20 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
      <p
        className={`mt-1 text-xs font-medium ${deltaUp ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
      >
        {delta}
      </p>
    </Card>
  );
}
