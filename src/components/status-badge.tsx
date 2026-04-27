import type { PatientStatus } from "@/data/patients";
import { cn } from "@/lib/utils";

const styles: Record<PatientStatus, string> = {
  stable: "bg-success/15 text-success border-success/30",
  monitoring: "bg-warning/20 text-warning-foreground border-warning/40",
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  discharged: "bg-muted text-muted-foreground border-border",
};

const labels: Record<PatientStatus, string> = {
  stable: "Stable",
  monitoring: "Monitoring",
  critical: "Critical",
  discharged: "Discharged",
};

export function StatusBadge({ status }: { status: PatientStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        styles[status],
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "stable" && "bg-success",
          status === "monitoring" && "bg-warning",
          status === "critical" && "bg-destructive animate-pulse",
          status === "discharged" && "bg-muted-foreground",
        )}
      />
      {labels[status]}
    </span>
  );
}
