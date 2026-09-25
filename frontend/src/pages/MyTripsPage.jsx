import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { FiTrash2, FiShare2, FiEye, FiCalendar, FiMapPin, FiUsers, FiDollarSign, FiClock } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { getMyTrips, deleteItinerary, shareItinerary } from '../services/multiItineraryService'

export default function MyTripsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['my-trips'],
    queryFn: () => getMyTrips().then(r => r.data),
  })

  const { mutate: doDelete } = useMutation({
    mutationFn: (id) => deleteItinerary(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-trips'] })
      toast.success('Itinerary deleted.')
    },
    onError: () => toast.error('Could not delete.'),
  })

  const { mutate: doShare } = useMutation({
    mutationFn: (id) => shareItinerary(id).then(r => r.data),
    onSuccess: (data) => {
      const link = `${window.location.origin}/shared/${data.shareToken}`
      navigator.clipboard.writeText(link)
      toast.success('Share link copied to clipboard! 🔗')
    },
    onError: () => toast.error('Could not generate share link.'),
  })

  const [confirmDelete, setConfirmDelete] = useState(null)

  const trips = data || []

  return (
    <div className="page-enter min-h-screen pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-10">
          <p className="text-saffron-400 text-sm font-semibold uppercase tracking-widest mb-2">Saved Journeys</p>
          <h1 className="text-4xl font-bold text-white mb-3">My <span className="gradient-text">Trips</span></h1>
          <p className="text-slate-400">Your saved itineraries — view, share, or start planning again.</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card rounded-2xl p-6 border border-white/10 shimmer h-52" />
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div className="glass-card rounded-2xl p-16 text-center border border-dashed border-white/20">
            <p className="text-5xl mb-4">🗺️</p>
            <p className="text-white font-semibold text-lg mb-2">No saved trips yet</p>
            <p className="text-slate-500 text-sm mb-6">Generate and save your first multi-city itinerary.</p>
            <button
              onClick={() => navigate('/planner')}
              className="btn-glow px-6 py-3 rounded-xl text-white font-semibold text-sm"
            >
              Plan a Trip
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {trips.map(trip => (
              <div key={trip.id} className="glass-card rounded-2xl border border-white/10 hover:border-saffron-500/30 transition-all overflow-hidden group">
                {/* Colored top bar */}
                <div className="h-1.5 bg-gradient-to-r from-saffron-500 to-saffron-600" />
                <div className="p-5">
                  <h3 className="text-white font-bold text-base mb-1 line-clamp-1 group-hover:text-saffron-300 transition-colors">
                    {trip.title}
                  </h3>
                  <p className="text-slate-500 text-xs mb-4 flex items-center gap-1">
                    <FiMapPin className="w-3 h-3" /> {trip.startLocation}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <FiCalendar className="w-3.5 h-3.5 text-saffron-400" />
                      {trip.days} days
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <FiUsers className="w-3.5 h-3.5 text-saffron-400" />
                      {trip.travelers} traveler{trip.travelers !== 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <FiDollarSign className="w-3.5 h-3.5 text-saffron-400" />
                      ₹{trip.budgetPerPerson?.toLocaleString('en-IN')}/person
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <FiClock className="w-3.5 h-3.5 text-saffron-400" />
                      {new Date(trip.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/planner`, { state: { savedTrip: trip } })}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl glass-card border border-white/10 text-slate-300 hover:text-saffron-400 hover:border-saffron-500/30 text-xs font-medium transition-all"
                    >
                      <FiEye className="w-3.5 h-3.5" /> View
                    </button>
                    <button
                      onClick={() => doShare(trip.id)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl glass-card border border-white/10 text-slate-300 hover:text-blue-400 hover:border-blue-400/30 text-xs transition-all"
                      title="Share"
                    >
                      <FiShare2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(trip.id)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl glass-card border border-white/10 text-slate-300 hover:text-red-400 hover:border-red-400/30 text-xs transition-all"
                      title="Delete"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-2xl p-8 border border-white/10 max-w-sm w-full mx-4 text-center">
            <p className="text-3xl mb-4">🗑️</p>
            <p className="text-white font-semibold text-lg mb-2">Delete Itinerary?</p>
            <p className="text-slate-400 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 rounded-xl glass-card border border-white/10 text-slate-300 hover:text-white text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => { doDelete(confirmDelete); setConfirmDelete(null) }}
                className="flex-1 py-3 rounded-xl bg-red-500/80 hover:bg-red-500 text-white text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
