import React, { useState } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import { useAuth } from '../context/AuthContext'

const AccountSettings: React.FC = () => {
  const {
    currentUser,
    generateTwoFactorSetup,
    confirmTwoFactor
  } = useAuth()

  const [password, setPassword] = useState('')
  const [setupData, setSetupData] = useState<{
    secret: string
    otpauthUrl: string
    qrCode: string
  } | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  )

  const handleGenerate = async () => {
    if (!password.trim()) {
      setFeedback({ type: 'error', message: 'Add meg a jelszavad.' })
      return
    }

    setIsLoading(true)
    setFeedback(null)

    const result = await generateTwoFactorSetup(password.trim())
    if (!result.success || !result.secret || !result.otpauthUrl || !result.qrCode) {
      setFeedback({ type: 'error', message: result.message ?? 'Nem sikerült generálni a 2FA-t.' })
    } else {
      setSetupData({
        secret: result.secret,
        otpauthUrl: result.otpauthUrl,
        qrCode: result.qrCode
      })
      setFeedback({
        type: 'success',
        message: 'Szkenneld be a QR-kódot a hitelesítő alkalmazással, majd add meg a kódot.'
      })
    }

    setIsLoading(false)
  }

  const handleConfirm = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!verificationCode.trim()) {
      setFeedback({ type: 'error', message: 'Add meg a 2FA kódot.' })
      return
    }

    setIsLoading(true)
    const result = await confirmTwoFactor(verificationCode.trim())
    if (!result.success) {
      setFeedback({ type: 'error', message: result.message ?? 'Érvénytelen kód.' })
    } else {
      setFeedback({ type: 'success', message: 'A 2FA sikeresen engedélyezve.' })
      setSetupData(null)
      setPassword('')
      setVerificationCode('')
    }
    setIsLoading(false)
  }


  const twoFactorEnabled = Boolean(currentUser?.twoFactorEnabled)

  return (
    <div className="space-y-8 fade-in max-w-4xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold gradient-text-gold">Fiókbeállítások</h1>
        <p className="text-f1-text-secondary">
          Kezeld a fiókod biztonsági beállításait, többek között a kétlépcsős hitelesítést.
        </p>
      </div>

      {feedback && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border border-emerald-400/40 bg-emerald-400/10 text-emerald-300'
              : 'border border-f1-red/40 bg-f1-red/10 text-f1-red'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <Card className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-f1-text">Kétlépcsős hitelesítés (2FA)</h2>
            <p className="text-sm text-f1-text-secondary">
              A 2FA kötelező minden felhasználó számára a biztonság érdekében.
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              twoFactorEnabled
                ? 'bg-emerald-400/10 border border-emerald-400/40 text-emerald-300'
                : 'bg-orange-400/10 border border-orange-400/40 text-orange-300'
            }`}
          >
            {twoFactorEnabled ? 'Aktív' : 'Beállítás szükséges'}
          </span>
        </div>

        {!twoFactorEnabled && !setupData && (
          <div className="space-y-4">
            <Input
              label="Jelszó megerősítés"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="Add meg a jelenlegi jelszavad"
              required
            />
            <Button onClick={handleGenerate} variant="gold" disabled={isLoading}>
              {isLoading ? 'Kulcs generálása...' : '2FA bekapcsolása'}
            </Button>
          </div>
        )}

        {!twoFactorEnabled && setupData && (
          <form className="space-y-6" onSubmit={handleConfirm}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="text-sm text-f1-text">
                  Szkenneld be a QR-kódot az authenticator alkalmazásoddal.
                </p>
                <div className="rounded-xl border border-f1-light-gray/40 bg-black/30 p-4 flex items-center justify-center">
                  <img src={setupData.qrCode} alt="2FA QR" className="w-48 h-48" />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-f1-text-secondary">Manuális kód</p>
                  <p className="font-mono text-f1-text text-lg break-all bg-f1-dark/80 border border-f1-light-gray/40 rounded-lg px-3 py-2 mt-1">
                    {setupData.secret}
                  </p>
                </div>
                <Input
                  label="Authenticator kód"
                  value={verificationCode}
                  onChange={setVerificationCode}
                  placeholder="Írd be a 6 számjegyű kódot"
                  required
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSetupData(null)
                  setPassword('')
                  setVerificationCode('')
                  setFeedback(null)
                }}
                disabled={isLoading}
              >
                Mégse
              </Button>
              <Button type="submit" variant="gold" disabled={isLoading}>
                {isLoading ? 'Ellenőrzés...' : 'Aktiválás megerősítése'}
              </Button>
            </div>
          </form>
        )}

        {twoFactorEnabled && (
          <div className="space-y-4">
            <div className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
              ✓ A kétlépcsős hitelesítés aktív és védelmezi a fiókodat. A 2FA kikapcsolása biztonsági okokból nem lehetséges.
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default AccountSettings

