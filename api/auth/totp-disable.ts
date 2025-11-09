import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabaseAdmin } from '../_lib/supabase'
import { decrypt } from '../_lib/crypto'
import { authenticator } from 'otplib'
import { compare as bcryptCompare } from 'bcryptjs'
import type { AuthUserRecord } from '../_lib/users'

const handler = async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method Not Allowed' })
    return
  }

  try {
    const { userId, password, token } = req.body ?? {}

    if (!userId || !password) {
      res.status(400).json({ success: false, message: 'Hiányzó adatok.' })
      return
    }

    const { data, error } = await supabaseAdmin
      .from<AuthUserRecord>('auth_users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error || !data) {
      res.status(404).json({ success: false, message: 'Felhasználó nem található.' })
      return
    }

    const passwordsMatch = await bcryptCompare(password, data.password ?? '')
    if (!passwordsMatch) {
      res.status(401).json({ success: false, message: 'Hibás jelszó.' })
      return
    }

    if (data.two_factor_enabled) {
      const secret = decrypt(data.totp_secret ?? null)
      if (secret && token) {
        const valid = authenticator.verify({ token: String(token), secret })
        if (!valid) {
          res.status(401).json({ success: false, message: 'Érvénytelen 2FA kód.' })
          return
        }
      }
    }

    const { error: updateError } = await supabaseAdmin
      .from('auth_users')
      .update({
        two_factor_enabled: false,
        totp_secret: null,
        totp_confirmed_at: null
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Disable 2FA failed:', updateError.message)
      res.status(500).json({ success: false, message: 'Nem sikerült kikapcsolni a 2FA-t.' })
      return
    }

    res.status(200).json({ success: true })
  } catch (err) {
    console.error('TOTP disable error:', err)
    res.status(500).json({ success: false, message: 'Szerverhiba történt.' })
  }
}

export default handler

