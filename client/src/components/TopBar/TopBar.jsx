import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Code2, Play, Square, Save, Settings, Sun, Moon, Share2,
  ChevronDown, GitBranch, Wifi, WifiOff, ArrowLeft, Check, Copy
} from 'lucide-react'
import { useProject } from '../../context/ProjectContext'
import { LANGUAGES } from '../../utils/languages'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const toastStyle = { background: '#1a1a2e', color: '#e8e8f0', border: '1px solid #252540' }

export default function TopBar({ onRun, onSave, language, setLanguage, connected, projectId, projectName }) {
  const { isRunning, theme, setTheme, onlineUsers } = useProject()
  const [showLangPicker, setShowLangPicker] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [copied, setCopied] = useState(false)
  const navigate = useNavigate()

  const currentLang = LANGUAGES.find(l => l.id === language) || LANGUAGES[0]

  const handleCopyInvite = async () => {
    const link = `${window.location.origin}/join/${projectId}`
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Invite link copied!', { style: toastStyle })
  }

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }

  return (
    <div className="h-12 bg-bg-secondary border-b border-border-subtle flex items-center px-3 gap-2 shrink-0 z-20">
      {/* Back */}
      <button onClick={() => navigate('/')}
        className="p-1.5 rounded-lg hover:bg-bg-hover text-text-muted hover:text-text-secondary transition-colors">
        <ArrowLeft size={15} />
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2 mr-2">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center">
          <Code2 size={13} className="text-white" />
        </div>
        <span className="font-display font-bold text-text-primary text-sm hidden sm:block">{projectName || 'CodeCollab'}</span>
      </div>

      <div className="w-px h-5 bg-border-subtle mx-1" />

      {/* Language selector */}
      <div className="relative">
        <button
          onClick={() => setShowLangPicker(!showLangPicker)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-tertiary border border-border-subtle hover:border-border-bright text-text-secondary hover:text-text-primary transition-all text-xs"
        >
          <span>{currentLang.icon}</span>
          <span>{currentLang.label}</span>
          <ChevronDown size={12} />
        </button>

        {showLangPicker && (
          <div className="absolute top-10 left-0 w-52 bg-bg-elevated border border-border-default rounded-xl shadow-modal z-50 overflow-hidden animate-fade-in">
            <div className="p-1 max-h-72 overflow-y-auto">
              {LANGUAGES.map(lang => (
                <button key={lang.id}
                  onClick={() => { setLanguage(lang.id); setShowLangPicker(false) }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors ${
                    language === lang.id
                      ? 'bg-accent-purple/15 text-accent-purple-glow'
                      : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                  }`}
                >
                  <span>{lang.icon}</span>
                  <span>{lang.label}</span>
                  {language === lang.id && <Check size={11} className="ml-auto" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Run/Stop */}
      <button
        onClick={onRun}
        disabled={isRunning}
        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-medium text-xs transition-all ${
          isRunning
            ? 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20'
            : 'bg-accent-green/10 border border-accent-green/30 text-accent-green hover:bg-accent-green/20'
        }`}
      >
        {isRunning ? <><Square size={12} fill="currentColor" /> Stop</> : <><Play size={12} fill="currentColor" /> Run</>}
      </button>

      {/* Save */}
      <button onClick={onSave}
        className="p-1.5 rounded-lg hover:bg-bg-hover text-text-muted hover:text-accent-purple-glow transition-colors" title="Save (Ctrl+S)">
        <Save size={15} />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Online users */}
      <div className="hidden sm:flex items-center -space-x-1.5">
        {onlineUsers.slice(0, 4).map((u, i) => (
          <div key={u.id} title={u.username}
            className="w-6 h-6 rounded-full border-2 border-bg-secondary flex items-center justify-center text-white text-xs font-bold"
            style={{ background: u.color || '#7c3aed', zIndex: 4 - i }}>
            {u.username?.[0]?.toUpperCase()}
          </div>
        ))}
        {onlineUsers.length > 4 && (
          <div className="w-6 h-6 rounded-full bg-bg-elevated border-2 border-bg-secondary flex items-center justify-center text-text-muted text-xs">
            +{onlineUsers.length - 4}
          </div>
        )}
      </div>

      {/* Connection status */}
      <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg ${connected ? 'text-accent-green' : 'text-accent-red'}`}>
        {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
        <span className="hidden sm:block">{connected ? 'Live' : 'Offline'}</span>
      </div>

      {/* Share */}
      <div className="relative">
        <button onClick={() => setShowShare(!showShare)}
          className="p-1.5 rounded-lg hover:bg-bg-hover text-text-muted hover:text-text-secondary transition-colors">
          <Share2 size={15} />
        </button>

        {showShare && (
          <div className="absolute top-10 right-0 w-72 bg-bg-elevated border border-border-default rounded-xl shadow-modal z-50 p-4 animate-fade-in">
            <p className="text-text-secondary text-xs mb-3 font-medium">Invite collaborators</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={`${window.location.origin}/join/${projectId}`}
                className="invite-input flex-1 rounded-lg px-3 py-2 text-xs text-text-secondary outline-none"
              />
              <button onClick={handleCopyInvite}
                className="px-3 py-2 rounded-lg bg-accent-purple/20 border border-accent-purple/30 text-accent-purple-glow hover:bg-accent-purple/30 transition-colors text-xs">
                {copied ? <Check size={13} /> : <Copy size={13} />}
              </button>
            </div>
            <p className="text-text-muted text-xs mt-2">Anyone with this link can join</p>
          </div>
        )}
      </div>

      {/* Theme */}
      <button onClick={toggleTheme}
        className="p-1.5 rounded-lg hover:bg-bg-hover text-text-muted hover:text-text-secondary transition-colors">
        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
      </button>
    </div>
  )
}
