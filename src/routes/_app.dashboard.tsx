import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, AlertTriangle, ArrowRight, Heart, Stethoscope, UserPlus, Users } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { patients } from "@/data/patients";
import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/lib/auth-context";
import { showNotification } from "@/lib/notifications";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard — MedCare" }],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  const total = patients.length;
  const critical = patients.filter((p) => p.status === "critical").length;
  const monitoring = patients.filter((p) => p.status === "monitoring").length;
  const stable = patients.filter((p) => p.status === "stable").length;
  const recent = [...patients]
    .sort((a, b) => +new Date(b.admittedAt) - +new Date(a.admittedAt))
    .slice(0, 5);
  const criticalList = patients.filter((p) => p.status === "critical").slice(0, 4);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();
  const name = user?.email?.split("@")[0] ?? "Doctor";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{greeting},</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Dr. {name.charAt(0).toUpperCase() + name.slice(1)}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's what's happening across your wards today.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              showNotification("Critical alert demo", {
                body: `${critical} patients currently need immediate attention.`,
              })
            }
          >
            <AlertTriangle className="mr-2 h-4 w-4" /> Trigger alert
          </Button>
          <Button asChild>
            <Link to="/patients">
              <Users className="mr-2 h-4 w-4" /> View patients
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total patients" value={total} icon={Users} accent />
        <KpiCard
          label="Critical"
          value={critical}
          icon={AlertTriangle}
          tone="destructive"
        />
        <KpiCard label="Monitoring" value={monitoring} icon={Activity} tone="warning" />
        <KpiCard label="Stable" value={stable} icon={Heart} tone="success" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recent admissions */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div>
              <h2 className="font-semibold text-foreground">Recent admissions</h2>
              <p className="text-xs text-muted-foreground">
                Latest patients across all wards
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
                to="/patients/$patientId"
                params={{ patientId: p.id }}
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
                to="/patients/$patientId"
                params={{ patientId: p.id }}
                className="block px-5 py-3 hover:bg-secondary/50"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-foreground">{p.name}</div>
                  <Heart className="h-3.5 w-3.5 text-destructive" />
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  HR {p.vitals.heartRate} · BP {p.vitals.bloodPressure} · SpO₂{" "}
                  {p.vitals.oxygen}%
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
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <QuickAction
            icon={UserPlus}
            label="Browse patients"
            to="/patients"
            description="Grid & list views"
          />
          <QuickAction
            icon={Activity}
            label="Open analytics"
            to="/analytics"
            description="Live ward metrics"
          />
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

function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
  tone?: "destructive" | "warning" | "success";
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
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${ring}`}>
          <Icon className="h-4 w-4" />
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
