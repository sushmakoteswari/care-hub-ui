import { create } from "zustand";

type GlobalState = {
  /** When true, patient lists mask names, emails, phones, etc. */
  phiMaskEnabled: boolean;
  setPhiMaskEnabled: (v: boolean) => void;
};

export const useGlobalStore = create<GlobalState>((set) => ({
  phiMaskEnabled: true,
  setPhiMaskEnabled: (phiMaskEnabled) => set({ phiMaskEnabled }),
}));
