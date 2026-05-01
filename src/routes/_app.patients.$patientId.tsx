import { createFileRoute, Link, notFound, Navigate } from "@tanstack/react-router";
import { ShimmerBox, useInitialPageShimmer } from "@/components/page-shimmer";
import { getPatientById } from "@/data/patients";
import { useAuth } from "@/lib/auth-context";
import { canAccessPatientRecord } from "@/lib/patient-access";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useGlobalStore } from "@/store/global-store";
import { maskEmail, maskName, maskPhone } from "@/lib/phi-format";
import { computeDemoRiskScore, riskLevel } from "@/lib/risk-score";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Bell,
  Calendar,
  Droplet,
  Heart,
  Mail,
  MapPin,
  Phone,
  Stethoscope,
  Thermometer,
  Wind,
} from "lucide-react";
import { showNotification } from "@/lib/notifications";

export const Route = createFileRoute("/_app/patients/$patientId")({
  loader: ({ params }) => {
    const patient = getPatientById(params.patientId);
    if (!patient) throw notFound();
    return { patient };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData ? `${loaderData.patient.name} - Patient - MedCare` : "Patient - MedCare",
      },
    ],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-md py-20 text-center">
      <h2 className="text-xl font-semibold">Patient not found</h2>
      <Button asChild className="mt-4">
        <Link to="/patients">Back to patients</Link>
      </Button>
    </div>
  ),
  component: PatientDetailPage,
});

