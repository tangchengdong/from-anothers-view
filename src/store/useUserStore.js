import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUserStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoggedIn: false,

      login: (user, token) => set({ user, token, isLoggedIn: true }),
      logout: () => set({ user: null, token: null, isLoggedIn: false }),
      updateUser: (user) => set({ user }),
    }),
    {
      name: 'user-storage',
    }
  )
)
