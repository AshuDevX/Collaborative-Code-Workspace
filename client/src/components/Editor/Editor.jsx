import { useRef, useEffect, useCallback, useState } from 'react'
import MonacoEditor from '@monaco-editor/react'
import { useProject } from '../../context/ProjectContext'
import { getLanguageByExt, getLanguageById } from '../../utils/languages'
import { X, Circle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Editor({ language, onCodeChange, onCursorChange }) {
  const { files, activeFile, openTabs, closeTab, openFile, cursors, theme } = useProject()
  const editorRef = useRef(null)
  const monacoRef = useRef(null)
  const decorationsRef = useRef([])
  const cursorWidgetsRef = useRef({})

  const activeFileData = activeFile ? files[activeFile] : null
  const code = activeFileData?.content || ''
  const monacoLang = getLanguageById(language).monaco

  // Apply remote cursors as decorations
  useEffect(() => {
    const editor = editorRef.current
    const monaco = monacoRef.current
    if (!editor || !monaco) return

    // Clear old widgets
    Object.values(cursorWidgetsRef.current).forEach(w => {
      try { editor.removeContentWidget(w) } catch {}
    })
    cursorWidgetsRef.current = {}

    const newDecorations = []

    Object.entries(cursors).forEach(([userId, cursor]) => {
      if (!cursor?.position) return
      const { lineNumber, column } = cursor.position

      // Cursor line decoration
      newDecorations.push({
        range: new monaco.Range(lineNumber, column, lineNumber, column + 1),
        options: {
          className: 'remote-cursor',
          beforeContentClassName: 'remote-cursor-line',
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        }
      })

      // Username widget
      const widget = {
        getId: () => `cursor-${userId}`,
        getDomNode: () => {
          const el = document.createElement('div')
          el.className = 'remote-cursor-label'
          el.textContent = cursor.username
          el.style.cssText = `
            position: absolute;
            background: ${cursor.color || '#7c3aed'};
            color: white;
            font-size: 10px;
            padding: 1px 6px;
            border-radius: 3px;
            white-space: nowrap;
            pointer-events: none;
            font-family: 'JetBrains Mono', monospace;
            transform: translateY(-100%);
            margin-top: -2px;
          `
          return el
        },
        getPosition: () => ({
          position: { lineNumber, column },
          preference: [monaco.editor.ContentWidgetPositionPreference.ABOVE]
        })
      }

      editor.addContentWidget(widget)
      cursorWidgetsRef.current[userId] = widget
    })

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations)
  }, [cursors])

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // Theme
    monaco.editor.defineTheme('codecollab-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '4a4a6a', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'a78bfa', fontStyle: 'bold' },
        { token: 'string', foreground: '34d399' },
        { token: 'number', foreground: 'fb923c' },
        { token: 'type', foreground: '38bdf8' },
        { token: 'function', foreground: 'c084fc' },
        { token: 'variable', foreground: 'e8e8f0' },
        { token: 'operator', foreground: '7dd3fc' },
        { token: 'delimiter', foreground: '5a5a78' },
      ],
      colors: {
        'editor.background': '#0a0a0f',
        'editor.foreground': '#e8e8f0',
        'editor.lineHighlightBackground': '#141420',
        'editor.selectionBackground': '#7c3aed40',
        'editor.inactiveSelectionBackground': '#7c3aed20',
        'editorLineNumber.foreground': '#2e2e4a',
        'editorLineNumber.activeForeground': '#7c3aed',
        'editorCursor.foreground': '#a78bfa',
        'editorWhitespace.foreground': '#1e1e32',
        'editorIndentGuide.background': '#1e1e32',
        'editorIndentGuide.activeBackground': '#3a3a5c',
        'editor.findMatchBackground': '#7c3aed40',
        'editor.findMatchHighlightBackground': '#7c3aed20',
        'editorBracketMatch.background': '#7c3aed30',
        'editorBracketMatch.border': '#7c3aed80',
        'scrollbarSlider.background': '#25254060',
        'scrollbarSlider.hoverBackground': '#3a3a5c80',
        'scrollbarSlider.activeBackground': '#7c3aed60',
        'minimap.background': '#0a0a0f',
      }
    })
    monaco.editor.setTheme('codecollab-dark')

    // Keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      window.dispatchEvent(new CustomEvent('editor-save'))
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
      editor.getAction('editor.action.formatDocument')?.run()
    })

    // Cursor position tracking
    editor.onDidChangeCursorPosition((e) => {
      onCursorChange?.({
        lineNumber: e.position.lineNumber,
        column: e.position.column,
      })
    })
  }

  const handleChange = useCallback((value) => {
    if (activeFile) {
      onCodeChange?.(activeFile, value || '')
    }
  }, [activeFile, onCodeChange])

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex items-center bg-bg-primary border-b border-border-subtle overflow-x-auto shrink-0 h-9">
        {openTabs.map(fileId => {
          const file = files[fileId]
          if (!file) return null
          const lang = getLanguageByExt(file.name)
          const isActive = fileId === activeFile

          return (
            <div
              key={fileId}
              onClick={() => openFile(fileId)}
              className={`group flex items-center gap-2 px-4 h-full border-r border-border-subtle cursor-pointer transition-colors shrink-0 ${
                isActive
                  ? 'bg-bg-secondary text-text-primary border-b-2 border-b-accent-purple'
                  : 'text-text-muted hover:text-text-secondary hover:bg-bg-secondary/50'
              }`}
              style={isActive ? { marginBottom: -1 } : {}}
            >
              <span className="text-xs">{lang.icon}</span>
              <span className="text-xs">{file.name}</span>
              {file.isDirty && <span className="text-accent-orange text-xs">●</span>}
              <button
                onClick={e => { e.stopPropagation(); closeTab(fileId) }}
                className="opacity-0 group-hover:opacity-100 hover:text-accent-red transition-all ml-1"
              >
                <X size={11} />
              </button>
            </div>
          )
        })}
      </div>

      {/* Editor */}
      <div className="flex-1 relative overflow-hidden">
        {activeFile && activeFileData ? (
          <MonacoEditor
            height="100%"
            language={monacoLang}
            value={code}
            onChange={handleChange}
            onMount={handleEditorDidMount}
            options={{
              fontSize: 13,
              fontFamily: "'JetBrains Mono', monospace",
              fontLigatures: true,
              lineHeight: 22,
              letterSpacing: 0.3,
              minimap: { enabled: true, scale: 0.8, showSlider: 'mouseover' },
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              formatOnPaste: true,
              formatOnType: false,
              tabSize: 2,
              insertSpaces: true,
              wordWrap: 'on',
              padding: { top: 16, bottom: 16 },
              renderLineHighlight: 'gutter',
              bracketPairColorization: { enabled: true },
              guides: { bracketPairs: true, indentation: true },
              suggest: { showKeywords: true, showSnippets: true },
              quickSuggestions: { other: true, comments: false, strings: false },
              overviewRulerLanes: 0,
              hideCursorInOverviewRuler: true,
              scrollbar: {
                verticalScrollbarSize: 6,
                horizontalScrollbarSize: 6,
                useShadows: false,
              },
              renderWhitespace: 'none',
              stickyScroll: { enabled: true },
            }}
          />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-text-muted select-none">
      <div className="w-16 h-16 rounded-2xl bg-bg-secondary border border-border-subtle flex items-center justify-center mb-6">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect x="4" y="4" width="24" height="4" rx="2" fill="#3a3a5c"/>
          <rect x="4" y="12" width="18" height="4" rx="2" fill="#252540"/>
          <rect x="4" y="20" width="22" height="4" rx="2" fill="#252540"/>
          <rect x="4" y="28" width="14" height="4" rx="2" fill="#1e1e32"/>
        </svg>
      </div>
      <p className="text-sm font-medium text-text-secondary mb-1">No file open</p>
      <p className="text-xs text-text-muted">Select a file from the explorer or create a new one</p>
      <div className="mt-6 grid grid-cols-2 gap-2 text-xs text-text-muted">
        <kbd className="px-2 py-1 bg-bg-secondary rounded border border-border-subtle">Ctrl+S</kbd>
        <span className="self-center">Save file</span>
        <kbd className="px-2 py-1 bg-bg-secondary rounded border border-border-subtle">Ctrl+Shift+F</kbd>
        <span className="self-center">Format code</span>
      </div>
    </div>
  )
}
