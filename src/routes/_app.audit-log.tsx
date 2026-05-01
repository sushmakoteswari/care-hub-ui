import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { ShimmerBox, useInitialPageShimmer } from "@/components/page-shimmer";
import { auditLogMock } from "@/data/audit-log-mock";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/_app/audit-log")({
  head: () => ({
    meta: [{ title: "Audit log - MedCare" }],
  }),
  component: AuditLogPage,
});

function AuditLogPage() {
  const { role } = useAuth();
  const showShimmer = useInitialPageShimmer();

  if (role !== "admin") {
    return <Navigate to="/dashboard" />;
  }
  if (showShimmer) {
    return <AuditLogShimmer />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Audit log</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Administrator-only view. Mock data for demo and UX review; not sourced from a live audit
          API.
        </p>
      </div>

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead className="hidden sm:table-cell">IP (masked)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogMock.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {new Date(row.at).toLocaleString()}
                </TableCell>
                <TableCell className="font-mono text-xs">{row.action}</TableCell>
                <TableCell className="text-sm">{row.actor}</TableCell>
                <TableCell className="font-mono text-xs">{row.resource}</TableCell>
                <TableCell className="hidden font-mono text-xs sm:table-cell">
                  {row.ipMasked}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function AuditLogShimmer() {
  return (
    <div className="mx-auto max-w-6xl space-y-6" aria-busy="true" aria-label="Loading audit log">
      <div className="flex items-center gap-2">
        <ShimmerBox className="h-6 w-6 rounded-md" />
        <ShimmerBox className="h-8 w-40" />
      </div>
      <ShimmerBox className="h-4 w-full max-w-xl" />
      <Card className="overflow-hidden p-0">
        <div className="border-b border-border p-3">
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }, (_, i) => (
              <ShimmerBox key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="grid grid-cols-5 gap-2 p-3">
              {Array.from({ length: 5 }, (_, j) => (
                <ShimmerBox key={j} className="h-4 w-full" />
              ))}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
