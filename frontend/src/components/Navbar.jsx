import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { FiSearch, FiMenu, FiX, FiUser, FiLogOut, FiCompass } from 'react-icons/fi'

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/destinations?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-saffron-400 to-saffron-600 flex items-center justify-center shadow-lg shadow-saffron-600/30">
              <FiCompass className="text-white w-4 h-4" />
            </div>
            <span className="font-display text-xl font-bold gradient-text">Discover India</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link to="/destinations" className="text-slate-300 hover:text-saffron-400 transition-colors">Explore</Link>
            <Link to="/destinations?sort=top-rated" className="text-slate-300 hover:text-saffron-400 transition-colors">Top Rated</Link>
            <Link to="/chatbot" className="text-slate-300 hover:text-saffron-400 transition-colors">AI Planner</Link>
            <Link to="/planner" className="text-slate-300 hover:text-saffron-400 transition-colors">Trip Planner</Link>
            {isAuthenticated && (
              <Link to="/my-trips" className="text-slate-300 hover:text-saffron-400 transition-colors">My Trips</Link>
            )}
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search destinations..."
                className="input-field pl-9 pr-4 py-2 rounded-xl text-sm w-56"
              />
            </div>
          </form>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link to="/profile" className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-saffron-400 to-saffron-600 flex items-center justify-center text-white text-xs font-bold">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <span className="hidden lg:block">{user?.name}</span>
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-1 text-slate-400 hover:text-red-400 transition-colors text-sm">
                  <FiLogOut className="w-4 h-4" /> <span className="hidden lg:block">Logout</span>
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-sm text-slate-300 hover:text-white transition-colors px-3 py-1.5">Login</Link>
                <Link to="/register" className="btn-glow text-sm text-white font-semibold px-4 py-1.5 rounded-xl">Sign Up</Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button className="md:hidden text-slate-300" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden glass-card border-t border-white/10 px-4 py-4 space-y-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search destinations..."
              className="input-field flex-1 pl-3 pr-3 py-2 rounded-xl text-sm"
            />
            <button type="submit" className="btn-glow px-3 py-2 rounded-xl text-white"><FiSearch /></button>
          </form>
          <Link to="/destinations" className="block text-slate-300 hover:text-saffron-400 py-1" onClick={() => setMenuOpen(false)}>Explore</Link>
          <Link to="/chatbot" className="block text-slate-300 hover:text-saffron-400 py-1" onClick={() => setMenuOpen(false)}>AI Planner</Link>
          <Link to="/planner" className="block text-slate-300 hover:text-saffron-400 py-1" onClick={() => setMenuOpen(false)}>Trip Planner</Link>
          {isAuthenticated && (
            <Link to="/my-trips" className="block text-slate-300 hover:text-saffron-400 py-1" onClick={() => setMenuOpen(false)}>My Trips</Link>
          )}
          {isAuthenticated ? (
            <button onClick={() => { handleLogout(); setMenuOpen(false) }} className="block text-red-400 py-1">Logout</button>
          ) : (
            <div className="flex gap-3">
              <Link to="/login" className="flex-1 text-center py-2 border border-white/20 rounded-xl text-sm text-slate-300" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/register" className="flex-1 text-center py-2 btn-glow rounded-xl text-sm text-white font-semibold" onClick={() => setMenuOpen(false)}>Sign Up</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
