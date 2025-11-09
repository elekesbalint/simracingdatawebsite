import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabaseAdmin } from '../_lib/supabase'
import { encrypt } from '../_lib/crypto'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'
import type { AuthUserRecord } from '../_lib/users'

const ISSUER = 'SimRacing Operations Hub'

const handler = async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method Not Allowed' })
    return
  }

  try {
    const { userId, adminId } = req.body ?? {}

    if (!userId || !adminId) {
      res.status(400).json({ success: false, message: 'Hiányzó adatok.' })
      return
    }

    // Check admin permissions
    const { data: admin, error: adminError } = await supabaseAdmin
      .from<AuthUserRecord>('auth_users')
      .select('role')
      .eq('id', adminId)
      .maybeSingle()

    if (adminError || !admin || admin.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Nincs jogosultság.' })
      return
    }

    // Get user to approve
    const { data: user, error: userError } = await supabaseAdmin
      .from<AuthUserRecord>('auth_users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (userError || !user) {
      res.status(404).json({ success: false, message: 'Felhasználó nem található.' })
      return
    }

    // Generate 2FA secret
    const secret = authenticator.generateSecret()
    const otpauthUrl = authenticator.keyuri(user.email, ISSUER, secret)
    const qrCode = await QRCode.toDataURL(otpauthUrl)

    // Approve user and set up 2FA
    const { error: updateError } = await supabaseAdmin
      .from('auth_users')
      .update({
        status: 'approved',
        totp_secret: encrypt(secret),
        two_factor_enabled: true,
        totp_confirmed_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Approve and generate 2FA failed:', updateError.message)
      res.status(500).json({ success: false, message: 'Nem sikerült jóváhagyni a felhasználót.' })
      return
    }

    res.status(200).json({
      success: true,
      secret,
      otpauthUrl,
      qrCode,
      userEmail: user.email,
      userName: user.name
    })
  } catch (err) {
    console.error('Admin approve error:', err)
    res.status(500).json({ success: false, message: 'Szerverhiba történt.' })
  }
}

export default handler

