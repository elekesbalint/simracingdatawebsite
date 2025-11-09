import type { AuthUser } from '../../src/types'

export interface AuthUserRecord extends AuthUser {
  password: string
  totp_secret?: string | null
  two_factor_enabled?: boolean
  totp_confirmed_at?: string | null
}

export const sanitizeUser = (user: Partial<AuthUserRecord>): AuthUser => ({
  id: user.id!,
  name: user.name ?? '',
  email: user.email ?? '',
  password: '',
  role: user.role ?? 'user',
  status: user.status ?? 'pending',
  createdAt: user.createdAt ?? new Date().toISOString(),
  twoFactorEnabled: Boolean(user.two_factor_enabled)
})

