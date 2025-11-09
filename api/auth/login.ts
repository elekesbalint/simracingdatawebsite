import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabaseAdmin } from '../_lib/supabase.js'
import { sanitizeUser, type AuthUserRecord } from '../_lib/users.js'
import { decrypt } from '../_lib/crypto.js'
import { authenticator } from 'otplib'
import { compare as bcryptCompare } from 'bcryptjs'

const handler = async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method Not Allowed' })
    return
  }

  try {
    const { email, password, token } = req.body ?? {}

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Hiányzó hitelesítési adatok.' })
      return
    }

    const normalizedEmail = String(email).trim().toLowerCase()

    const { data, error } = await supabaseAdmin
      .from('auth_users')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (error || !data) {
      res.status(401).json({ success: false, message: 'Hibás e-mail vagy jelszó.' })
      return
    }

    const passwordsMatch = await bcryptCompare(password, data.password ?? '')
    if (!passwordsMatch) {
      res.status(401).json({ success: false, message: 'Hibás e-mail vagy jelszó.' })
      return
    }

    // Check if user is approved
    if (data.status !== 'approved') {
      res.status(403).json({ success: false, message: 'A fiókodat még nem hagyták jóvá.' })
      return
    }

    // Handle 2FA
    let totpSecret: string | null = null
    try {
      totpSecret = data.totp_secret ? decrypt(data.totp_secret) : null
    } catch (decryptError) {
      console.error('TOTP decryption failed:', decryptError)
      totpSecret = null
    }
    
    const twoFactorEnabled = Boolean(data.two_factor_enabled && totpSecret)

    // If 2FA is not set up, allow login but flag for setup
    if (!twoFactorEnabled) {
      res.status(200).json({
        success: true,
        requiresTwoFactor: false,
        user: sanitizeUser(data),
        twoFactorEnabled: false,
        requiresSetup: true
      })
      return
    }

    // If 2FA is enabled, require token
    if (!token) {
      res.status(200).json({
        success: false,
        requiresTwoFactor: true,
        userId: data.id,
        message: 'Add meg a 2FA kódot.'
      })
      return
    }

    const verified = authenticator.verify({
      token: String(token),
      secret: totpSecret!
    })

    if (!verified) {
      res.status(401).json({
        success: false,
        requiresTwoFactor: true,
        userId: data.id,
        message: 'Érvénytelen 2FA kód.'
      })
      return
    }

    res.status(200).json({
      success: true,
      requiresTwoFactor: false,
      user: sanitizeUser(data),
      twoFactorEnabled: true
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ success: false, message: 'Szerverhiba történt.' })
  }
}

export default handler

