export type AuditLogEntry = {
  id: string;
  action: string;
  actor: string;
  resource: string;
  ipMasked: string;
  at: string;
};

export const auditLogMock: AuditLogEntry[] = [
  {
    id: "a1",
    action: "VIEW_PATIENT_RECORD",
    actor: "admin@careiq.dev",
    resource: "patient:PT-1001",
    ipMasked: "10.x.x.12",
    at: new Date(Date.now() - 120_000).toISOString(),
  },
  {
    id: "a2",
    action: "EXPORT_CSV",
    actor: "clinician@careiq.dev",
    resource: "patients:list",
    ipMasked: "10.x.x.44",
    at: new Date(Date.now() - 900_000).toISOString(),
  },
  {
    id: "a3",
    action: "LOGIN_SUCCESS",
    actor: "admin@careiq.dev",
    resource: "auth:session",
    ipMasked: "192.x.x.8",
    at: new Date(Date.now() - 3_600_000).toISOString(),
  },
  {
    id: "a4",
    action: "AI_INSIGHT_GENERATED",
    actor: "clinician@careiq.dev",
    resource: "dashboard:population",
    ipMasked: "10.x.x.44",
    at: new Date(Date.now() - 7_200_000).toISOString(),
  },
  {
    id: "a5",
    action: "RBAC_DENIED",
    actor: "clinician@careiq.dev",
    resource: "route:/audit-log",
    ipMasked: "10.x.x.44",
    at: new Date(Date.now() - 86_400_000).toISOString(),
  },
  {
    id: "a6",
    action: "NOTIFICATIONprefs_UPDATE",
    actor: "admin@careiq.dev",
    resource: "user:preferences",
    ipMasked: "10.x.x.12",
    at: new Date(Date.now() - 172_800_000).toISOString(),
  },
];
