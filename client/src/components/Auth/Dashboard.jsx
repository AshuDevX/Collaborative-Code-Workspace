import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Code2, Plus, FolderOpen, Link, LogOut, Users, Clock, Globe } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const toastStyle = { background: '#1a1a2e', color: '#e8e8f0', border: '1px solid #252540' }

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [newName, setNewName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const res = await axios.get('/api/projects')
      setProjects(res.data)
    } catch {
      toast.error('Failed to load projects', { style: toastStyle })
    } finally {
      setLoading(false)
    }
  }

  const createProject = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await axios.post('/api/projects', { name: newName })
      setProjects(prev => [res.data, ...prev])
      setShowCreate(false)
      setNewName('')
      navigate(`/project/${res.data._id}`)
    } catch {
      toast.error('Failed to create project', { style: toastStyle })
    } finally {
      setCreating(false)
    }
  }

  const joinProject = async (e) => {
    e.preventDefault()
    if (!inviteCode.trim()) return
    try {
      const res = await axios.post('/api/projects/join', { inviteCode: inviteCode.trim() })
      navigate(`/project/${res.data._id}`)
    } catch {
      toast.error('Invalid invite code', { style: toastStyle })
    }
  }

  return (
    <div className="min-h-screen mesh-bg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-12 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center">
            <Code2 size={18} className="text-white" />
          </div>
          <span className="font-display text-lg font-bold text-text-primary">CodeCollab</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-bg-secondary border border-border-subtle rounded-xl px-4 py-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <span className="text-text-secondary text-sm">{user?.username}</span>
          </div>
          <button onClick={logout} className="p-2 rounded-xl hover:bg-bg-secondary text-text-muted hover:text-text-secondary transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="font-display text-4xl font-bold text-text-primary mb-2">Your workspace</h1>
          <p className="text-text-muted">Create or join collaborative coding projects</p>
        </motion.div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <motion.button
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-4 p-6 bg-bg-secondary border border-border-default rounded-2xl hover:border-accent-purple/50 hover:bg-bg-elevated transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center group-hover:bg-accent-purple/20 transition-colors">
              <Plus size={22} className="text-accent-purple-bright" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-text-primary">New Project</div>
              <div className="text-text-muted text-sm">Create a fresh collaborative workspace</div>
            </div>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            onClick={() => setShowJoin(true)}
            className="flex items-center gap-4 p-6 bg-bg-secondary border border-border-default rounded-2xl hover:border-accent-cyan/50 hover:bg-bg-elevated transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center group-hover:bg-accent-cyan/20 transition-colors">
              <Link size={22} className="text-accent-cyan-bright" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-text-primary">Join Project</div>
              <div className="text-text-muted text-sm">Enter an invite code to collaborate</div>
            </div>
          </motion.button>
        </div>

        {/* Projects */}
        <div>
          <h2 className="font-display text-lg font-semibold text-text-secondary mb-4">Recent Projects</h2>
          {loading ? (
            <div className="flex items-center gap-3 text-text-muted py-8">
              <div className="w-5 h-5 border-2 border-accent-purple/30 border-t-accent-purple rounded-full animate-spin" />
              Loading projects...
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-16 text-text-muted">
              <FolderOpen size={40} className="mx-auto mb-3 opacity-30" />
              <p>No projects yet. Create one to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((p, i) => (
                <motion.div
                  key={p._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  onClick={() => navigate(`/project/${p._id}`)}
                  className="p-5 bg-bg-secondary border border-border-subtle rounded-2xl hover:border-border-bright cursor-pointer hover:bg-bg-elevated transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-800/40 to-cyan-800/40 border border-border-bright flex items-center justify-center">
                      <Code2 size={16} className="text-accent-purple-glow" />
                    </div>
                    <span className="text-xs text-text-muted bg-bg-tertiary rounded-lg px-2 py-1 border border-border-subtle">
                      {p.language || 'js'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-text-primary mb-1 group-hover:text-accent-purple-glow transition-colors">{p.name}</h3>
                  <div className="flex items-center gap-3 text-text-muted text-xs">
                    <span className="flex items-center gap-1">
                      <Users size={11} />
                      {p.members?.length || 1} member{(p.members?.length || 1) !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {p.updatedAt ? format(new Date(p.updatedAt), 'MMM d') : 'Just now'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <Modal onClose={() => setShowCreate(false)} title="New Project">
          <form onSubmit={createProject} className="space-y-4">
            <div>
              <label className="block text-text-secondary text-xs mb-2 uppercase tracking-wider">Project Name</label>
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="my-awesome-project"
                className="w-full bg-bg-tertiary border border-border-default rounded-xl px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-purple transition-all"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowCreate(false)}
                className="flex-1 py-2.5 rounded-xl border border-border-default text-text-secondary hover:text-text-primary hover:border-border-bright transition-all text-sm">
                Cancel
              </button>
              <button type="submit" disabled={creating}
                className="flex-1 py-2.5 rounded-xl bg-accent-purple hover:bg-accent-purple-bright text-white font-medium transition-all text-sm disabled:opacity-50">
                {creating ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Join modal */}
      {showJoin && (
        <Modal onClose={() => setShowJoin(false)} title="Join Project">
          <form onSubmit={joinProject} className="space-y-4">
            <div>
              <label className="block text-text-secondary text-xs mb-2 uppercase tracking-wider">Invite Code</label>
              <input
                autoFocus
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value)}
                placeholder="paste-invite-code-here"
                className="w-full bg-bg-tertiary border border-border-default rounded-xl px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan transition-all"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowJoin(false)}
                className="flex-1 py-2.5 rounded-xl border border-border-default text-text-secondary hover:text-text-primary hover:border-border-bright transition-all text-sm">
                Cancel
              </button>
              <button type="submit"
                className="flex-1 py-2.5 rounded-xl bg-accent-cyan text-bg-primary font-medium hover:bg-accent-cyan-bright transition-all text-sm">
                Join Project
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

function Modal({ onClose, title, children }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-sm mx-4 bg-bg-secondary border border-border-default rounded-2xl p-6 shadow-modal"
      >
        <h2 className="font-display text-lg font-bold text-text-primary mb-5">{title}</h2>
        {children}
      </motion.div>
    </div>
  )
}
