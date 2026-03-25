// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react'
import { tokenStorage, authApi, profileApi } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true) // cek token saat app load

  // Cek token yang tersimpan saat pertama load
  useEffect(() => {
    const init = async () => {
      const token = tokenStorage.getAccess()
      if (token) {
        try {
          const data = await profileApi.getMe()
          setUser(data)
        } catch {
          tokenStorage.clear()
        }
      }
      setLoading(false)
    }
    init()
  }, [])

  const login = async (email, password) => {
    const data = await authApi.login(email, password)
    tokenStorage.setTokens(data.accessToken, data.refreshToken)
    const profile = await profileApi.getMe()
    setUser(profile)
    return data
  }

  const logout = async () => {
    try { await authApi.logout() } catch {}
    tokenStorage.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
