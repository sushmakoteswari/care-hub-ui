import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { patients, type PatientStatus } from "@/data/patients";
import { useAppStore, appStore } from "@/store/app-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Search, LayoutGrid, List as ListIcon } from "lucide-react";
import { PatientGridCard, PatientListRow } from "@/components/patient-views";

export const Route = createFileRoute("/_app/patients")({
  head: () => ({
    meta: [{ title: "Patients — MedCare" }],
  }),
  component: PatientsPage,
});

function PatientsPage() {
  const view = useAppStore((s) => s.patientView);
  const search = useAppStore((s) => s.patientSearch);
  const statusFilter = useAppStore((s) => s.patientStatusFilter);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return patients.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.condition.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q) ||
        p.doctor.toLowerCase().includes(q)
      );
    });
  }, [search, statusFilter]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Patients
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} of {patients.length} patients
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => appStore.setPatientSearch(e.target.value)}
            placeholder="Search by name, ID, condition…"
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) =>
            appStore.setPatientStatusFilter(v as PatientStatus | "all")
          }
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="monitoring">Monitoring</SelectItem>
            <SelectItem value="stable">Stable</SelectItem>
            <SelectItem value="discharged">Discharged</SelectItem>
          </SelectContent>
        </Select>
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(v) => v && appStore.setPatientView(v as "grid" | "list")}
          className="rounded-md border border-border bg-background p-0.5"
        >
          <ToggleGroupItem
            value="grid"
            aria-label="Grid view"
            className="data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="ml-1.5 hidden sm:inline">Grid</span>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="list"
            aria-label="List view"
            className="data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
          >
            <ListIcon className="h-4 w-4" />
            <span className="ml-1.5 hidden sm:inline">List</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </Card>

      {/* Empty state */}
      {filtered.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No patients match your search.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              appStore.setPatientSearch("");
              appStore.setPatientStatusFilter("all");
            }}
          >
            Clear filters
          </Button>
        </Card>
      )}

      {/* Grid view */}
      {filtered.length > 0 && view === "grid" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <PatientGridCard key={p.id} patient={p} />
          ))}
        </div>
      )}

      {/* List view */}
      {filtered.length > 0 && view === "list" && (
        <Card className="overflow-hidden p-0">
          <div className="hidden grid-cols-12 gap-3 border-b border-border bg-secondary/40 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground md:grid">
            <div className="col-span-4">Patient</div>
            <div className="col-span-3">Condition</div>
            <div className="col-span-2">Department</div>
            <div className="col-span-2">Doctor</div>
            <div className="col-span-1 text-right">Status</div>
          </div>
          {filtered.map((p) => (
            <PatientListRow key={p.id} patient={p} />
          ))}
        </Card>
      )}
    </div>
  );
}
