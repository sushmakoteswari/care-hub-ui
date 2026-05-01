import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  DoorOpen,
  Heart,
  HeartPulse,
  Stethoscope,
  UserPlus,
  Users,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { patients } from "@/data/patients";
import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/lib/auth-context";
import { patientsVisibleToUser } from "@/lib/patient-access";
import { getStatusCounts } from "@/lib/patient-census";
import { ShimmerBox, useInitialPageShimmer } from "@/components/page-shimmer";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard - MedCare" }],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, role } = useAuth();
  const showShimmer = useInitialPageShimmer();
  const cohort = useMemo(
    () => patientsVisibleToUser(patients, role, user?.email),
    [role, user?.email],
  );
  const isAdmin = role === "admin";

  const statusCounts = useMemo(() => getStatusCounts(cohort), [cohort]);
  const { total, critical, monitoring, stable, discharged } = statusCounts;
  const recent = [...cohort]
    .sort((a, b) => +new Date(b.admittedAt) - +new Date(a.admittedAt))
    .slice(0, 5);
  const criticalList = cohort.filter((p) => p.status === "critical").slice(0, 4);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();
  const name = user?.email?.split("@")[0] ?? "Doctor";

  if (showShimmer) {
    return <DashboardShimmer isAdmin={isAdmin} />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 md:pt-1">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{greeting},</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Dr. {name.charAt(0).toUpperCase() + name.slice(1)}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's what's happening {isAdmin ? "across your wards" : "with your patients"} today.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/patients">
              <Users className="mr-2 h-4 w-4" /> View patients
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI cards - status tallies match Analytics → Status mix (same census source) */}
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label="Total patients"
          value={total}
          icon={Users}
          accent
          delta="+2.4% vs last week"
        />
        <KpiCard
          label="Critical"
          value={critical}
          icon={AlertTriangle}
          tone="destructive"
          delta="−12% vs last week"
        />
        <KpiCard
          label="Monitoring"
          value={monitoring}
          icon={Activity}
          tone="warning"
          delta="+5.1% vs last week"
        />
        <KpiCard
          label="Stable"
          value={stable}
          icon={Heart}
          tone="success"
          delta="+1.2% vs last week"
        />
        <KpiCard label="Discharged" value={discharged} icon={DoorOpen} delta="In census" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recent admissions */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div>
              <h2 className="font-semibold text-foreground">Recent admissions</h2>
              <p className="text-xs text-muted-foreground">
                {isAdmin
                  ? "Latest patients across all wards"
                  : "Latest admissions in your assigned cohort"}
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/patients">
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
          <div className="divide-y divide-border">
            {recent.map((p) => (
              <Link
                key={p.id}
                to="/patients"
                search={{ q: p.id }}
                title={`Open Patients with ${p.name} (${p.id}) in search`}
                className="flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-secondary/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-primary"
                    style={{ background: `oklch(0.9 0.06 ${p.avatarHue})` }}
                  >
                    {p.name
                      .split(" ")
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground">{p.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.condition} · {p.department}
                    </div>
                  </div>
                </div>
                <StatusBadge status={p.status} />
              </Link>
            ))}
          </div>
        </Card>

        {/* Critical sidebar */}
        <Card>
          <div className="flex items-center justify-between border-b border-border p-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <h2 className="font-semibold text-foreground">Critical now</h2>
            </div>
            <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[11px] font-medium text-destructive">
              {critical}
            </span>
          </div>
          <div className="divide-y divide-border">
            {criticalList.length === 0 && (
              <div className="p-5 text-center text-sm text-muted-foreground">
                No critical patients 🎉
              </div>
            )}
            {criticalList.map((p) => (
              <Link
                key={p.id}
                to="/patients"
                search={{ q: p.id }}
                title={`Open Patients with ${p.name} (${p.id}) in search`}
                className="block px-5 py-3 hover:bg-secondary/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 text-sm font-medium text-foreground">{p.name}</div>
                  <HeartPulse
                    className="h-3.5 w-3.5 shrink-0 text-destructive"
                    aria-hidden
                  />
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  HR {p.vitals.heartRate} · BP {p.vitals.bloodPressure} · SpO₂ {p.vitals.oxygen}%
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <Card className="p-6">
        <h2 className="font-semibold text-foreground">Quick actions</h2>
        <p className="text-xs text-muted-foreground">Jump straight into common tasks</p>
        <div
          className={`mt-4 grid grid-cols-1 gap-3 ${isAdmin ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
        >
          <QuickAction
            icon={UserPlus}
            label="Browse patients"
            to="/patients"
            description="Grid & list views"
          />
          {isAdmin ? (
            <QuickAction
              icon={Activity}
              label="Open analytics"
              to="/analytics"
              description="Live ward metrics"
            />
          ) : null}
          <QuickAction
            icon={Stethoscope}
            label="My schedule"
            to="/dashboard"
            description="Coming soon"
            disabled
          />
        </div>
      </Card>
    </div>
  );
}

function DashboardShimmer({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="mx-auto max-w-7xl space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <ShimmerBox className="h-4 w-24" />
          <ShimmerBox className="h-9 w-56 max-w-full" />
          <ShimmerBox className="h-4 w-72 max-w-full" />
        </div>
        <div className="flex gap-2">
          <ShimmerBox className="h-10 w-full max-w-[11rem] sm:w-36" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Card key={i} className="p-4 sm:p-5">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="min-w-0 flex-1 space-y-2">
                <ShimmerBox className="h-3 w-24 max-w-full" />
                <ShimmerBox className="h-8 w-16" />
                <ShimmerBox className="h-3 w-28 max-w-full" />
              </div>
              <ShimmerBox className="h-10 w-10 shrink-0 rounded-lg sm:h-9 sm:w-9" />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <div className="space-y-2 border-b border-border p-5">
            <ShimmerBox className="h-5 w-48" />
            <ShimmerBox className="h-3 w-64 max-w-full" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3">
                <ShimmerBox className="h-9 w-9 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <ShimmerBox className="h-4 w-40 max-w-full" />
                  <ShimmerBox className="h-3 w-56 max-w-full" />
                </div>
                <ShimmerBox className="h-6 w-16 shrink-0 rounded-full" />
              </div>
            ))}
          </div>
        </Card>
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border p-5">
            <ShimmerBox className="h-5 w-32" />
            <ShimmerBox className="h-6 w-8 rounded-full" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="space-y-2 px-5 py-3">
                <ShimmerBox className="h-4 w-full max-w-[12rem]" />
                <ShimmerBox className="h-3 w-full max-w-[9rem]" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <ShimmerBox className="mb-2 h-5 w-36" />
        <ShimmerBox className="mb-4 h-3 w-48" />
        <div className={`grid grid-cols-1 gap-3 ${isAdmin ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          {Array.from({ length: isAdmin ? 3 : 2 }, (_, i) => (
            <ShimmerBox key={i} className="h-[4.5rem] w-full rounded-lg" />
          ))}
        </div>
      </Card>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
  tone,
  delta,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
  tone?: "destructive" | "warning" | "success";
  delta?: string;
}) {
  const ring =
    tone === "destructive"
      ? "bg-destructive/15 text-destructive"
      : tone === "warning"
        ? "bg-warning/20 text-warning-foreground"
        : tone === "success"
          ? "bg-success/15 text-success"
          : accent
            ? "bg-accent/15 text-accent"
            : "bg-muted text-muted-foreground";
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase leading-snug tracking-wide text-muted-foreground sm:text-xs">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-foreground sm:mt-2 sm:text-3xl">
            {value}
          </p>
          {delta ? (
            <p className="mt-1 text-[10px] leading-snug text-muted-foreground tabular-nums sm:text-xs">
              {delta}
            </p>
          ) : null}
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 ${ring}`}
          aria-hidden
        >
          <Icon className="h-5 w-5 shrink-0 sm:h-4 sm:w-4" />
        </div>
      </div>
    </Card>
  );
}

function QuickAction({
  icon: Icon,
  label,
  description,
  to,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  to: "/dashboard" | "/analytics" | "/patients";
  disabled?: boolean;
}) {
  const inner = (
    <>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
    </>
  );
  if (disabled) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-dashed border-border p-3 opacity-60">
        {inner}
      </div>
    );
  }
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:border-accent/40 hover:bg-secondary/40"
    >
      {inner}
    </Link>
  );
}
