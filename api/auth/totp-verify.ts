import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabaseAdmin } from '../_lib/supabase'
import { decrypt } from '../_lib/crypto'
import { authenticator } from 'otplib'
import type { AuthUserRecord } from '../_lib/users'

const handler = async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method Not Allowed' })
    return
  }

  try {
    const { userId, token } = req.body ?? {}

    if (!userId || !token) {
      res.status(400).json({ success: false, message: 'Hiányzó adatok.' })
      return
    }

    const { data, error } = await supabaseAdmin
      .from<AuthUserRecord>('auth_users')
      .select('id, totp_secret')
      .eq('id', userId)
      .maybeSingle()

    if (error || !data) {
      res.status(404).json({ success: false, message: 'Felhasználó nem található.' })
      return
    }

    const secret = decrypt(data.totp_secret)
    if (!secret) {
      res.status(400).json({ success: false, message: '2FA nincs inicializálva.' })
      return
    }

    const isValid = authenticator.verify({ token: String(token), secret })
    if (!isValid) {
      res.status(401).json({ success: false, message: 'Érvénytelen 2FA kód.' })
      return
    }

    const { error: updateError } = await supabaseAdmin
      .from('auth_users')
      .update({
        two_factor_enabled: true,
        totp_confirmed_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Enable 2FA failed:', updateError.message)
      res.status(500).json({ success: false, message: 'Nem sikerült engedélyezni a 2FA-t.' })
      return
    }

    res.status(200).json({ success: true })
  } catch (err) {
    console.error('TOTP verify error:', err)
    res.status(500).json({ success: false, message: 'Szerverhiba történt.' })
  }
}

export default handler

