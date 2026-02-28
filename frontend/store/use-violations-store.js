import { create } from "zustand";

const useViolationsStore = create((set) => ({
  violations: [],
  isLoading: false,
  error: null,
  activeRightTab: "assistant", // "assistant" | "ieee"

  setViolations: (violations) =>
    set({ violations, isLoading: false, error: null }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  clearViolations: () => set({ violations: [], error: null }),

  setActiveRightTab: (tab) => set({ activeRightTab: tab }),
}));

export default useViolationsStore;
