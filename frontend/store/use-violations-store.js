import { create } from "zustand";

const useViolationsStore = create((set) => ({
  violations: [],
  isLoading: false,
  error: null,

  setViolations: (violations) =>
    set({ violations, isLoading: false, error: null }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  clearViolations: () => set({ violations: [], error: null }),
}));

export default useViolationsStore;
