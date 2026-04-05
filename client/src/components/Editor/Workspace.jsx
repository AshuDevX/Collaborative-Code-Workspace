import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'

import TopBar from '../TopBar/TopBar'
import Sidebar from '../Sidebar/Sidebar'
import Editor from '../Editor/Editor'
import BottomPanel from '../Terminal/BottomPanel'
import StatusBar from '../Editor/StatusBar'

import { useProject } from '../../context/ProjectContext'
import { useAuth } from '../../context/AuthContext'
import { useCollaboration } from "../../hooks/useCollaboration"
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts"
import { getLanguageByExt, getDefaultCode } from '../../utils/languages'

const toastStyle = { background: '#1a1a2e', color: '#e8e8f0', border: '1px solid #252540' }

export default function Workspace({ socket, connected }) {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    project, setProject,
    files, setFiles,
    activeFile,
    updateFileContent,
    addTerminalLine, clearTerminal,
    setOnlineUsers,
  } = useProject()

  const [language, setLanguage] = useState('javascript')
  const [cursorPos, setCursorPos] = useState(null)
  const [bottomHeight, setBottomHeight] = useState(220)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartY = useRef(0)
  const dragStartH = useRef(0)
  const autoSaveTimer = useRef(null)

  const {
    emitCodeChange, emitCursorMove, emitSendMessage, emitRunCode,
    emitCreateFile, emitDeleteFile, emitRenameFile,
    emitSaveVersion, emitRestoreVersion,
  } = useCollaboration(socket, projectId)

  // Load project
  useEffect(() => {
    if (!projectId) return
    axios.get(`/api/projects/${projectId}`)
      .then(res => {
        setProject(res.data)
        if (res.data.language) setLanguage(res.data.language)
        // Seed a default file if empty
        if (Object.keys(res.data.files || {}).length === 0) {
          emitCreateFile('main.js', 'javascript')
        }
      })
      .catch(() => {
        toast.error('Project not found', { style: toastStyle })
        navigate('/')
      })
  }, [projectId])

  // Keyboard shortcuts
  useEffect(() => {
    const handleSave = () => handleSave_()
    window.addEventListener('editor-save', handleSave)
    return () => window.removeEventListener('editor-save', handleSave)
  }, [activeFile, files])

  const handleSave_ = useCallback(() => {
    if (!activeFile || !socket) return
    socket.emit('save-file', { projectId, fileId: activeFile })
    toast('Saved', { icon: '💾', style: toastStyle, duration: 1500 })
  }, [activeFile, socket, projectId])

  // Auto-save every 30s
  useEffect(() => {
    autoSaveTimer.current = setInterval(() => {
      if (activeFile && socket) {
        socket.emit('save-file', { projectId, fileId: activeFile })
      }
    }, 30000)
    return () => clearInterval(autoSaveTimer.current)
  }, [activeFile, socket, projectId])

  const handleCodeChange = useCallback((fileId, content) => {
    updateFileContent(fileId, content)
    emitCodeChange(fileId, content)
  }, [updateFileContent, emitCodeChange])

  const handleCursorChange = useCallback((position) => {
    setCursorPos(position)
    if (activeFile) emitCursorMove(activeFile, position)
  }, [activeFile, emitCursorMove])

  const handleRun = useCallback(() => {
    if (!activeFile) {
      toast.error('No file open', { style: toastStyle })
      return
    }
    clearTerminal()
    addTerminalLine(`$ Running ${files[activeFile]?.name || ''} (${language})`, 'info')
    emitRunCode(activeFile, language)
  }, [activeFile, language, files, clearTerminal, addTerminalLine, emitRunCode])

  const handleCreateFile = useCallback((name) => {
    const lang = getLanguageByExt(name)
    emitCreateFile(name, lang.id)

  // Keyboard shortcuts
  const { setBottomPanel } = useProject()
  useKeyboardShortcuts({
    onSave: handleSave_,
    onRun: handleRun,
    onToggleTerminal: () => setBottomPanel('terminal'),
    onToggleChat: () => setBottomPanel('chat'),
  })

  // Bottom panel resize
  const handleResizeStart = useCallback((e) => {
    setIsDragging(true)
    dragStartY.current = e.clientY
    dragStartH.current = bottomHeight
    e.preventDefault()
  }, [bottomHeight])

  useEffect(() => {
    if (!isDragging) return
    const handleMouseMove = (e) => {
      const delta = dragStartY.current - e.clientY
      const newH = Math.max(100, Math.min(600, dragStartH.current + delta))
      setBottomHeight(newH)
    }
    const handleMouseUp = () => setIsDragging(false)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  if (!project) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-accent-purple/30 border-t-accent-purple rounded-full animate-spin" />
          <span className="text-text-muted text-sm">Loading workspace...</span>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-screen bg-bg-primary overflow-hidden"
    >
      <TopBar
        onRun={handleRun}
        onSave={handleSave_}
        language={language}
        setLanguage={setLanguage}
        connected={connected}
        projectId={projectId}
        projectName={project?.name}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          onCreateFile={handleCreateFile}
          onDeleteFile={emitDeleteFile}
          onRenameFile={emitRenameFile}
          onRestoreVersion={emitRestoreVersion}
        />

        {/* Main content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Editor area */}
          <div className="flex-1 overflow-hidden">
            <Editor
              language={language}
              onCodeChange={handleCodeChange}
              onCursorChange={handleCursorChange}
            />
          </div>

          {/* Resize handle */}
          <div
            onMouseDown={handleResizeStart}
            className={`h-1 resize-handle-h transition-colors border-t border-border-subtle ${
              isDragging ? 'bg-accent-purple/40' : 'hover:bg-accent-purple/20'
            }`}
          />

          {/* Bottom panel */}
          <BottomPanel
            onSendMessage={emitSendMessage}
            height={bottomHeight}
          />
        </div>
      </div>

      <StatusBar
        language={language}
        cursorPos={cursorPos}
        connected={connected}
      />
    </motion.div>
  )
}
// This file is complete - keyboard shortcuts are wired via the editor-save event
