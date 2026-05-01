import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { ShimmerBox, useInitialPageShimmer } from "@/components/page-shimmer";
import { patients, type PatientStatus } from "@/data/patients";
import { useAuth } from "@/lib/auth-context";
import { patientsVisibleToUser } from "@/lib/patient-access";
import { useAppStore, appStore } from "@/store/app-store";
import { useGlobalStore } from "@/store/global-store";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { downloadPatientsCsv } from "@/lib/export-patients-csv";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Search, LayoutGrid, List as ListIcon, Download } from "lucide-react";
import { PatientGridCard, PatientListRow } from "@/components/patient-views";

export const Route = createFileRoute("/_app/patients")({
  validateSearch: (raw: Record<string, unknown>): { q?: string } => {
    const q = raw.q;
    if (typeof q === "string" && q.trim() !== "") return { q: q.trim() };
    return {};
  },
  head: () => ({
    meta: [{ title: "Patients - MedCare" }],
  }),
  component: PatientsPage,
});

function PatientsPage() {
  const { q: searchFromUrl } = Route.useSearch();
  const { user, role } = useAuth();
  const scopePatients = useMemo(
    () => patientsVisibleToUser(patients, role, user?.email),
    [role, user?.email],
  );
  const isAdmin = role === "admin";

  const view = useAppStore((s) => s.patientView);
  const search = useAppStore((s) => s.patientSearch);
  const statusFilter = useAppStore((s) => s.patientStatusFilter);
  const patientAiFilterIds = useAppStore((s) => s.patientAiFilterIds);
  const phiMask = useGlobalStore((s) => s.phiMaskEnabled);
  const setPhiMask = useGlobalStore((s) => s.setPhiMaskEnabled);

  const debouncedSearch = useDebouncedValue(search, 320);

  useEffect(() => {
    if (searchFromUrl !== undefined) {
      appStore.setPatientSearch(searchFromUrl);
    }
  }, [searchFromUrl]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const aiSet =
      patientAiFilterIds && patientAiFilterIds.length > 0
        ? new Set(patientAiFilterIds)
        : null;
    return scopePatients.filter((p) => {
      if (aiSet && !aiSet.has(p.id)) return false;
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
  }, [debouncedSearch, statusFilter, scopePatients, patientAiFilterIds]);

  const showShimmer = useInitialPageShimmer();
  if (showShimmer) {
    return <PatientsShimmer />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 overflow-x-hidden">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Patients</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAdmin ? (
              <>
                {filtered.length} of {patients.length} patients
              </>
            ) : (
              <>
                {filtered.length} of {scopePatients.length} assigned to you ·{" "}
                <span className="text-muted-foreground/90">
                  filtered from your cohort ({scopePatients.length} of {patients.length} total in
                  facility)
                </span>
              </>
            )}
          </p>
          {patientAiFilterIds?.length ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[color-mix(in_oklab,var(--brand)_12%,transparent)] px-3 py-1 text-xs font-medium text-[var(--brand)]">
                Assistant filter: {patientAiFilterIds.length} patient
                {patientAiFilterIds.length === 1 ? "" : "s"}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => appStore.setPatientAiFilterIds(null)}
              >
                Clear assistant filter
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Toolbar - stacked on mobile so nothing forces horizontal scroll */}
      <Card className="flex w-full max-w-full flex-col gap-3 overflow-hidden p-4 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-0 flex-1 basis-full sm:basis-[220px]">
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
          onValueChange={(v) => appStore.setPatientStatusFilter(v as PatientStatus | "all")}
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
          className="flex w-full rounded-md border border-border bg-background p-0.5 sm:w-auto sm:justify-start"
        >
          <ToggleGroupItem
            value="grid"
            aria-label="Grid view"
            className="min-w-0 flex-1 sm:flex-initial data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
          >
            <LayoutGrid className="h-4 w-4 shrink-0" />
            <span className="ml-1.5 hidden sm:inline">Grid</span>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="list"
            aria-label="List view"
            className="min-w-0 flex-1 sm:flex-initial data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
          >
            <ListIcon className="h-4 w-4 shrink-0" />
            <span className="ml-1.5 hidden sm:inline">List</span>
          </ToggleGroupItem>
        </ToggleGroup>
        <div className="flex w-full min-w-0 items-center justify-between gap-3 sm:w-auto sm:justify-start sm:gap-2">
          <Switch
            id="phi-mask"
            checked={phiMask}
            onCheckedChange={setPhiMask}
            aria-label="Mask PHI in list and grid"
          />
          <Label htmlFor="phi-mask" className="cursor-pointer text-sm text-muted-foreground">
            Mask PHI
          </Label>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full shrink-0 sm:ml-auto sm:w-auto"
          onClick={() => downloadPatientsCsv(filtered)}
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </Card>

      {/* Empty state */}
      {filtered.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-sm text-muted-foreground">No patients match your search.</p>
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
            <PatientGridCard key={p.id} patient={p} phiMask={phiMask} />
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
            <PatientListRow key={p.id} patient={p} phiMask={phiMask} />
          ))}
        </Card>
      )}
    </div>
  );
}

function PatientsShimmer() {
  return (
    <div
      className="mx-auto w-full max-w-7xl space-y-6 overflow-x-hidden"
      aria-busy="true"
      aria-label="Loading patients"
    >
      <div className="space-y-2">
        <ShimmerBox className="h-9 w-40" />
        <ShimmerBox className="h-4 w-72 max-w-full" />
      </div>
      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap">
        <ShimmerBox className="h-10 flex-1 basis-full sm:min-w-[220px]" />
        <ShimmerBox className="h-10 w-full sm:w-44" />
        <ShimmerBox className="h-10 w-32" />
        <ShimmerBox className="h-6 w-24 rounded-full" />
        <ShimmerBox className="ml-auto h-9 w-32" />
      </Card>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Card key={i} className="overflow-hidden p-0">
            <ShimmerBox className="h-24 w-full rounded-none rounded-t-lg" />
            <div className="space-y-3 p-4">
              <ShimmerBox className="h-4 w-3/4 max-w-full" />
              <ShimmerBox className="h-3 w-1/2 max-w-full" />
              <div className="flex gap-2">
                <ShimmerBox className="h-5 w-16 rounded-full" />
                <ShimmerBox className="h-5 w-20 rounded-full" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
