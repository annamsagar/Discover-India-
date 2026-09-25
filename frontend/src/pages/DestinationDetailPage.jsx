import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { FiMapPin, FiStar, FiClock, FiDollarSign, FiArrowLeft, FiSend } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { destinationApi, reviewApi } from '../services/api.service'
import { useAuthStore } from '../store/authStore'

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          className="focus:outline-none"
        >
          <FiStar className={`w-7 h-7 transition-colors ${s <= (hover || value) ? 'text-amber-400 fill-current' : 'text-slate-600'}`} />
        </button>
      ))}
    </div>
  )
}

export default function DestinationDetailPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()
  const [review, setReview] = useState({ rating: 0, comment: '' })

  const { data: destination, isLoading } = useQuery({
    queryKey: ['destination', id],
    queryFn: () => destinationApi.getById(id).then(r => r.data),
  })

  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => reviewApi.getByDestination(id, { page: 0, size: 10 }).then(r => r.data),
  })

  const { mutate: submitReview, isPending } = useMutation({
    mutationFn: () => reviewApi.create(id, review),
    onSuccess: () => {
      toast.success('Review submitted! 🙏')
      setReview({ rating: 0, comment: '' })
      queryClient.invalidateQueries(['reviews', id])
      queryClient.invalidateQueries(['destination', id])
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Could not submit review.')
    },
  })

  const handleReviewSubmit = (e) => {
    e.preventDefault()
    if (review.rating === 0) { toast.error('Please select a star rating.'); return }
    submitReview()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 max-w-5xl mx-auto px-4 py-12">
        <div className="h-80 shimmer rounded-3xl mb-8" />
        <div className="space-y-4">
          <div className="h-8 shimmer rounded-xl w-1/2" />
          <div className="h-4 shimmer rounded-lg w-1/4" />
          <div className="h-32 shimmer rounded-xl" />
        </div>
      </div>
    )
  }

  if (!destination) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4">🗺️</p>
          <p className="text-white text-2xl font-bold mb-2">Destination not found</p>
          <Link to="/destinations" className="text-saffron-400 hover:underline">← Back to Destinations</Link>
        </div>
      </div>
    )
  }

  const reviews = reviewsData?.content || []

  return (
    <div className="page-enter min-h-screen pt-16">
      {/* Hero Image */}
      <div className="relative h-72 sm:h-96 overflow-hidden">
        <img
          src={destination.imageUrl || 'https://via.placeholder.com/1200x500?text=Discover+India'}
          alt={destination.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/40 to-transparent" />
        <Link to="/destinations" className="absolute top-6 left-6 flex items-center gap-2 glass-card border border-white/20 px-3 py-2 rounded-xl text-white text-sm hover:border-saffron-500/50 transition-all">
          <FiArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 pb-20">
        <div className="glass-card rounded-3xl p-8 mb-8">
          {/* Title & meta */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{destination.name}</h1>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <FiMapPin className="w-4 h-4 text-saffron-400" />
                <span>{destination.city ? `${destination.city}, ` : ''}{destination.state}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end mb-1">
                {[1,2,3,4,5].map(s => (
                  <FiStar key={s} className={`w-5 h-5 ${s <= Math.round(destination.averageRating) ? 'text-amber-400 fill-current' : 'text-slate-600'}`} />
                ))}
              </div>
              <p className="text-white font-bold text-xl">{destination.averageRating?.toFixed(1)}</p>
              <p className="text-slate-400 text-xs">{destination.reviewCount} reviews</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-4 mb-6">
            {destination.entryFee !== null && (
              <div className="flex items-center gap-2 glass-card rounded-xl px-4 py-2">
                <FiDollarSign className="w-4 h-4 text-saffron-400" />
                <span className="text-white text-sm font-medium">
                  {destination.entryFee === 0 ? 'Free Entry' : `₹${destination.entryFee?.toLocaleString()}`}
                </span>
              </div>
            )}
            {destination.bestTimeToVisit && (
              <div className="flex items-center gap-2 glass-card rounded-xl px-4 py-2">
                <FiClock className="w-4 h-4 text-emerald-india-500" />
                <span className="text-white text-sm font-medium">Best: {destination.bestTimeToVisit}</span>
              </div>
            )}
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-6">
            {destination.categories?.map(cat => (
              <span key={cat} className="badge badge-saffron">{cat}</span>
            ))}
          </div>

          {/* Description */}
          <p className="text-slate-300 leading-relaxed">{destination.description}</p>

          {/* Map Embed */}
          {destination.latitude && destination.longitude && (
            <div className="mt-8 rounded-2xl overflow-hidden h-64 border border-white/10">
              <iframe
                title={`Map of ${destination.name}`}
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://maps.google.com/maps?q=${destination.latitude},${destination.longitude}&z=13&output=embed`}
                allowFullScreen
              ></iframe>
            </div>
          )}

          {/* Nearby Services */}
          <div className="mt-8 pt-8 border-t border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">Nearby Services</h3>
            <div className="flex flex-wrap gap-4">
              <a
                href={`https://www.google.com/maps/search/Hotels+near+${destination.latitude},${destination.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-glow px-4 py-2 rounded-xl text-white text-sm font-semibold inline-flex items-center gap-2"
              >
                🏨 Find Hotels
              </a>
              <a
                href={`https://www.google.com/maps/search/Hospitals+near+${destination.latitude},${destination.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl border border-white/20 hover:border-red-400 hover:text-red-400 text-white text-sm font-semibold transition-all inline-flex items-center gap-2"
              >
                🏥 Emergency / Hospitals
              </a>
            </div>
          </div>
        </div>

        {/* Reviews section */}
        <div className="glass-card rounded-3xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            Traveller <span className="gradient-text">Reviews</span>
          </h2>

          {/* Write review */}
          {isAuthenticated ? (
            <form onSubmit={handleReviewSubmit} className="mb-8 border border-white/10 rounded-2xl p-5 space-y-4">
              <h3 className="text-white font-semibold">Share your experience</h3>
              <StarPicker value={review.rating} onChange={(r) => setReview({ ...review, rating: r })} />
              <textarea
                value={review.comment}
                onChange={(e) => setReview({ ...review, comment: e.target.value })}
                placeholder="Tell fellow travellers about your visit…"
                rows={3}
                required
                className="input-field w-full px-4 py-3 rounded-xl text-sm resize-none"
              />
              <button
                type="submit"
                disabled={isPending}
                className="btn-glow flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-60"
              >
                <FiSend className="w-4 h-4" /> {isPending ? 'Submitting…' : 'Submit Review'}
              </button>
            </form>
          ) : (
            <div className="mb-8 text-center py-8 border border-white/10 rounded-2xl">
              <p className="text-slate-400 mb-3">Sign in to leave a review</p>
              <Link to="/login" className="btn-glow px-6 py-2.5 rounded-xl text-white font-semibold text-sm">Sign In</Link>
            </div>
          )}

          {/* Review list */}
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <p className="text-slate-500 text-center py-6">No reviews yet. Be the first to share your experience!</p>
            ) : reviews.map(r => (
              <div key={r.id} className="border border-white/10 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-saffron-400 to-saffron-600 flex items-center justify-center text-white text-sm font-bold">
                      {r.userName?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">{r.userName}</p>
                      <p className="text-slate-500 text-xs">{new Date(r.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <FiStar key={s} className={`w-4 h-4 ${s <= r.rating ? 'text-amber-400 fill-current' : 'text-slate-600'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{r.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
