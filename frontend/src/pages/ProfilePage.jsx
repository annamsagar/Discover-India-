import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiUser, FiMail, FiShield, FiStar, FiTrash2, FiLogOut, FiEdit3, FiCheck, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { authApi, reviewApi } from '../services/api.service'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'

export default function ProfilePage() {
  const navigate              = useNavigate()
  const queryClient           = useQueryClient()
  const { user, logout }      = useAuthStore()
  const [editName, setEditName] = useState(false)
  const [newName, setNewName]   = useState(user?.name || '')

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => authApi.me().then(r => r.data),
  })

  const { data: myReviewsData } = useQuery({
    queryKey: ['my-reviews'],
    queryFn: () => api.get('/users/me/reviews').then(r => r.data).catch(() => ({ content: [] })),
  })

  const { mutate: deleteReview } = useMutation({
    mutationFn: (id) => reviewApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-reviews'])
      toast.success('Review deleted.')
    },
    onError: () => toast.error('Could not delete review.'),
  })

  const handleLogout = () => {
    logout()
    navigate('/')
    toast.success('Logged out successfully.')
  }

  const roleColors = {
    ROLE_ADMIN: 'badge-saffron',
    ROLE_CONTENT_MANAGER: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
    ROLE_USER: 'badge-emerald',
  }

  const displayUser = profile || user
  const reviews     = myReviewsData?.content || []

  return (
    <div className="page-enter min-h-screen pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="glass-card rounded-3xl p-8 mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-saffron-400 to-saffron-600 flex items-center justify-center text-4xl font-bold text-white shadow-xl shadow-saffron-600/30">
              {displayUser?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-emerald-500 border-2 border-navy-900 flex items-center justify-center">
              <FiCheck className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
              {editName ? (
                <div className="flex items-center gap-2">
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="input-field px-3 py-1.5 rounded-lg text-base font-bold"
                    autoFocus
                  />
                  <button onClick={() => setEditName(false)} className="text-slate-400 hover:text-white p-1">
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-white">{displayUser?.name}</h1>
                  <button onClick={() => setEditName(true)} className="text-slate-500 hover:text-saffron-400 transition-colors">
                    <FiEdit3 className="w-4 h-4" />
                  </button>
                </div>
              )}
              <span className={`badge ${roleColors[displayUser?.role] || 'badge-emerald'} self-center`}>
                {displayUser?.role?.replace('ROLE_', '').replace('_', ' ')}
              </span>
            </div>
            <p className="text-slate-400 text-sm flex items-center justify-center sm:justify-start gap-1.5 mb-4">
              <FiMail className="w-3.5 h-3.5" /> {displayUser?.email}
            </p>

            <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
              <div className="glass-card border border-white/10 px-4 py-2 rounded-xl text-center">
                <p className="text-saffron-400 font-bold text-xl">{reviews.length}</p>
                <p className="text-slate-400 text-xs">Reviews</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-400 border border-red-400/20 hover:bg-red-400/10 transition-all text-sm"
              >
                <FiLogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </div>
        </div>

        {/* My Reviews */}
        <div className="glass-card rounded-3xl p-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <FiStar className="text-saffron-400" /> My Reviews
          </h2>

          {reviews.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-3">✍️</p>
              <p className="text-slate-400">You haven't written any reviews yet.</p>
              <a href="/destinations" className="text-saffron-400 hover:underline text-sm mt-2 block">
                Explore destinations to review →
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="border border-white/10 rounded-2xl p-5 flex gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <a href={`/destinations/${r.destinationId}`} className="text-white font-semibold hover:text-saffron-400 transition-colors text-sm">
                        {r.destinationName || `Destination #${r.destinationId}`}
                      </a>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <FiStar key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'text-amber-400 fill-current' : 'text-slate-600'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-300 text-sm">{r.comment}</p>
                    <p className="text-slate-500 text-xs mt-1">{new Date(r.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <button
                    onClick={() => deleteReview(r.id)}
                    className="text-slate-500 hover:text-red-400 transition-colors p-1 flex-shrink-0"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
