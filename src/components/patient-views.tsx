import type { Patient } from "@/data/patients";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "./status-badge";
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { ChevronRight, Heart, Activity } from "lucide-react";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function PatientGridCard({ patient }: { patient: Patient }) {
  return (
    <Link
      to="/patients/$patientId"
      params={{ patientId: patient.id }}
      className="group block"
    >
      <Card className="overflow-hidden p-0 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]">
        <div className="h-16 bg-[image:var(--gradient-accent)]" />
        <div className="-mt-8 px-5 pb-5">
          <Avatar
            className="h-14 w-14 border-4 border-card"
            style={{ background: `oklch(0.85 0.06 ${patient.avatarHue})` }}
          >
            <AvatarFallback
              className="text-sm font-semibold text-primary"
              style={{ background: `oklch(0.9 0.06 ${patient.avatarHue})` }}
            >
              {initials(patient.name)}
            </AvatarFallback>
          </Avatar>
          <div className="mt-3 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-foreground">
                {patient.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {patient.id} · {patient.age}y · {patient.gender}
              </div>
            </div>
            <StatusBadge status={patient.status} />
          </div>
          <div className="mt-3 line-clamp-1 text-xs text-muted-foreground">
            {patient.condition}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 rounded-md bg-secondary px-2 py-1.5">
              <Heart className="h-3 w-3 text-destructive" />
              <span className="font-medium">{patient.vitals.heartRate}</span>
              <span className="text-muted-foreground">bpm</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-md bg-secondary px-2 py-1.5">
              <Activity className="h-3 w-3 text-accent" />
              <span className="font-medium">{patient.vitals.oxygen}%</span>
              <span className="text-muted-foreground">SpO₂</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
            <span>{patient.department}</span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </Card>
    </Link>
  );
}

export function PatientListRow({ patient }: { patient: Patient }) {
  return (
    <Link
      to="/patients/$patientId"
      params={{ patientId: patient.id }}
      className="grid grid-cols-12 items-center gap-3 border-b border-border px-4 py-3 text-sm transition-colors last:border-b-0 hover:bg-secondary/60"
    >
      <div className="col-span-12 flex items-center gap-3 md:col-span-4">
        <Avatar className="h-9 w-9">
          <AvatarFallback
            className="text-xs font-semibold text-primary"
            style={{ background: `oklch(0.9 0.06 ${patient.avatarHue})` }}
          >
            {initials(patient.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="truncate font-medium text-foreground">{patient.name}</div>
          <div className="text-xs text-muted-foreground">
            {patient.id} · {patient.age}y · {patient.gender}
          </div>
        </div>
      </div>
      <div className="col-span-6 truncate text-muted-foreground md:col-span-3">
        {patient.condition}
      </div>
      <div className="col-span-6 truncate text-muted-foreground md:col-span-2">
        {patient.department}
      </div>
      <div className="col-span-6 text-muted-foreground md:col-span-2">
        {patient.doctor}
      </div>
      <div className="col-span-6 flex justify-end md:col-span-1">
        <StatusBadge status={patient.status} />
      </div>
    </Link>
  );
}
