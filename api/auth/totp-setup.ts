import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabaseAdmin } from '../_lib/supabase.js'
import { encrypt } from '../_lib/crypto.js'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'
import { compare as bcryptCompare } from 'bcryptjs'
import type { AuthUserRecord } from '../_lib/users.js'

const ISSUER = 'SimRacing Operations Hub'

const handler = async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method Not Allowed' })
    return
  }

  try {
    const { userId, password } = req.body ?? {}

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

    const secret = authenticator.generateSecret()
    const otpauthUrl = authenticator.keyuri(data.email, ISSUER, secret)
    const qrCode = await QRCode.toDataURL(otpauthUrl)

    const { error: updateError } = await supabaseAdmin
      .from('auth_users')
      .update({
        totp_secret: encrypt(secret),
        two_factor_enabled: false,
        totp_confirmed_at: null
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Update totp_secret failed:', updateError.message)
      res.status(500).json({ success: false, message: 'Nem sikerült frissíteni a profilt.' })
      return
    }

    res.status(200).json({
      success: true,
      secret,
      otpauthUrl,
      qrCode
    })
  } catch (err) {
    console.error('TOTP setup error:', err)
    res.status(500).json({ success: false, message: 'Szerverhiba történt.' })
  }
}

export default handler

