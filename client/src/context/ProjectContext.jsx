import { createContext, useContext, useState, useCallback } from 'react'

const ProjectContext = createContext(null)

export function ProjectProvider({ children }) {
  const [project, setProject] = useState(null)
  const [files, setFiles] = useState({})
  const [activeFile, setActiveFile] = useState(null)
  const [openTabs, setOpenTabs] = useState([])
  const [onlineUsers, setOnlineUsers] = useState([])
  const [chatMessages, setChatMessages] = useState([])
  const [cursors, setCursors] = useState({})
  const [versions, setVersions] = useState([])
  const [terminal, setTerminal] = useState([])
  const [isRunning, setIsRunning] = useState(false)
  const [theme, setTheme] = useState('dark')
  const [bottomPanel, setBottomPanel] = useState('terminal') // terminal | chat | output

  const openFile = useCallback((fileId) => {
    setActiveFile(fileId)
    setOpenTabs(prev => prev.includes(fileId) ? prev : [...prev, fileId])
  }, [])

  const closeTab = useCallback((fileId) => {
    setOpenTabs(prev => {
      const newTabs = prev.filter(t => t !== fileId)
      if (activeFile === fileId) {
        setActiveFile(newTabs[newTabs.length - 1] || null)
      }
      return newTabs
    })
  }, [activeFile])

  const updateFileContent = useCallback((fileId, content) => {
    setFiles(prev => ({
      ...prev,
      [fileId]: { ...prev[fileId], content, isDirty: true }
    }))
  }, [])

  const addTerminalLine = useCallback((line, type = 'default') => {
    setTerminal(prev => [...prev, { text: line, type, id: Date.now() + Math.random() }])
  }, [])

  const clearTerminal = useCallback(() => setTerminal([]), [])

  return (
    <ProjectContext.Provider value={{
      project, setProject,
      files, setFiles,
      activeFile, setActiveFile,
      openTabs, setOpenTabs,
      onlineUsers, setOnlineUsers,
      chatMessages, setChatMessages,
      cursors, setCursors,
      versions, setVersions,
      terminal, setTerminal,
      isRunning, setIsRunning,
      theme, setTheme,
      bottomPanel, setBottomPanel,
      openFile, closeTab, updateFileContent,
      addTerminalLine, clearTerminal,
    }}>
      {children}
    </ProjectContext.Provider>
  )
}

export const useProject = () => useContext(ProjectContext)
