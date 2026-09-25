import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FiSearch, FiArrowRight, FiMapPin, FiZap, FiShield, FiStar } from 'react-icons/fi'
import { destinationApi } from '../services/api.service'
import DestinationCard from '../components/DestinationCard'
import SkeletonCard from '../components/SkeletonCard'

const STATES = [
  'Rajasthan', 'Kerala', 'Goa', 'Uttar Pradesh', 'Karnataka',
  'Tamil Nadu', 'West Bengal', 'Ladakh', 'Maharashtra', 'Himachal Pradesh',
]

const FEATURES = [
  { icon: FiZap, title: 'AI Trip Planner', desc: 'Get personalised itineraries powered by AI in seconds.' },
  { icon: FiMapPin, title: 'Route Optimiser', desc: 'Plan the most efficient route between multiple destinations.' },
  { icon: FiStar, title: 'Curated Reviews', desc: 'Read and share authentic reviews from fellow travellers.' },
  { icon: FiShield, title: 'Safe Travel Tips', desc: 'Nearby hospitals, emergency contacts and safety info.' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const { data: topRated, isLoading } = useQuery({
    queryKey: ['destinations', 'top-rated'],
    queryFn: () => destinationApi.getTopRated(6).then(r => r.data),
  })

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) navigate(`/destinations?search=${encodeURIComponent(searchQuery.trim())}`)
  }

  return (
    <div className="page-enter">
      {/* ─── HERO ──────────────────────────────────────────────────────── */}
      <section className="hero-bg relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Decorative orbs */}
        <div className="orb w-96 h-96 bg-saffron-500/20 top-20 -left-32" style={{ animationDelay: '0s' }} />
        <div className="orb w-72 h-72 bg-emerald-india-500/15 bottom-20 right-0" style={{ animationDelay: '3s' }} />
        <div className="orb w-48 h-48 bg-saffron-400/10 top-1/2 right-1/4" style={{ animationDelay: '1.5s' }} />

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 badge badge-saffron mb-6 px-4 py-2 text-sm">
            <FiZap className="w-3.5 h-3.5" />
            <span>AI-Powered Tourism Platform</span>
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-8xl font-bold text-white leading-tight mb-6">
            Discover the Soul of{' '}
            <span className="gradient-text">Incredible India</span>
          </h1>

          <p className="text-slate-300 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            From the snow-capped Himalayas to sun-kissed beaches, explore 28 states and 8 union territories
            with AI-powered trip planning and real traveller insights.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-8">
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                id="hero-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Taj Mahal, Goa, Kerala…"
                className="input-field w-full pl-12 pr-4 py-4 rounded-2xl text-base"
              />
            </div>
            <button type="submit" className="btn-glow px-8 py-4 rounded-2xl text-white font-semibold flex items-center gap-2 justify-center">
              Explore <FiArrowRight />
            </button>
          </form>

          {/* Quick state filters */}
          <div className="flex flex-wrap justify-center gap-2">
            {STATES.map((state) => (
              <button
                key={state}
                onClick={() => navigate(`/destinations?state=${state}`)}
                className="px-3 py-1.5 rounded-full text-xs font-medium glass-card border-white/10 text-slate-300 hover:text-saffron-400 hover:border-saffron-500/40 transition-all"
              >
                {state}
              </button>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-500 text-xs animate-bounce">
          <div className="w-px h-8 bg-gradient-to-b from-saffron-500/60 to-transparent" />
          <span>Scroll</span>
        </div>
      </section>

      {/* ─── TOP RATED ──────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-saffron-400 text-sm font-semibold uppercase tracking-widest mb-2">Handpicked</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Top <span className="gradient-text">Destinations</span>
            </h2>
          </div>
          <Link to="/destinations" className="hidden sm:flex items-center gap-2 text-saffron-400 hover:text-saffron-300 text-sm font-medium transition-colors">
            View all <FiArrowRight />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : topRated?.map((dest) => <DestinationCard key={dest.id} destination={dest} />)
          }
        </div>

        <div className="sm:hidden text-center mt-8">
          <Link to="/destinations" className="btn-glow px-8 py-3 rounded-2xl text-white font-semibold inline-flex items-center gap-2">
            View All Destinations <FiArrowRight />
          </Link>
        </div>
      </section>

      {/* ─── FEATURES ────────────────────────────────────────────────────── */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-saffron-600/5 via-transparent to-emerald-india-600/5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-14">
            <p className="text-saffron-400 text-sm font-semibold uppercase tracking-widest mb-2">Why Choose Us</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Everything You Need to{' '}
              <span className="gradient-text">Explore India</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="glass-card rounded-2xl p-6 text-center group hover:border-saffron-500/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-saffron-500/20 to-saffron-600/10 flex items-center justify-center mx-auto mb-4 group-hover:from-saffron-500/30 transition-all">
                  <Icon className="w-6 h-6 text-saffron-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="glass-card rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="orb w-64 h-64 bg-saffron-500/20 -top-20 -right-20" />
          <div className="orb w-48 h-48 bg-emerald-india-500/15 -bottom-16 -left-16" style={{ animationDelay: '2s' }} />
          <div className="relative z-10">
            <h2 className="font-display text-3xl sm:text-5xl font-bold text-white mb-4">
              Ready to Start Your<br />
              <span className="gradient-text">Indian Adventure?</span>
            </h2>
            <p className="text-slate-300 text-lg mb-8 max-w-lg mx-auto">
              Join thousands of travellers discovering the magic of India with AI-powered recommendations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn-glow px-10 py-4 rounded-2xl text-white font-bold text-lg">
                Get Started Free
              </Link>
              <Link to="/destinations" className="px-10 py-4 rounded-2xl border border-white/20 text-white font-semibold hover:border-saffron-500/50 hover:bg-white/5 transition-all">
                Explore Destinations
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
