import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAppStore = create(
  persist(
    (set) => ({
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
