import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Terminal as TermIcon, MessageSquare, Trash2, ChevronDown, ChevronUp, Send, Hash } from 'lucide-react'
import { useProject } from '../../context/ProjectContext'
import { useAuth } from '../../context/AuthContext'
import { format } from 'date-fns'

export default function BottomPanel({ onSendMessage, height, onResize }) {
  const { terminal, clearTerminal, chatMessages, bottomPanel, setBottomPanel, isRunning, onlineUsers } = useProject()
  const { user } = useAuth()
  const termRef = useRef(null)
  const [chatInput, setChatInput] = useState('')
  const [typingUsers, setTypingUsers] = useState([])
  const chatEndRef = useRef(null)
  const typingTimerRef = useRef(null)

  useEffect(() => {
    if (termRef.current && bottomPanel === 'terminal') {
      termRef.current.scrollTop = termRef.current.scrollHeight
    }
  }, [terminal, bottomPanel])

  useEffect(() => {
    if (chatEndRef.current && bottomPanel === 'chat') {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages, bottomPanel])

  const handleSendChat = (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    onSendMessage(chatInput.trim())
    setChatInput('')
  }

  const TABS = [
    { id: 'terminal', label: 'Terminal', icon: TermIcon },
    { id: 'chat', label: 'Chat', icon: MessageSquare, badge: chatMessages.length },
  ]

  return (
    <div className="flex flex-col bg-bg-primary border-t border-border-subtle" style={{ height }}>
      {/* Tab bar */}
      <div className="flex items-center border-b border-border-subtle px-3 h-9 shrink-0 gap-1">
        {TABS.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => setBottomPanel(id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
              bottomPanel === id
                ? 'bg-bg-secondary text-text-primary'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            <Icon size={12} />
            <span>{label}</span>
            {id === 'terminal' && isRunning && (
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
            )}
          </button>
        ))}

        <div className="flex-1" />

        {bottomPanel === 'terminal' && (
          <button onClick={clearTerminal}
            className="p-1.5 rounded hover:bg-bg-secondary text-text-muted hover:text-text-secondary transition-colors" title="Clear terminal">
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {bottomPanel === 'terminal' && (
          <div ref={termRef} className="h-full overflow-y-auto p-3 font-mono text-xs leading-relaxed">
            {terminal.length === 0 && (
              <div className="text-text-muted flex items-center gap-2">
                <TermIcon size={12} />
                <span>Run your code to see output here</span>
              </div>
            )}
            {terminal.map((line) => (
              <div key={line.id} className={`terminal-line ${line.type}`}>
                {line.type === 'info' && <span className="text-accent-cyan">{'> '}</span>}
                {line.type === 'error' && <span className="text-accent-red">{'✕ '}</span>}
                {line.type === 'success' && <span className="text-accent-green">{'✓ '}</span>}
                {line.text}
              </div>
            ))}
            {isRunning && (
              <div className="flex items-center gap-2 text-text-muted mt-1">
                <div className="flex gap-1">
                  <div className="w-1 h-1 rounded-full bg-accent-purple animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1 h-1 rounded-full bg-accent-purple animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1 h-1 rounded-full bg-accent-purple animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>executing...</span>
              </div>
            )}
          </div>
        )}

        {bottomPanel === 'chat' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {chatMessages.length === 0 && (
                <div className="text-text-muted text-xs flex items-center gap-2">
                  <MessageSquare size={12} />
                  <span>Chat with your team while you code</span>
                </div>
              )}
              {chatMessages.map((msg) => {
                const isOwn = msg.userId === user?.id
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-start gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0 mt-0.5"
                      style={{ background: msg.color || '#7c3aed', fontSize: 9, fontWeight: 700 }}
                    >
                      {msg.username?.[0]?.toUpperCase()}
                    </div>
                    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-xs`}>
                      <div className={`flex items-baseline gap-1.5 mb-0.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                        <span className="text-text-muted" style={{ fontSize: 10 }}>{msg.username}</span>
                        <span className="text-text-muted" style={{ fontSize: 9 }}>
                          {format(new Date(msg.timestamp), 'HH:mm')}
                        </span>
                      </div>
                      <div className={`px-3 py-1.5 rounded-xl border text-xs ${isOwn ? 'chat-bubble-own' : 'chat-bubble-other'} text-text-primary`}>
                        {msg.text}
                      </div>
                    </div>
                  </motion.div>
                )
              })}

              {/* Typing indicators */}
              {typingUsers.length > 0 && (
                <div className="flex items-center gap-2 text-text-muted" style={{ fontSize: 10 }}>
                  <div className="flex gap-0.5">
                    {[0,1,2].map(i => (
                      <div key={i} className="typing-dot w-1 h-1 rounded-full bg-text-muted" />
                    ))}
                  </div>
                  {typingUsers.join(', ')} typing...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendChat} className="flex items-center gap-2 px-3 py-2 border-t border-border-subtle">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Message your team..."
                className="flex-1 bg-bg-secondary border border-border-subtle rounded-lg px-3 py-1.5 text-xs text-text-primary placeholder-text-muted outline-none focus:border-accent-purple/50 transition-colors"
              />
              <button type="submit"
                disabled={!chatInput.trim()}
                className="w-7 h-7 rounded-lg bg-accent-purple/20 border border-accent-purple/30 flex items-center justify-center text-accent-purple-glow hover:bg-accent-purple/30 disabled:opacity-30 transition-all">
                <Send size={12} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
