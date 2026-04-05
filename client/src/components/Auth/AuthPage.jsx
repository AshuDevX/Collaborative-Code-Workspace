import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { Code2, Users, Zap, Terminal, GitBranch } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) return
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(username, password)
        toast.success('Welcome back!', { style: toastStyle })
      } else {
        await register(username, password)
        toast.success('Account created!', { style: toastStyle })
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Authentication failed', { style: toastStyle })
    } finally {
      setLoading(false)
    }
  }

  const toastStyle = { background: '#1a1a2e', color: '#e8e8f0', border: '1px solid #252540' }

  const features = [
    { icon: Users, text: 'Real-time collaboration', color: '#7c3aed' },
    { icon: Zap, text: 'Run 12+ languages instantly', color: '#06b6d4' },
    { icon: Terminal, text: 'Integrated terminal', color: '#10b981' },
    { icon: GitBranch, text: 'Version snapshots', color: '#f97316' },
  ]

  return (
    <div className="h-screen flex mesh-bg overflow-hidden">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-16 border-r border-border-subtle relative overflow-hidden">
        {/* Grid bg */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(#7c3aed 1px, transparent 1px), linear-gradient(90deg, #7c3aed 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />
        {/* Glow orbs */}
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-purple-900/20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-cyan-900/20 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center glow-purple">
              <Code2 size={20} className="text-white" />
            </div>
            <span className="font-display text-xl font-bold text-text-primary tracking-tight">CodeCollab</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <h1 className="font-display text-5xl font-bold text-text-primary leading-tight mb-6">
              Code together,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                ship faster.
              </span>
            </h1>
            <p className="text-text-secondary text-base leading-relaxed max-w-sm">
              A real-time collaborative IDE that lets your team code, run, and debug together — like being in the same room.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 space-y-4">
          {features.map(({ icon: Icon, text, color }, i) => (
            <motion.div
              key={text}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
                <Icon size={14} style={{ color }} />
              </div>
              <span className="text-text-secondary text-sm">{text}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          {/* Logo mobile */}
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center">
              <Code2 size={20} className="text-white" />
            </div>
            <span className="font-display text-xl font-bold text-text-primary">CodeCollab</span>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold text-text-primary mb-1">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-text-muted text-sm">
              {mode === 'login' ? 'Sign in to your workspace' : 'Start collaborating for free'}
            </p>
          </div>

          {/* Toggle */}
          <div className="flex bg-bg-secondary rounded-xl p-1 mb-8 border border-border-subtle">
            {['login', 'register'].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 capitalize ${
                  mode === m
                    ? 'bg-bg-elevated text-text-primary shadow-sm'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-text-secondary text-xs mb-2 uppercase tracking-wider">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="yourname"
                className="w-full bg-bg-secondary border border-border-default rounded-xl px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple/30 transition-all"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-text-secondary text-xs mb-2 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-bg-secondary border border-border-default rounded-xl px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple/30 transition-all"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 transition-all duration-200 glow-purple disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border-subtle text-center">
            <p className="text-text-muted text-xs">
              Demo: use any username/password to get started
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
