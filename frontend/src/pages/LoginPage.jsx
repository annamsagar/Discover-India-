import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { FiMail, FiLock, FiEye, FiEyeOff, FiCompass, FiArrowLeft } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { authApi } from '../services/api.service'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  const { mutate, isPending } = useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ data }) => {
      login({ id: data.id, name: data.name, email: data.email, role: data.role }, data.accessToken)
      toast.success(`Welcome back, ${data.name}! 🎉`)
      navigate('/')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Invalid email or password.')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    mutate(form)
  }

  return (
    <div className="min-h-screen hero-bg flex items-center justify-center px-4 pt-16">
      {/* Orbs */}
      <div className="orb w-80 h-80 bg-saffron-500/15 top-20 -left-20" />
      <div className="orb w-56 h-56 bg-emerald-india-500/10 bottom-10 right-10" style={{ animationDelay: '3s' }} />

      <div className="relative z-10 w-full max-w-md page-enter">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-saffron-400 to-saffron-600 flex items-center justify-center shadow-lg shadow-saffron-600/30">
              <FiCompass className="text-white w-5 h-5" />
            </div>
            <span className="font-display text-2xl font-bold gradient-text">Discover India</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to continue your journey</p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-3xl p-8 border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className="input-field w-full pl-11 pr-4 py-3 rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="input-field w-full pl-11 pr-11 py-3 rounded-xl text-sm"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                  {showPass ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="btn-glow w-full py-3.5 rounded-xl text-white font-semibold text-base disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-saffron-400 hover:text-saffron-300 font-medium transition-colors">
              Create one
            </Link>
          </p>
        </div>

        <Link to="/" className="flex items-center justify-center gap-1 text-slate-500 hover:text-slate-300 text-sm mt-6 transition-colors">
          <FiArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    </div>
  )
}