function PatientDetailPage() {
  const { patient } = Route.useLoaderData();
  const { user, role } = useAuth();
  const phiMask = useGlobalStore((s) => s.phiMaskEnabled);
  const showShimmer = useInitialPageShimmer();

  if (showShimmer) {
    return <PatientDetailShimmer />;
  }

  if (!canAccessPatientRecord(patient, role, user?.email)) {
    return <Navigate to="/patients" />;
  }

  const riskScore = computeDemoRiskScore(patient);
  const rLevel = riskLevel(riskScore);
  const barClass =
    rLevel === "high" ? "bg-destructive" : rLevel === "moderate" ? "bg-warning" : "bg-success";

  const initials = patient.name
    .split(" ")
    .slice(0, 2)
    .map((n: string) => n[0])
    .join("");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-3 -ml-2">
          <Link to="/patients">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> All patients
          </Link>
        </Button>
      </div>

      {/* Hero card */}
      <Card className="overflow-hidden p-0">
        <div className="h-28 bg-[image:var(--gradient-hero)]" />
        <div className="-mt-12 flex flex-col gap-6 px-6 pb-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <Avatar className="h-24 w-24 border-4 border-card shadow-[var(--shadow-elevated)]">
              <AvatarFallback
                className="text-xl font-semibold text-primary"
                style={{ background: `oklch(0.9 0.06 ${patient.avatarHue})` }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="md:pb-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  {phiMask ? maskName(patient.name) : patient.name}
                </h1>
                <StatusBadge status={patient.status} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {patient.id} · {patient.age}y · {patient.gender} · Blood {patient.bloodType}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                showNotification("Care team notified", {
                  body: `${patient.doctor} has been alerted about ${patient.name}.`,
                })
              }
            >
              <Bell className="mr-2 h-4 w-4" /> Notify team
            </Button>
            <Button>
              <Stethoscope className="mr-2 h-4 w-4" /> Start visit
            </Button>
          </div>
        </div>
      </Card>

      {/* Acuity risk */}
      <Card className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-foreground">Acuity risk score</h2>
            <p className="text-xs text-muted-foreground">
              Demo model from status + vitals (not a clinical device)
            </p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-semibold tabular-nums text-foreground">{riskScore}</span>
            <span className="text-sm text-muted-foreground"> / 99</span>
            <p
              className={cn(
                "mt-1 text-xs font-medium capitalize",
                rLevel === "high" && "text-destructive",
                rLevel === "moderate" && "text-warning-foreground",
                rLevel === "low" && "text-success",
              )}
            >
              {rLevel} risk
            </p>
          </div>
        </div>
        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-all", barClass)}
            style={{ width: `${riskScore}%` }}
          />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Use the <strong className="text-foreground">clinical assistant</strong> (sparkles icon, bottom-right)
          for an AI explanation of risk or a SOAP-style summary, powered by Groq on the server.
        </p>
      </Card>

      {/* Vitals */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Current vitals
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <VitalCard
            icon={Heart}
            label="Heart rate"
            value={`${patient.vitals.heartRate}`}
            unit="bpm"
            tone="destructive"
          />
          <VitalCard
            icon={Droplet}
            label="Blood pressure"
            value={patient.vitals.bloodPressure}
            unit="mmHg"
            tone="accent"
          />
          <VitalCard
            icon={Thermometer}
            label="Temperature"
            value={`${patient.vitals.temperature}`}
            unit="°C"
            tone="warning"
          />
          <VitalCard
            icon={Wind}
            label="Oxygen"
            value={`${patient.vitals.oxygen}`}
            unit="%"
            tone="success"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Clinical */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="font-semibold text-foreground">Clinical overview</h2>
          <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
            <Field label="Primary condition" value={patient.condition} />
            <Field label="Department" value={patient.department} />
            <Field label="Attending physician" value={patient.doctor} />
            <Field
              label="Admitted on"
              value={new Date(patient.admittedAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            />
            <Field
              label="Last visit"
              value={new Date(patient.lastVisit).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            />
            <Field label="Blood type" value={patient.bloodType} />
          </dl>
          <div className="mt-6 rounded-lg border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
            <strong className="text-foreground">Care notes:</strong> Continue current treatment
            plan. Re-evaluate vitals every 4 hours. Notify the on-call physician if SpO₂ drops below
            92% or HR exceeds 110 bpm sustained.
          </div>
        </Card>

        {/* Contact */}
        <Card className="p-6">
          <h2 className="font-semibold text-foreground">Contact</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <ContactRow icon={Mail} label={phiMask ? maskEmail(patient.email) : patient.email} />
            <ContactRow icon={Phone} label={phiMask ? maskPhone(patient.phone) : patient.phone} />
            <ContactRow icon={MapPin} label={patient.city} />
            <ContactRow
              icon={Calendar}
              label={`Admitted ${new Date(patient.admittedAt).toLocaleDateString()}`}
            />
          </ul>
        </Card>
      </div>
    </div>
  );
}

function PatientDetailShimmer() {
  return (
    <div
      className="mx-auto max-w-6xl space-y-6"
      aria-busy="true"
      aria-label="Loading patient record"
    >
      <ShimmerBox className="h-9 w-36" />
      <Card className="overflow-hidden p-0">
        <ShimmerBox className="h-28 w-full rounded-none rounded-t-lg" />
        <div className="-mt-12 flex flex-col gap-6 px-6 pb-6 md:flex-row md:items-end">
          <ShimmerBox className="h-24 w-24 shrink-0 rounded-full border-4 border-card" />
          <div className="min-w-0 flex-1 space-y-3 md:pb-2">
            <ShimmerBox className="h-8 w-64 max-w-full" />
            <ShimmerBox className="h-4 w-48 max-w-full" />
          </div>
          <div className="flex gap-2">
            <ShimmerBox className="h-10 w-32" />
            <ShimmerBox className="h-10 w-28" />
          </div>
        </div>
      </Card>
      <Card className="p-6">
        <div className="flex flex-wrap justify-between gap-4">
          <ShimmerBox className="h-6 w-48" />
          <ShimmerBox className="h-10 w-24" />
        </div>
        <ShimmerBox className="mt-4 h-3 w-full rounded-full" />
      </Card>
      <div>
        <ShimmerBox className="mb-3 h-4 w-32" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Card key={i} className="p-5">
              <ShimmerBox className="h-9 w-9 rounded-lg" />
              <ShimmerBox className="mt-3 h-3 w-20" />
              <ShimmerBox className="mt-2 h-8 w-16" />
            </Card>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <ShimmerBox className="h-6 w-48" />
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="space-y-2">
                <ShimmerBox className="h-3 w-24" />
                <ShimmerBox className="h-4 w-full" />
              </div>
            ))}
          </div>
          <ShimmerBox className="mt-6 h-20 w-full rounded-lg" />
        </Card>
        <Card className="p-6">
          <ShimmerBox className="h-6 w-32" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex items-center gap-3">
                <ShimmerBox className="h-8 w-8 rounded-md" />
                <ShimmerBox className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium text-foreground">{value}</dd>
    </div>
  );
}

function ContactRow({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <li className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-accent">
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-foreground">{label}</span>
    </li>
  );
}

function VitalCard({
  icon: Icon,
  label,
  value,
  unit,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  unit: string;
  tone: "destructive" | "accent" | "warning" | "success";
}) {
  const colors: Record<typeof tone, string> = {
    destructive: "bg-destructive/15 text-destructive",
    accent: "bg-accent/15 text-accent",
    warning: "bg-warning/20 text-warning-foreground",
    success: "bg-success/15 text-success",
  };
  return (
    <Card className="p-5">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colors[tone]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
        {value}
        <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>
      </p>
    </Card>
  );
}
