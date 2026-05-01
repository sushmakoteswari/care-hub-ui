import { create } from "zustand";
import { patients } from "@/data/patients";
import type { AuthRole } from "@/store/authStore";
import { patientsVisibleToUser } from "@/lib/patient-access";

export type NotificationAudience = "global" | "admin" | "patients";

export type NotificationRow = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  audience: NotificationAudience;
  /** When `audience === "patients"`, only admins and clinicians with these patients in cohort see this. */
  patientIds?: string[];
};

function seedDemo(): NotificationRow[] {
  const now = Date.now();
  return [
    {
      id: "seed-1",
      title: "Ward handoff reminder",
      body: "Evening nursing handoff begins in 30 minutes.",
      createdAt: new Date(now - 3_600_000).toISOString(),
      read: false,
      audience: "admin",
    },
    {
      id: "seed-2",
      title: "Lab results — your patients",
      body: "New chemistry for Arjun Brown (PT-1004) and Ethan Davis (PT-1006). Review in chart.",
      createdAt: new Date(now - 86_400_000).toISOString(),
      read: true,
      audience: "patients",
      patientIds: ["PT-1004", "PT-1006"],
    },
    {
      id: "seed-3",
      title: "Policy acknowledgment",
      body: "Annual HIPAA refresher due by end of quarter.",
      createdAt: new Date(now - 172_800_000).toISOString(),
      read: false,
      audience: "admin",
    },
  ];
}

type Store = {
  items: NotificationRow[];
  append: (title: string, body: string) => void;
  appendLogin: (email: string) => void;
  markRead: (id: string) => void;
  markAllReadForViewer: (role: AuthRole, email: string | null | undefined) => void;
};

export const useNotificationCenterStore = create<Store>((set, get) => ({
  items: seedDemo(),

  append: (title, body) =>
    set((s) => ({
      items: [
        {
          id: crypto.randomUUID(),
          title,
          body,
          createdAt: new Date().toISOString(),
          read: false,
          audience: "global",
        },
        ...s.items,
      ],
    })),

  appendLogin: (email) =>
    get().append("Signed in", `Welcome back ${email}. Session is active.`),

  markRead: (id) =>
    set((s) => ({
      items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),

  markAllReadForViewer: (role, email) =>
    set((s) => {
      const visibleIds = new Set(
        filterNotificationsForUser(s.items, role, email).map((n) => n.id),
      );
      return {
        items: s.items.map((n) =>
          visibleIds.has(n.id) ? { ...n, read: true } : n,
        ),
      };
    }),
}));

/** Notifications the current user is allowed to see (admin: all; clinician: global + patient-scoped for own cohort). */
export function filterNotificationsForUser(
  items: NotificationRow[],
  role: AuthRole,
  userEmail: string | null | undefined,
): NotificationRow[] {
  const cohortIds = new Set(
    patientsVisibleToUser(patients, role, userEmail).map((p) => p.id),
  );
  return items.filter((n) => {
    if (n.audience === "global") return true;
    if (n.audience === "admin") return role === "admin";
    if (n.audience === "patients" && n.patientIds?.length) {
      if (role === "admin") return true;
      return n.patientIds.some((id) => cohortIds.has(id));
    }
    return false;
  });
}

export function selectUnreadNotificationCountForViewer(
  items: NotificationRow[],
  role: AuthRole,
  userEmail: string | null | undefined,
): number {
  return filterNotificationsForUser(items, role, userEmail).filter((n) => !n.read)
    .length;
}

export function selectUnreadNotificationCount(items: NotificationRow[]): number {
  return items.filter((n) => !n.read).length;
}
