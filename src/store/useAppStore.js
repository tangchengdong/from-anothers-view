import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const BREAKTHROUGH_THRESHOLDS = [3, 5, 8, 12, 16, 20]

export const useAppStore = create(
  persist(
    (set, get) => ({
      selectedPerspectives: null,
      selectedPerspectiveData: null,
      itemsPerPerspective: 20,
      searchQuery: '',
      isSearchMode: false,
      loading: false,
      selectedCategory: '',
      selectedSubcategory: '',
      favorites: [],
      userInterests: [],
      cocoonBreaker: false,
      readCount: 0,
      lastBreakthrough: 0,
      pendingBreakthrough: null,

      setSelectedPerspectives: (perspectives, itemsPerPerspective = 20) => set({
        selectedPerspectives: perspectives,
        selectedPerspectiveData: perspectives && perspectives.length === 1 ? perspectives[0] : null,
        itemsPerPerspective,
        isSearchMode: false,
        searchQuery: '',
        loading: true
      }),

      setSelectedPerspective: (perspective) => set({
        selectedPerspectives: perspective ? [perspective] : null,
        selectedPerspectiveData: perspective,
        itemsPerPerspective: 20,
        isSearchMode: false,
        searchQuery: '',
        loading: true
      }),

      setSearchQuery: (query) => set({
        searchQuery: query,
        isSearchMode: !!query,
        loading: true
      }),

      setLoading: (loading) => set({ loading }),

      setCategory: (category) => set({
        selectedCategory: category,
        selectedSubcategory: '',
        loading: true
      }),

      setSubcategory: (subcategory) => set({
        selectedSubcategory: subcategory,
        loading: true
      }),

      toggleFavorite: (itemId) => set((state) => ({
        favorites: state.favorites.includes(itemId)
          ? state.favorites.filter(id => id !== itemId)
          : [...state.favorites, itemId]
      })),

      addUserInterest: (interest) => set((state) => ({
        userInterests: state.userInterests.includes(interest)
          ? state.userInterests
          : [...state.userInterests, interest]
      })),

      setCocoonBreaker: (value) => set({ cocoonBreaker: value }),

      incrementReadCount: () => {
        const state = get()
        const newCount = state.readCount + 1
        const achieved = BREAKTHROUGH_THRESHOLDS.find(t => t === newCount && t > state.lastBreakthrough)
        
        set({
          readCount: newCount,
          pendingBreakthrough: achieved || null,
          lastBreakthrough: achieved ? achieved : state.lastBreakthrough
        })

        return { newCount, achieved: !!achieved }
      },

      clearPendingBreakthrough: () => set({ pendingBreakthrough: null }),

      resetSelection: () => set({
        selectedPerspectives: null,
        selectedPerspectiveData: null,
        itemsPerPerspective: 20,
        isSearchMode: false,
        searchQuery: '',
        selectedCategory: '',
        selectedSubcategory: '',
        loading: false
      })
    }),
    {
      name: 'prism-app-storage'
    }
  )
)

