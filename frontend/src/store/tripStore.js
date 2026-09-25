import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useTripStore = create(
  persist(
    (set, get) => ({
      tripItems: [], // { id, name, state, city, imageUrl, lat, lng }

      addToTrip: (destination) => {
        const exists = get().tripItems.find(d => d.id === destination.id)
        if (!exists) {
          set(state => ({
            tripItems: [...state.tripItems, {
              id: destination.id,
              name: destination.name,
              state: destination.state,
              city: destination.city,
              imageUrl: destination.imageUrl,
              lat: destination.latitude,
              lng: destination.longitude,
            }],
          }))
          return true
        }
        return false
      },

      removeFromTrip: (id) =>
        set(state => ({ tripItems: state.tripItems.filter(d => d.id !== id) })),

      clearTrip: () => set({ tripItems: [] }),

      isInTrip: (id) => get().tripItems.some(d => d.id === id),
    }),
    { name: 'discover-india-trip' }
  )
)
