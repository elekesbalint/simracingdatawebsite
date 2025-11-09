import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { hash as bcryptHash, compare as bcryptCompare } from 'bcryptjs'
import { AuthUser, UserStatus } from '../types'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'

interface AuthContextValue {
  users: AuthUser[]
  currentUser: AuthUser | null
  loading: boolean
  pendingTwoFactor: { email: string; userId: string } | null
  login: (
    email: string,
    password: string,
    token?: string
  ) => Promise<{ success: boolean; message?: string; requiresTwoFactor?: boolean }>
  register: (payload: { name: string; email: string; password: string }) => Promise<{
    success: boolean
    message: string
  }>
  verifyTwoFactor: (token: string) => Promise<{ success: boolean; message?: string }>
  generateTwoFactorSetup: (
    password: string
  ) => Promise<{ success: boolean; message?: string; secret?: string; otpauthUrl?: string; qrCode?: string }>
  confirmTwoFactor: (token: string) => Promise<{ success: boolean; message?: string }>
  disableTwoFactor: (password: string, token?: string) => Promise<{ success: boolean; message?: string }>
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
  createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
  twoFactorEnabled: Boolean(row.two_factor_enabled)
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

  const [pendingTwoFactor, setPendingTwoFactor] = useState<{
    email: string
    password: string
    userId: string
  } | null>(null)

  const login = useCallback<AuthContextValue['login']>(
    async (email, password, token) => {
      if (!isSupabaseConfigured) {
        return { success: false, message: 'Supabase konfiguráció hiányzik.' }
      }

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email,
            password,
            token
          })
        })

        const result = await response.json()

        if (!response.ok && !result.requiresTwoFactor) {
          return { success: false, message: result.message ?? 'Sikertelen bejelentkezés.' }
        }

        if (result.requiresTwoFactor) {
          setPendingTwoFactor({
            email,
            password,
            userId: result.userId
          })

          return {
            success: false,
            requiresTwoFactor: true,
            message: result.message ?? 'Add meg a 2FA kódot.'
          }
        }

        if (!result.success || !result.user) {
          return { success: false, message: result.message ?? 'Sikertelen bejelentkezés.' }
        }

        setPendingTwoFactor(null)
        setCurrentUserId(result.user.id)
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(CURRENT_USER_KEY, result.user.id)
        }

        await loadUsers()
        return { success: true }
      } catch (err) {
        console.error('Login request failed:', err)
        return { success: false, message: 'Nem sikerült kapcsolódni a szerverhez.' }
      }
    },
    [isSupabaseConfigured, loadUsers]
  )

  const verifyTwoFactor = useCallback<AuthContextValue['verifyTwoFactor']>(
    async (token) => {
      if (!pendingTwoFactor) {
        return { success: false, message: 'Nincs folyamatban lévő 2FA ellenőrzés.' }
      }

      return login(pendingTwoFactor.email, pendingTwoFactor.password, token)
    },
    [login, pendingTwoFactor]
  )

  const generateTwoFactorSetup = useCallback<AuthContextValue['generateTwoFactorSetup']>(
    async (password) => {
      if (!isSupabaseConfigured) {
        return { success: false, message: 'Supabase konfiguráció hiányzik.' }
      }

      if (!currentUser) {
        return { success: false, message: 'Nincs bejelentkezett felhasználó.' }
      }

      try {
        const response = await fetch('/api/auth/totp-setup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: currentUser.id,
            password
          })
        })

        const result = await response.json()

        if (!response.ok || !result.success) {
          return { success: false, message: result.message ?? 'Nem sikerült létrehozni a 2FA kulcsot.' }
        }

        return {
          success: true,
          secret: result.secret,
          otpauthUrl: result.otpauthUrl,
          qrCode: result.qrCode
        }
      } catch (err) {
        console.error('generateTwoFactorSetup failed:', err)
        return { success: false, message: 'Nem sikerült kapcsolódni a szerverhez.' }
      }
    },
    [currentUser]
  )

  const confirmTwoFactor = useCallback<AuthContextValue['confirmTwoFactor']>(
    async (token) => {
      if (!isSupabaseConfigured) {
        return { success: false, message: 'Supabase konfiguráció hiányzik.' }
      }

      if (!currentUser) {
        return { success: false, message: 'Nincs bejelentkezett felhasználó.' }
      }

      try {
        const response = await fetch('/api/auth/totp-verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: currentUser.id,
            token
          })
        })

        const result = await response.json()

        if (!response.ok || !result.success) {
          return { success: false, message: result.message ?? 'Érvénytelen kód.' }
        }

        await loadUsers()
        return { success: true }
      } catch (err) {
        console.error('confirmTwoFactor failed:', err)
        return { success: false, message: 'Nem sikerült kapcsolódni a szerverhez.' }
      }
    },
    [currentUser, loadUsers]
  )

  const disableTwoFactor = useCallback<AuthContextValue['disableTwoFactor']>(
    async (password, token) => {
      if (!isSupabaseConfigured) {
        return { success: false, message: 'Supabase konfiguráció hiányzik.' }
      }

      if (!currentUser) {
        return { success: false, message: 'Nincs bejelentkezett felhasználó.' }
      }

      try {
        const response = await fetch('/api/auth/totp-disable', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: currentUser.id,
            password,
            token
          })
        })

        const result = await response.json()

        if (!response.ok || !result.success) {
          return { success: false, message: result.message ?? 'Nem sikerült kikapcsolni a 2FA-t.' }
        }

        await loadUsers()
        return { success: true }
      } catch (err) {
        console.error('disableTwoFactor failed:', err)
        return { success: false, message: 'Nem sikerült kapcsolódni a szerverhez.' }
      }
    },
    [currentUser, loadUsers]
  )

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
    setPendingTwoFactor(null)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(CURRENT_USER_KEY)
    }
  }, [])

  const updateUserStatus = useCallback(
    async (userId: string, status: UserStatus) => {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase konfiguráció hiányzik.')
      }

      let previousUser: AuthUser | undefined

      setUsers((prev) => {
        previousUser = prev.find((user) => user.id === userId)
        if (!previousUser) {
          return prev
        }

        return prev.map((user) => (user.id === userId ? { ...user, status } : user))
      })

      const { error } = await supabase
        .from('auth_users')
        .update({ status })
        .eq('id', userId)

      if (error) {
        console.error('Supabase státusz frissítés hiba:', error.message)

        if (previousUser) {
          setUsers((prev) => prev.map((user) => (user.id === userId ? previousUser! : user)))
        }

        throw new Error('Nem sikerült frissíteni a felhasználó státuszát. Próbáld újra később.')
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
    pendingTwoFactor: pendingTwoFactor
      ? { email: pendingTwoFactor.email, userId: pendingTwoFactor.userId }
      : null,
    login,
    register,
    verifyTwoFactor,
    generateTwoFactorSetup,
    confirmTwoFactor,
    disableTwoFactor,
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
