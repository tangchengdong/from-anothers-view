import { create } from 'zustand'

export const useFeedStore = create((set) => ({
  items: [],
  insights: [],
  hotTopics: [],
  loading: false,
  streaming: false,
  error: null,

  setLoading: (loading) => set({ loading }),
  setStreaming: (streaming) => set({ streaming }),
  setError: (error) => set({ error }),

  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  addInsight: (insight) => set((state) => ({ insights: [...state.insights, insight] })),
  addTopic: (topic) => set((state) => ({ hotTopics: [...state.hotTopics, topic] })),

  setFeed: (data) => set({
    items: data.items || [],
    insights: data.insights || [],
    hotTopics: data.hot_topics || [],
  }),

  resetFeed: () => set({
    items: [],
    insights: [],
    hotTopics: [],
    loading: false,
    streaming: false,
    error: null,
  }),
}))
