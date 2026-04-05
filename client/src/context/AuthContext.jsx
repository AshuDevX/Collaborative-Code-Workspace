import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('cc_token')
    const userData = localStorage.getItem('cc_user')
    if (token && userData) {
      try {
        const parsed = JSON.parse(userData)
        setUser(parsed)
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      } catch {}
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    const res = await axios.post('/api/auth/login', { username, password })
    const { token, user: u } = res.data
    localStorage.setItem('cc_token', token)
    localStorage.setItem('cc_user', JSON.stringify(u))
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(u)
    return u
  }

  const register = async (username, password) => {
    const res = await axios.post('/api/auth/register', { username, password })
    const { token, user: u } = res.data
    localStorage.setItem('cc_token', token)
    localStorage.setItem('cc_user', JSON.stringify(u))
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(u)
    return u
  }

  const logout = () => {
    localStorage.removeItem('cc_token')
    localStorage.removeItem('cc_user')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
