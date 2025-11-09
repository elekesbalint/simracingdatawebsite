import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { hash as bcryptHash, compare as bcryptCompare } from 'bcryptjs'
import { AuthUser, UserStatus } from '../types'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'

interface AuthContextValue {
  users: AuthUser[]
  currentUser: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  register: (payload: { name: string; email: string; password: string }) => Promise<{
    success: boolean
    message: string
  }>
  logout: () => void
  approveUser: (userId: string) => Promise<void>
  rejectUser: (userId: string) => Promise<void>
  refreshUsers: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const CURRENT_USER_KEY = 'auth:current-user-id'
const DEFAULT_ADMIN_USERNAME = 'admin'
const DEFAULT_ADMIN_NAME = 'Admin'
const DEFAULT_ADMIN_PASSWORD = 'Tutumester2006'

const mapRowToAuthUser = (row: any): AuthUser => ({
  id: row.id,
  name: row.name,
  email: row.email,
  password: row.password,
  role: row.role,
  status: row.status,
  createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString()
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<AuthUser[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    if (typeof window === 'undefined') {
      return null
    }
    return window.localStorage.getItem(CURRENT_USER_KEY)
  })

  const currentUser = useMemo(
    () => (currentUserId ? users.find((user) => user.id === currentUserId) ?? null : null),
    [currentUserId, users]
  )

  const ensureDefaultAdminExists = useCallback(async () => {
    if (!isSupabaseConfigured) {
      return
    }

    const { data, error } = await supabase
      .from('auth_users')
      .select('id, email, password, role, status, name')
      .eq('role', 'admin')
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Supabase admin check failed:', error.message)
      return
    }

    const hashedPassword = await bcryptHash(DEFAULT_ADMIN_PASSWORD, 10)

    if (!data) {
      const { error: insertError } = await supabase.from('auth_users').insert({
        name: DEFAULT_ADMIN_NAME,
        email: DEFAULT_ADMIN_USERNAME,
        password: hashedPassword,
        role: 'admin',
        status: 'approved'
      })

      if (insertError) {
        console.error('Supabase admin seed failed:', insertError.message)
      }

      return
    }

    const passwordMatches = await bcryptCompare(DEFAULT_ADMIN_PASSWORD, data.password ?? '')
    const requiresUpdate =
      data.email !== DEFAULT_ADMIN_USERNAME ||
      !passwordMatches ||
      data.status !== 'approved' ||
      data.name !== DEFAULT_ADMIN_NAME

    if (requiresUpdate) {
      const { error: updateError } = await supabase
        .from('auth_users')
        .update({
          name: DEFAULT_ADMIN_NAME,
          email: DEFAULT_ADMIN_USERNAME,
          password: hashedPassword,
          status: 'approved'
        })
        .eq('id', data.id)

      if (updateError) {
        console.error('Supabase admin password upgrade failed:', updateError.message)
      }
    }
  }, [])

  const loadUsers = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setUsers([])
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('auth_users')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Supabase fetch users failed:', error.message)
      setUsers([])
    } else {
      setUsers(data.map(mapRowToAuthUser))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const initialise = async () => {
      if (!isSupabaseConfigured) {
        console.error('Supabase environment variables are missing. Auth features require configuration.')
        setLoading(false)
        return
      }

      await ensureDefaultAdminExists()
      await loadUsers()
    }

    initialise()
  }, [ensureDefaultAdminExists, loadUsers])

  useEffect(() => {
    if (!currentUserId) return
    const user = users.find((u) => u.id === currentUserId)
    if (!user || user.status !== 'approved') {
      setCurrentUserId(null)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(CURRENT_USER_KEY)
      }
    }
  }, [currentUserId, users])

  const login = useCallback<
    AuthContextValue['login']
  >(async (email, password) => {
    if (!isSupabaseConfigured) {
      return { success: false, message: 'Supabase konfiguráció hiányzik.' }
    }

    const normalizedEmail = email.trim().toLowerCase()
    const { data, error } = await supabase
      .from('auth_users')
      .select('*')
      .eq('email', normalizedEmail)
      .limit(1)
      .maybeSingle()

    if (error || !data) {
      return { success: false, message: 'Hibás e-mail vagy jelszó.' }
    }

    const user = mapRowToAuthUser(data)

    const passwordsMatch = await bcryptCompare(password, user.password ?? '')

    if (!passwordsMatch) {
      return { success: false, message: 'Hibás e-mail vagy jelszó.' }
    }

    if (user.status === 'pending') {
      return { success: false, message: 'Regisztrációd még admin jóváhagyásra vár.' }
    }

    if (user.status === 'rejected') {
      return { success: false, message: 'A regisztrációdat az admin elutasította.' }
    }

    setCurrentUserId(user.id)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CURRENT_USER_KEY, user.id)
    }

    await loadUsers()
    return { success: true }
  }, [loadUsers])

  const register = useCallback<
    AuthContextValue['register']
  >(async ({ name, email, password }) => {
    if (!isSupabaseConfigured) {
      return { success: false, message: 'Supabase konfiguráció hiányzik.' }
    }

    const trimmedName = name.trim()
    const normalizedEmail = email.trim().toLowerCase()

    if (!trimmedName || !normalizedEmail || !password) {
      return { success: false, message: 'Minden mező kitöltése kötelező.' }
    }

    const { data: existing, error: existingError } = await supabase
      .from('auth_users')
      .select('id')
      .eq('email', normalizedEmail)
      .limit(1)

    if (existingError) {
      console.error('Supabase e-mail ellenőrzés hiba:', existingError.message)
      return { success: false, message: 'Váratlan hiba történt. Próbáld újra később.' }
    }

    if (existing && existing.length > 0) {
      return { success: false, message: 'Ezzel az e-mail címmel már létezik fiók.' }
    }

    const hashedPassword = await bcryptHash(password, 10)

    const { error } = await supabase.from('auth_users').insert({
      name: trimmedName,
      email: normalizedEmail,
      password: hashedPassword,
      role: 'user',
      status: 'pending'
    })

    if (error) {
      console.error('Supabase regisztráció hiba:', error.message)
      return { success: false, message: 'Nem sikerült a regisztráció. Próbáld újra később.' }
    }

    await loadUsers()

    return {
      success: true,
      message: 'Sikeres regisztráció! Az admin jóváhagyása után tudsz bejelentkezni.'
    }
  }, [loadUsers])

  const logout = useCallback(() => {
    setCurrentUserId(null)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(CURRENT_USER_KEY)
    }
  }, [])

  const updateUserStatus = useCallback(
    async (userId: string, status: UserStatus) => {
      if (!isSupabaseConfigured) {
        return
      }

      const { error } = await supabase
        .from('auth_users')
        .update({ status })
        .eq('id', userId)

      if (error) {
        console.error('Supabase státusz frissítés hiba:', error.message)
        return
      }

      if (currentUserId === userId && status !== 'approved') {
        logout()
      }

      await loadUsers()
    },
    [currentUserId, loadUsers, logout]
  )

  const approveUser = useCallback<AuthContextValue['approveUser']>(
    async (userId) => {
      await updateUserStatus(userId, 'approved')
    },
    [updateUserStatus]
  )

  const rejectUser = useCallback<AuthContextValue['rejectUser']>(
    async (userId) => {
      await updateUserStatus(userId, 'rejected')
    },
    [updateUserStatus]
  )

  const value: AuthContextValue = {
    users,
    currentUser,
    loading,
    login,
    register,
    logout,
    approveUser,
    rejectUser,
    refreshUsers: loadUsers
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }
  return context
}
