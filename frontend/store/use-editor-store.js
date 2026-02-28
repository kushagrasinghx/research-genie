import { create } from "zustand";

const MAX_HISTORY = 50;

const useEditorStore = create((set, get) => ({
  documentText: "",
  editorInstance: null,
  saveStatus: "unsaved",
  history: [],
  historyIndex: -1,

  setDocumentText: (text) => set({ documentText: text, saveStatus: "unsaved" }),

  setEditorInstance: (editor) => set({ editorInstance: editor }),

  setSaveStatus: (status) => set({ saveStatus: status }),

  saveSnapshot: () => {
    const { documentText, history, historyIndex } = get();
    if (
      history.length > 0 &&
      history[history.length - 1].text === documentText
    ) {
      return;
    }
    const newEntry = {
      text: documentText,
      timestamp: new Date().toISOString(),
    };
    const newHistory = [...history.slice(0, historyIndex + 1), newEntry].slice(
      -MAX_HISTORY,
    );
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
      saveStatus: "saved",
    });
  },
}));

export default useEditorStore;
