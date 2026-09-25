import { Link } from 'react-router-dom'
import { FiCompass, FiHeart, FiGithub, FiMail } from 'react-icons/fi'

export default function Footer() {
  return (
    <footer className="border-t border-white/10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-saffron-400 to-saffron-600 flex items-center justify-center">
                <FiCompass className="text-white w-4 h-4" />
              </div>
              <span className="font-display text-xl font-bold gradient-text">Discover India</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Your AI-powered guide to exploring the incredible diversity, heritage, and natural beauty of India.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Explore</h4>
            <ul className="space-y-2">
              {['Destinations', 'Top Rated', 'By State', 'AI Planner'].map((item) => (
                <li key={item}>
                  <Link to={`/${item.toLowerCase().replace(' ', '-')}`} className="text-slate-400 hover:text-saffron-400 text-sm transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Account</h4>
            <ul className="space-y-2">
              {[['Login', '/login'], ['Register', '/register'], ['My Profile', '/profile']].map(([label, path]) => (
                <li key={label}>
                  <Link to={path} className="text-slate-400 hover:text-saffron-400 text-sm transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-500 text-xs">
            © {new Date().getFullYear()} Discover India. Built as a Final Year Project.
          </p>
          <p className="text-slate-500 text-xs flex items-center gap-1">
            Made with <FiHeart className="text-red-400 w-3 h-3" /> in India
          </p>
        </div>
      </div>
    </footer>
  )
}
