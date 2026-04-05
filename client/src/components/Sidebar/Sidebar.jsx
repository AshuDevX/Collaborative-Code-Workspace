import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Files, Users, Plus, Trash2, Edit3, ChevronRight, ChevronDown,
  FileText, FolderOpen, Check, X, MessageSquare, History
} from 'lucide-react'
import { useProject } from '../../context/ProjectContext'
import { getLanguageByExt } from '../../utils/languages'
import { format } from 'date-fns'

const SIDEBAR_TABS = [
  { id: 'files', icon: Files, label: 'Files' },
  { id: 'users', icon: Users, label: 'Users' },
  { id: 'history', icon: History, label: 'History' },
]

export default function Sidebar({ onCreateFile, onDeleteFile, onRenameFile, onRestoreVersion }) {
  const { files, activeFile, openTabs, openFile, onlineUsers, versions } = useProject()
  const [tab, setTab] = useState('files')
  const [showNewFile, setShowNewFile] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [contextMenu, setContextMenu] = useState(null)
  const newFileRef = useRef(null)

  const handleCreateFile = (e) => {
    e.preventDefault()
    if (!newFileName.trim()) return
    const name = newFileName.includes('.') ? newFileName : newFileName + '.js'
    onCreateFile(name)
    setNewFileName('')
    setShowNewFile(false)
  }

  const startRename = (fileId, currentName) => {
    setRenamingId(fileId)
    setRenameValue(currentName)
    setContextMenu(null)
  }

  const handleRename = (fileId) => {
    if (renameValue.trim() && renameValue !== files[fileId]?.name) {
      onRenameFile(fileId, renameValue.trim())
    }
    setRenamingId(null)
  }

  const fileList = Object.values(files).sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="flex h-full">
      {/* Icon rail */}
      <div className="w-12 bg-bg-primary border-r border-border-subtle flex flex-col items-center py-3 gap-1 shrink-0">
        {SIDEBAR_TABS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setTab(tab === id ? null : id)}
            title={label}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              tab === id
                ? 'bg-accent-purple/15 text-accent-purple-glow'
                : 'text-text-muted hover:text-text-secondary hover:bg-bg-hover'
            }`}
          >
            <Icon size={17} />
          </button>
        ))}
      </div>

      {/* Panel */}
      <AnimatePresence>
        {tab && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 220, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="bg-bg-secondary border-r border-border-subtle overflow-hidden flex flex-col"
            style={{ minWidth: 0 }}
          >
            <div className="flex-1 overflow-hidden flex flex-col min-w-[220px]">
              {tab === 'files' && (
                <FilesPanel
                  fileList={fileList}
                  files={files}
                  activeFile={activeFile}
                  openFile={openFile}
                  openTabs={openTabs}
                  showNewFile={showNewFile}
                  setShowNewFile={setShowNewFile}
                  newFileName={newFileName}
                  setNewFileName={setNewFileName}
                  handleCreateFile={handleCreateFile}
                  renamingId={renamingId}
                  renameValue={renameValue}
                  setRenameValue={setRenameValue}
                  handleRename={handleRename}
                  startRename={startRename}
                  onDeleteFile={onDeleteFile}
                />
              )}
              {tab === 'users' && <UsersPanel onlineUsers={onlineUsers} />}
              {tab === 'history' && <HistoryPanel versions={versions} onRestore={onRestoreVersion} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function FilesPanel({ fileList, files, activeFile, openFile, openTabs, showNewFile, setShowNewFile, newFileName, setNewFileName, handleCreateFile, renamingId, renameValue, setRenameValue, handleRename, startRename, onDeleteFile }) {
  return (
    <>
      <div className="flex items-center justify-between px-3 py-3 border-b border-border-subtle">
        <span className="text-text-muted text-xs uppercase tracking-widest font-semibold">Explorer</span>
        <button onClick={() => setShowNewFile(!showNewFile)}
          className="w-6 h-6 rounded-md hover:bg-bg-hover text-text-muted hover:text-accent-purple-glow flex items-center justify-center transition-colors">
          <Plus size={13} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {showNewFile && (
          <form onSubmit={handleCreateFile} className="px-2 py-1">
            <div className="flex items-center gap-1">
              <FileText size={13} className="text-text-muted shrink-0" />
              <input
                autoFocus
                value={newFileName}
                onChange={e => setNewFileName(e.target.value)}
                placeholder="filename.js"
                className="flex-1 bg-bg-tertiary border border-accent-purple/40 rounded-md px-2 py-1 text-xs text-text-primary outline-none min-w-0"
                onKeyDown={e => e.key === 'Escape' && setShowNewFile(false)}
              />
              <button type="submit" className="text-accent-green"><Check size={13} /></button>
              <button type="button" onClick={() => setShowNewFile(false)} className="text-text-muted"><X size={13} /></button>
            </div>
          </form>
        )}

        {fileList.map(file => {
          const lang = getLanguageByExt(file.name)
          const isActive = activeFile === file.id
          const isOpen = openTabs.includes(file.id)
          const isDirty = file.isDirty

          return (
            <div key={file.id}
              onDoubleClick={() => startRename(file.id, file.name)}
              className={`group flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors ${
                isActive ? 'bg-bg-hover text-text-primary' : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
              }`}
              onClick={() => openFile(file.id)}
            >
              <span className="text-xs shrink-0">{lang.icon}</span>

              {renamingId === file.id ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onBlur={() => handleRename(file.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleRename(file.id)
                    if (e.key === 'Escape') setRenameValue(null)
                  }}
                  className="flex-1 bg-bg-tertiary border border-accent-purple/40 rounded px-1 text-xs outline-none min-w-0"
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <span className="flex-1 text-xs truncate">
                  {file.name}
                  {isDirty && <span className="ml-1 text-accent-orange">●</span>}
                </span>
              )}

              <button
                onClick={e => { e.stopPropagation(); onDeleteFile(file.id) }}
                className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-accent-red transition-all"
              >
                <Trash2 size={11} />
              </button>
            </div>
          )
        })}

        {fileList.length === 0 && !showNewFile && (
          <div className="px-3 py-6 text-center text-text-muted text-xs">
            <FileText size={24} className="mx-auto mb-2 opacity-30" />
            No files yet
          </div>
        )}
      </div>
    </>
  )
}

function UsersPanel({ onlineUsers }) {
  return (
    <>
      <div className="px-3 py-3 border-b border-border-subtle">
        <span className="text-text-muted text-xs uppercase tracking-widest font-semibold">Online ({onlineUsers.length})</span>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {onlineUsers.map(u => (
          <div key={u.id} className="flex items-center gap-3 px-3 py-2 hover:bg-bg-tertiary rounded-lg mx-1 transition-colors">
            <div className="relative">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: u.color || '#7c3aed' }}>
                {u.username?.[0]?.toUpperCase()}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-accent-green border-2 border-bg-secondary" />
            </div>
            <div>
              <div className="text-text-primary text-xs font-medium">{u.username}</div>
              <div className="text-text-muted text-xs">{u.currentFile ? `Editing ${u.currentFile}` : 'Online'}</div>
            </div>
          </div>
        ))}
        {onlineUsers.length === 0 && (
          <div className="px-3 py-6 text-center text-text-muted text-xs">
            <Users size={24} className="mx-auto mb-2 opacity-30" />
            No one else here
          </div>
        )}
      </div>
    </>
  )
}

function HistoryPanel({ versions, onRestore }) {
  return (
    <>
      <div className="px-3 py-3 border-b border-border-subtle">
        <span className="text-text-muted text-xs uppercase tracking-widest font-semibold">Snapshots</span>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {versions.map((v, i) => (
          <div key={v.id} className="group flex items-start gap-2 px-3 py-2 hover:bg-bg-tertiary rounded-lg mx-1 transition-colors">
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 rounded-full bg-accent-purple mt-1.5 shrink-0" />
              {i < versions.length - 1 && <div className="w-px flex-1 bg-border-subtle mt-1" style={{ minHeight: 16 }} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-text-secondary text-xs truncate">{v.label || 'Auto-save'}</div>
              <div className="text-text-muted text-xs">{format(new Date(v.timestamp), 'MMM d, HH:mm')}</div>
              <button onClick={() => onRestore(v.id)}
                className="opacity-0 group-hover:opacity-100 text-accent-purple-glow text-xs mt-1 hover:underline transition-opacity">
                Restore
              </button>
            </div>
          </div>
        ))}
        {versions.length === 0 && (
          <div className="px-3 py-6 text-center text-text-muted text-xs">
            <History size={24} className="mx-auto mb-2 opacity-30" />
            No snapshots yet
          </div>
        )}
      </div>
    </>
  )
}
