import { useProject } from '../../context/ProjectContext'
import { getLanguageById } from '../../utils/languages'
import { GitBranch, AlertCircle, CheckCircle2, Wifi, WifiOff } from 'lucide-react'

export default function StatusBar({ language, cursorPos, connected, errors = 0 }) {
  const { files, activeFile, onlineUsers } = useProject()
  const lang = getLanguageById(language)
  const file = activeFile ? files[activeFile] : null

  return (
    <div className="h-6 bg-bg-primary border-t border-border-subtle flex items-center px-3 gap-4 text-xs text-text-muted shrink-0 overflow-hidden">
      {/* Left */}
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-1 ${connected ? 'text-accent-green' : 'text-accent-red'}`}>
          {connected ? <Wifi size={10} /> : <WifiOff size={10} />}
          <span>{connected ? 'Connected' : 'Disconnected'}</span>
        </div>

        <div className="flex items-center gap-1">
          <GitBranch size={10} />
          <span>main</span>
        </div>

        {errors > 0 ? (
          <div className="flex items-center gap-1 text-accent-red">
            <AlertCircle size={10} />
            <span>{errors} error{errors !== 1 ? 's' : ''}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-accent-green">
            <CheckCircle2 size={10} />
            <span>No problems</span>
          </div>
        )}
      </div>

      <div className="flex-1" />

      {/* Right */}
      <div className="flex items-center gap-4">
        {onlineUsers.length > 0 && (
          <span className="text-accent-purple-glow">
            {onlineUsers.length} online
          </span>
        )}

        {cursorPos && (
          <span>Ln {cursorPos.lineNumber}, Col {cursorPos.column}</span>
        )}

        {file && (
          <span className={file.isDirty ? 'text-accent-orange' : ''}>
            {file.isDirty ? '● Unsaved' : 'Saved'}
          </span>
        )}

        <span>{lang.icon} {lang.label}</span>
        <span>UTF-8</span>
        <span>Spaces: 2</span>
      </div>
    </div>
  )
}
