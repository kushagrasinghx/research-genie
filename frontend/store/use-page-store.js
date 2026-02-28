import { create } from "zustand";

const PAGE_SIZES = {
  a4: { label: "A4", width: 794, height: 1123 },
  letter: { label: "US Letter", width: 816, height: 1056 },
  legal: { label: "US Legal", width: 816, height: 1344 },
  a3: { label: "A3", width: 1123, height: 1587 },
};

const MARGIN_PRESETS = {
  normal: { label: "Normal", top: 96, right: 72, bottom: 96, left: 72 },
  narrow: { label: "Narrow", top: 48, right: 48, bottom: 48, left: 48 },
  wide: { label: "Wide", top: 96, right: 144, bottom: 96, left: 144 },
  moderate: { label: "Moderate", top: 72, right: 96, bottom: 72, left: 96 },
};

const usePageStore = create((set) => ({
  pageSizeKey: "a4",
  marginKey: "normal",
  pageSize: PAGE_SIZES.a4,
  margins: MARGIN_PRESETS.normal,
  setPageSize: (key) =>
    set({ pageSizeKey: key, pageSize: PAGE_SIZES[key] || PAGE_SIZES.a4 }),
  setMargins: (key) =>
    set({
      marginKey: key,
      margins: MARGIN_PRESETS[key] || MARGIN_PRESETS.normal,
    }),
}));

export { PAGE_SIZES, MARGIN_PRESETS };
export default usePageStore;
