import { create } from "zustand";

const useChatStore = create((set, get) => ({
  messages: [],
  isStreaming: false,
  error: null,

  addUserMessage: (content) => {
    const { messages } = get();
    const newMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };
    set({ messages: [...messages, newMessage], error: null });
  },

  startAssistantMessage: () => {
    const { messages } = get();
    const newMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
    };
    set({ messages: [...messages, newMessage], isStreaming: true, error: null });
  },

  appendToLastMessage: (token) => {
    const { messages } = get();
    if (messages.length === 0) return;
    const updated = [...messages];
    const last = { ...updated[updated.length - 1] };
    last.content += token;
    updated[updated.length - 1] = last;
    set({ messages: updated });
  },

  finishStreaming: () => set({ isStreaming: false }),

  setError: (error) => set({ error, isStreaming: false }),

  clearChat: () => set({ messages: [], error: null, isStreaming: false }),

  getHistory: () => {
    return get().messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
  },
}));

export default useChatStore;
