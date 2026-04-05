import { useEffect } from 'react'

/**
 * Global keyboard shortcut handler for the IDE.
 * Fires custom DOM events that components can listen to.
 */
export function useKeyboardShortcuts({ onSave, onFormat, onToggleChat, onToggleTerminal, onRun }) {
  useEffect(() => {
    const handler = (e) => {
      const ctrl = e.ctrlKey || e.metaKey

      // Ctrl+S → save
      if (ctrl && e.key === 's' && !e.shiftKey) {
        e.preventDefault()
        onSave?.()
        return
      }

      // Ctrl+Shift+F → format
      if (ctrl && e.shiftKey && e.key === 'F') {
        e.preventDefault()
        onFormat?.()
        return
      }

      // Ctrl+` → toggle terminal
      if (ctrl && e.key === '`') {
        e.preventDefault()
        onToggleTerminal?.()
        return
      }

      // Ctrl+Shift+C → toggle chat
      if (ctrl && e.shiftKey && e.key === 'C') {
        e.preventDefault()
        onToggleChat?.()
        return
      }

      // F5 → run
      if (e.key === 'F5' && !ctrl) {
        e.preventDefault()
        onRun?.()
        return
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onSave, onFormat, onToggleChat, onToggleTerminal, onRun])
}
