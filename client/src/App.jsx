import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ProjectProvider } from './context/ProjectContext'
import { SocketProvider, useSocket } from './context/SocketContext'

import AuthPage from './components/Auth/AuthPage'
import Dashboard from './components/Auth/Dashboard'
import Workspace from './components/Editor/Workspace'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-bg-primary">
      <div className="w-8 h-8 border-2 border-accent-purple/30 border-t-accent-purple rounded-full animate-spin" />
    </div>
  )
  return user ? children : <Navigate to="/auth" replace />
}

function WorkspaceWrapper() {
  const { socket, connected } = useSocket()
  return (
    <ProjectProvider>
      <Workspace socket={socket} connected={connected} />
    </ProjectProvider>
  )
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/project/:projectId" element={
        <ProtectedRoute>
          <WorkspaceWrapper />
        </ProtectedRoute>
      } />
      <Route path="/join/:inviteCode" element={
        <ProtectedRoute>
          <JoinRedirect />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function JoinRedirect() {
  const { inviteCode } = useParams()
  return <Navigate to={`/?join=${inviteCode}`} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1a1a2e',
                color: '#e8e8f0',
                border: '1px solid #252540',
                borderRadius: '12px',
                fontSize: '12px',
                fontFamily: "'JetBrains Mono', monospace",
              },
            }}
          />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
