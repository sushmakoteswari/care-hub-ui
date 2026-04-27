/**
 * Lightweight global state using React Context + useSyncExternalStore.
 * Keeps things tiny (no Redux/Zustand needed) while being framework-agnostic.
 */
import { useSyncExternalStore } from "react";

type ViewMode = "grid" | "list";

interface AppState {
  patientView: ViewMode;
  patientSearch: string;
  patientStatusFilter: "all" | "stable" | "critical" | "monitoring" | "discharged";
  notificationsEnabled: boolean;
}

const STORAGE_KEY = "medcare.app.state.v1";

const defaults: AppState = {
  patientView: "grid",
  patientSearch: "",
  patientStatusFilter: "all",
  notificationsEnabled: false,
};

function load(): AppState {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

let state: AppState = load();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }
}

export const appStore = {
  getState: () => state,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  setPatientView(view: ViewMode) {
    state = { ...state, patientView: view };
    emit();
  },
  setPatientSearch(q: string) {
    state = { ...state, patientSearch: q };
    emit();
  },
  setPatientStatusFilter(f: AppState["patientStatusFilter"]) {
    state = { ...state, patientStatusFilter: f };
    emit();
  },
  setNotificationsEnabled(v: boolean) {
    state = { ...state, notificationsEnabled: v };
    emit();
  },
};

export function useAppStore<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    appStore.subscribe,
    () => selector(appStore.getState()),
    () => selector(defaults),
  );
}
