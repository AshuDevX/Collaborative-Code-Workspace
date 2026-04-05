import { useEffect, useRef, useCallback } from 'react'
import { useProject } from '../context/ProjectContext'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export function useCollaboration(socket, projectId) {
  const { user } = useAuth()
  const {
    setFiles, setOnlineUsers, setCursors,
    updateFileContent, setChatMessages,
    addTerminalLine, setIsRunning, setVersions,
    files, activeFile,
  } = useProject()
  const ignoreNextChange = useRef(false)

  useEffect(() => {
    if (!socket || !projectId) return

    // Join room
    socket.emit('join-project', { projectId })

    // Project state
    socket.on('project-state', ({ files: f, users, versions: v }) => {
      setFiles(f || {})
      setOnlineUsers(users || [])
      setVersions(v || [])
    })

    // User events
    socket.on('user-joined', ({ user: u }) => {
      setOnlineUsers(prev => {
        if (prev.find(x => x.id === u.id)) return prev
        return [...prev, u]
      })
      toast(`${u.username} joined`, {
        icon: '👋',
        style: { background: '#1a1a2e', color: '#e8e8f0', border: '1px solid #252540' }
      })
    })

    socket.on('user-left', ({ userId, username }) => {
      setOnlineUsers(prev => prev.filter(u => u.id !== userId))
      setCursors(prev => { const n = {...prev}; delete n[userId]; return n })
      toast(`${username} left`, {
        icon: '👋',
        style: { background: '#1a1a2e', color: '#e8e8f0', border: '1px solid #252540' }
      })
    })

    // Code sync
    socket.on('code-update', ({ fileId, content, userId }) => {
      if (userId === user?.id) return
      ignoreNextChange.current = true
      setFiles(prev => ({
        ...prev,
        [fileId]: { ...prev[fileId], content }
      }))
    })

    // Cursor sync
    socket.on('cursor-update', ({ userId, username, position, color }) => {
      if (userId === user?.id) return
      setCursors(prev => ({ ...prev, [userId]: { username, position, color } }))
    })

    // File system sync
    socket.on('file-created', ({ file }) => {
      setFiles(prev => ({ ...prev, [file.id]: file }))
      toast(`File created: ${file.name}`, {
        icon: '📄',
        style: { background: '#1a1a2e', color: '#e8e8f0', border: '1px solid #252540' }
      })
    })

    socket.on('file-deleted', ({ fileId, name }) => {
      setFiles(prev => { const n = {...prev}; delete n[fileId]; return n })
      toast(`File deleted: ${name}`, {
        icon: '🗑️',
        style: { background: '#1a1a2e', color: '#e8e8f0', border: '1px solid #252540' }
      })
    })

    socket.on('file-renamed', ({ fileId, newName }) => {
      setFiles(prev => ({
        ...prev,
        [fileId]: { ...prev[fileId], name: newName }
      }))
    })

    // Chat
    socket.on('chat-message', (msg) => {
      setChatMessages(prev => [...prev, msg])
    })

    // Execution
    socket.on('execution-start', () => {
      setIsRunning(true)
      addTerminalLine('▶ Running...', 'info')
    })

    socket.on('execution-output', ({ data, stream }) => {
      addTerminalLine(data, stream === 'stderr' ? 'error' : 'default')
    })

    socket.on('execution-done', ({ exitCode, duration }) => {
      setIsRunning(false)
      const type = exitCode === 0 ? 'success' : 'error'
      addTerminalLine(`\n● Process exited with code ${exitCode} (${duration}ms)`, type)
    })

    // Auto-save
    socket.on('file-saved', ({ fileId }) => {
      setFiles(prev => ({
        ...prev,
        [fileId]: { ...prev[fileId], isDirty: false }
      }))
    })

    // Versions
    socket.on('version-saved', (version) => {
      setVersions(prev => [version, ...prev].slice(0, 20))
      toast('Snapshot saved', {
        icon: '💾',
        style: { background: '#1a1a2e', color: '#e8e8f0', border: '1px solid #252540' }
      })
    })

    return () => {
      socket.emit('leave-project', { projectId })
      socket.off('project-state')
      socket.off('user-joined')
      socket.off('user-left')
      socket.off('code-update')
      socket.off('cursor-update')
      socket.off('file-created')
      socket.off('file-deleted')
      socket.off('file-renamed')
      socket.off('chat-message')
      socket.off('execution-start')
      socket.off('execution-output')
      socket.off('execution-done')
      socket.off('file-saved')
      socket.off('version-saved')
    }
  }, [socket, projectId])

  const emitCodeChange = useCallback((fileId, content) => {
    if (!socket || ignoreNextChange.current) {
      ignoreNextChange.current = false
      return
    }
    socket.emit('code-change', { projectId, fileId, content })
  }, [socket, projectId])

  const emitCursorMove = useCallback((fileId, position) => {
    if (!socket) return
    socket.emit('cursor-move', { projectId, fileId, position })
  }, [socket, projectId])

  const emitSendMessage = useCallback((text) => {
    if (!socket) return
    socket.emit('chat-message', { projectId, text })
  }, [socket, projectId])

  const emitRunCode = useCallback((fileId, language) => {
    if (!socket) return
    socket.emit('run-code', { projectId, fileId, language })
  }, [socket, projectId])

  const emitCreateFile = useCallback((name, language) => {
    if (!socket) return
    socket.emit('create-file', { projectId, name, language })
  }, [socket, projectId])

  const emitDeleteFile = useCallback((fileId) => {
    if (!socket) return
    socket.emit('delete-file', { projectId, fileId })
  }, [socket, projectId])

  const emitRenameFile = useCallback((fileId, newName) => {
    if (!socket) return
    socket.emit('rename-file', { projectId, fileId, newName })
  }, [socket, projectId])

  const emitSaveVersion = useCallback((label) => {
    if (!socket) return
    socket.emit('save-version', { projectId, label })
  }, [socket, projectId])

  const emitRestoreVersion = useCallback((versionId) => {
    if (!socket) return
    socket.emit('restore-version', { projectId, versionId })
  }, [socket, projectId])

  return {
    emitCodeChange, emitCursorMove, emitSendMessage, emitRunCode,
    emitCreateFile, emitDeleteFile, emitRenameFile,
    emitSaveVersion, emitRestoreVersion,
  }
}
