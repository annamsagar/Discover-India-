import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  FiSearch, FiFilter, FiX, FiChevronLeft, FiChevronRight,
  FiShoppingBag, FiTrash2, FiMap, FiMapPin,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import { destinationApi } from '../services/api.service'
import { useTripStore } from '../store/tripStore'
import DestinationCard from '../components/DestinationCard'
import SkeletonCard from '../components/SkeletonCard'

const STATES = [
  'All States', 'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh',
  'Assam', 'Bihar', 'Goa', 'Gujarat', 'Himachal Pradesh', 'Jammu & Kashmir',
  'Karnataka', 'Kerala', 'Ladakh', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
]

const SORT_OPTIONS = [
  { value: 'name,asc',           label: 'Name A–Z' },
  { value: 'name,desc',          label: 'Name Z–A' },
  { value: 'averageRating,desc', label: 'Highest Rated' },
]

// ── Trip Cart Drawer ──────────────────────────────────────────────────────────
function TripCartDrawer({ open, onClose }) {
  const { tripItems, removeFromTrip, clearTrip } = useTripStore()
  const navigate = useNavigate()

  const handlePlanTrip = () => {
    onClose()
    navigate('/planner', { state: { tripItems } })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-80 z-50 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <FiShoppingBag className="text-saffron-400" /> My Trip
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">{tripItems.length} destination{tripItems.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all">
            <FiX />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {tripItems.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <FiMapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No destinations yet.</p>
              <p className="text-xs mt-1">Hover a card and click <strong className="text-saffron-400">Add Trip</strong></p>
            </div>
          ) : (
            tripItems.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center gap-3 glass-card rounded-xl p-3 border border-white/10 group"
              >
                {/* Order badge */}
                <div className="w-6 h-6 rounded-full bg-saffron-500/20 border border-saffron-500/40 flex items-center justify-center text-saffron-400 text-xs font-bold flex-shrink-0">
                  {idx + 1}
                </div>

                {/* Image */}
                <img
                  src={item.imageUrl || 'https://via.placeholder.com/60?text=?'}
                  alt={item.name}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{item.name}</p>
                  <p className="text-slate-400 text-xs truncate">{item.city ? `${item.city}, ` : ''}{item.state}</p>
                </div>

                {/* Remove */}
                <button
                  onClick={() => { removeFromTrip(item.id); toast.success(`${item.name} removed`) }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-red-400 hover:bg-red-400/10 transition-all"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {tripItems.length > 0 && (
          <div className="p-4 border-t border-white/10 space-y-2">
            <button
              onClick={handlePlanTrip}
              className="btn-glow w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2"
            >
              <FiMap className="w-4 h-4" /> Plan & Map Route ({tripItems.length})
            </button>
            <button
              onClick={() => { clearTrip(); toast.success('Trip cleared') }}
              className="w-full py-2.5 rounded-xl text-slate-400 hover:text-red-400 text-sm flex items-center justify-center gap-2 hover:bg-red-400/5 transition-all"
            >
              <FiTrash2 className="w-4 h-4" /> Clear All
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DestinationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch]   = useState(searchParams.get('search') || '')
  const [state, setState]     = useState(searchParams.get('state')  || 'All States')
  const [sort, setSort]       = useState('name,asc')
  const [page, setPage]       = useState(0)
  const [showFilter, setShowFilter] = useState(false)
  const [cartOpen, setCartOpen]     = useState(false)

  const { tripItems } = useTripStore()
  const [sortBy, sortDir] = sort.split(',')

  const queryKey = ['destinations', { search, state, sort, page }]

  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: async () => {
      if (search) {
        const res = await destinationApi.search(search, { page, size: 12 })
        return res.data
      }
      if (state && state !== 'All States') {
        const res = await destinationApi.getByState(state, { page, size: 12 })
        return res.data
      }
      const res = await destinationApi.getAll({ page, size: 12, sortBy, sortDir })
      return res.data
    },
    keepPreviousData: true,
  })

  useEffect(() => { setPage(0) }, [search, state, sort])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setSearchParams(search ? { search } : {})
    setState('All States')
  }

  const handleStateChange = (s) => {
    setState(s)
    setSearch('')
    setSearchParams(s !== 'All States' ? { state: s } : {})
  }

  const clearFilters = () => {
    setSearch('')
    setState('All States')
    setSort('name,asc')
    setSearchParams({})
  }

  const destinations = data?.content || []
  const totalPages   = data?.totalPages || 0
  const totalItems   = data?.totalElements || 0
  const hasFilters   = search || state !== 'All States'

  return (
    <div className="page-enter min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-saffron-400 text-sm font-semibold uppercase tracking-widest mb-1">Browse</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              Indian <span className="gradient-text">Destinations</span>
            </h1>
            {totalItems > 0 && (
              <p className="text-slate-400 text-sm mt-1">{totalItems.toLocaleString()} destinations found</p>
            )}
          </div>

          {/* Trip Cart button */}
          <button
            id="trip-cart-btn"
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 glass-card border border-saffron-500/30 hover:border-saffron-500/70 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all group"
          >
            <FiShoppingBag className="w-5 h-5 text-saffron-400 group-hover:scale-110 transition-transform" />
            My Trip
            {tripItems.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-saffron-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg animate-bounce">
                {tripItems.length}
              </span>
            )}
          </button>
        </div>

        {/* Search + Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              id="destinations-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, city, or state…"
              className="input-field w-full pl-10 pr-4 py-3 rounded-xl text-sm"
            />
          </form>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="input-field px-4 py-3 rounded-xl text-sm cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} style={{ background: '#1a2340' }}>{o.label}</option>
            ))}
          </select>

          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all border ${showFilter ? 'bg-saffron-500/20 border-saffron-500/50 text-saffron-300' : 'glass-card border-white/10 text-slate-300 hover:border-saffron-500/30'}`}
          >
            <FiFilter className="w-4 h-4" /> Filter by State
          </button>

          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-3 rounded-xl text-red-400 hover:text-red-300 glass-card border border-red-400/20 text-sm transition-all">
              <FiX className="w-4 h-4" /> Clear
            </button>
          )}
        </div>

        {/* State filter panel */}
        {showFilter && (
          <div className="glass-card rounded-2xl p-5 mb-6 flex flex-wrap gap-2">
            {STATES.map((s) => (
              <button
                key={s}
                onClick={() => handleStateChange(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  state === s
                    ? 'bg-saffron-500 border-saffron-500 text-white'
                    : 'glass-card border-white/10 text-slate-300 hover:border-saffron-400/40 hover:text-saffron-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Tip banner when items in cart */}
        {tripItems.length > 0 && !cartOpen && (
          <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-saffron-500/10 border border-saffron-500/30 text-sm">
            <span className="text-saffron-400">🗺️</span>
            <span className="text-saffron-300 font-medium">{tripItems.length} destination{tripItems.length !== 1 ? 's' : ''} in your trip.</span>
            <button onClick={() => setCartOpen(true)} className="ml-auto text-saffron-400 hover:text-saffron-300 text-xs underline">View Trip →</button>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {(isLoading || isFetching)
            ? Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
            : destinations.length > 0
              ? destinations.map((d) => <DestinationCard key={d.id} destination={d} />)
              : (
                <div className="col-span-full text-center py-20">
                  <p className="text-4xl mb-4">🗺️</p>
                  <p className="text-slate-400 text-lg mb-2">No destinations found</p>
                  <p className="text-slate-500 text-sm">Try a different search term or clear the filters.</p>
                </div>
              )
          }
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-12">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1 px-4 py-2 rounded-xl glass-card border border-white/10 text-sm text-slate-300 disabled:opacity-40 hover:border-saffron-500/30 hover:text-saffron-300 transition-all"
            >
              <FiChevronLeft /> Previous
            </button>

            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = totalPages <= 5 ? i : Math.max(0, Math.min(page - 2, totalPages - 5)) + i
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                      p === page
                        ? 'btn-glow text-white'
                        : 'glass-card border border-white/10 text-slate-400 hover:text-saffron-300 hover:border-saffron-500/30'
                    }`}
                  >
                    {p + 1}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="flex items-center gap-1 px-4 py-2 rounded-xl glass-card border border-white/10 text-sm text-slate-300 disabled:opacity-40 hover:border-saffron-500/30 hover:text-saffron-300 transition-all"
            >
              Next <FiChevronRight />
            </button>
          </div>
        )}
      </div>

      {/* Trip Cart Drawer */}
      <TripCartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  )
}
