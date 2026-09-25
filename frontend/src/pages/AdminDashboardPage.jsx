import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'
import { FiPlus, FiEdit2, FiTrash2, FiMapPin } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { destinationApi } from '../services/api.service'
import { useAuthStore } from '../store/authStore'

export default function AdminDashboardPage() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  
  if (!user || (user.role !== 'ROLE_ADMIN' && user.role !== 'ROLE_CONTENT_MANAGER')) {
    return <Navigate to="/" replace />
  }

  const isAdmin = user.role === 'ROLE_ADMIN'

  const [page, setPage] = useState(0)
  
  const { data, isLoading } = useQuery({
    queryKey: ['admin-destinations', page],
    queryFn: () => destinationApi.getAll({ page, size: 20, sortBy: 'createdAt', sortDir: 'desc' }).then(r => r.data),
  })

  const { mutate: deleteDestination } = useMutation({
    mutationFn: (id) => destinationApi.delete(id),
    onSuccess: () => {
      toast.success('Destination deleted.')
      queryClient.invalidateQueries(['admin-destinations'])
    },
    onError: () => toast.error('Could not delete destination.'),
  })

  const destinations = data?.content || []
  const totalPages = data?.totalPages || 0

  return (
    <div className="page-enter min-h-screen pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              Admin <span className="gradient-text">Dashboard</span>
            </h1>
            <p className="text-slate-400 text-sm">Manage destinations and platform content.</p>
          </div>
          <button className="btn-glow flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold text-sm">
            <FiPlus className="w-4 h-4" /> Add Destination
          </button>
        </div>

        <div className="glass-card rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-6 py-4 text-sm font-semibold text-slate-300">Destination</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-300">Location</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-300">Rating</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-300 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {isLoading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-10 text-center text-slate-400">Loading destinations...</td>
                  </tr>
                ) : destinations.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-10 text-center text-slate-400">No destinations found.</td>
                  </tr>
                ) : (
                  destinations.map((dest) => (
                    <tr key={dest.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={dest.imageUrl || 'https://via.placeholder.com/100'} alt={dest.name} className="w-12 h-12 rounded-lg object-cover" />
                          <div>
                            <p className="text-white font-medium text-sm">{dest.name}</p>
                            <p className="text-slate-400 text-xs truncate max-w-[200px]">{dest.categories?.join(', ')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-300">
                          <FiMapPin className="text-saffron-400" />
                          {dest.city ? `${dest.city}, ` : ''}{dest.state}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-amber-400 font-bold">★ {dest.averageRating?.toFixed(1)}</span>
                          <span className="text-slate-500 text-xs">({dest.reviewCount})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete ${dest.name}?`)) {
                                  deleteDestination(dest.id)
                                }
                              }}
                              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="border-t border-white/10 px-6 py-4 flex items-center justify-between">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 rounded-xl border border-white/10 text-sm text-slate-300 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-slate-400">Page {page + 1} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 rounded-xl border border-white/10 text-sm text-slate-300 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
