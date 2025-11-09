import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Card from '../components/Card'
import Input from '../components/Input'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'
import { F125Badge, SimRacingBadge } from '../components/Branding'

const Login: React.FC = () => {
  const { login, verifyTwoFactor, pendingTwoFactor, currentUser, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: Location } }
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [twoFactorToken, setTwoFactorToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [twoFactorStep, setTwoFactorStep] = useState(false)

  useEffect(() => {
    if (currentUser && currentUser.status === 'approved') {
      navigate('/', { replace: true })
    }
  }, [currentUser, navigate])

  useEffect(() => {
    if (pendingTwoFactor) {
      setTwoFactorStep(true)
    } else {
      setTwoFactorStep(false)
      setTwoFactorToken('')
    }
  }, [pendingTwoFactor])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const result = await login(email, password)

    if (!result.success) {
      if (result.requiresTwoFactor) {
        setTwoFactorStep(true)
        setError(result.message ?? 'Add meg a 2FA kódot.')
      } else {
        setError(result.message ?? 'Sikertelen bejelentkezés.')
      }
    } else {
      // Successfully logged in
      const from = location.state?.from
      navigate(from?.pathname || '/', { replace: true })
    }

    setIsSubmitting(false)
  }

  const handleTwoFactorSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!twoFactorToken.trim()) {
      setError('Add meg a 2FA kódot.')
      return
    }

    setIsVerifying(true)
    setError(null)

    const result = await verifyTwoFactor(twoFactorToken.trim())

    if (!result.success) {
      setError(result.message ?? 'Érvénytelen 2FA kód.')
    } else {
      const from = location.state?.from
      navigate(from?.pathname || '/', { replace: true })
    }

    setIsVerifying(false)
  }

  return (
    <div className="min-h-screen bg-f1-dark flex flex-col items-center justify-center p-6 space-y-6">
      <Card className="w-full max-w-md space-y-6 p-8">
        <div className="flex items-center justify-center space-x-3">
          <F125Badge />
          <SimRacingBadge className="h-12" />
        </div>
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-f1-text">Bejelentkezés</h1>
          <p className="text-sm text-f1-text-secondary">
            Jelentkezz be a jóváhagyott fiókoddal. Új vagy?{' '}
            <Link to="/register" className="text-f1-gold hover:text-white transition-colors">
              Regisztrálj itt
            </Link>
            .
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-f1-red/40 bg-f1-red/10 px-4 py-3 text-sm text-f1-red">
            {error}
          </div>
        )}

        {!twoFactorStep ? (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="E-mail vagy felhasználónév"
              type="text"
              value={email}
              onChange={setEmail}
              placeholder="pl. admin vagy you@example.com"
              required
            />
            <Input
              label="Jelszó"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              required
            />
            <Button
              type="submit"
              variant="gold"
              className="w-full"
              disabled={isSubmitting || loading}
            >
              {isSubmitting ? 'Bejelentkezés...' : 'Bejelentkezés'}
            </Button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleTwoFactorSubmit}>
            <Input
              label="2FA kód"
              type="text"
              value={twoFactorToken}
              onChange={setTwoFactorToken}
              placeholder="••••••"
              required
            />
            <Button
              type="submit"
              variant="gold"
              className="w-full"
              disabled={isVerifying || loading}
            >
              {isVerifying ? 'Ellenőrzés...' : 'Belépés megerősítése'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setTwoFactorStep(false)
                setTwoFactorToken('')
                setError(null)
              }}
              disabled={isVerifying}
            >
              Vissza
            </Button>
          </form>
        )}

      </Card>

      <div className="text-xs text-f1-text-secondary text-center space-y-1">
        <div>
          © 2025{' '}
          <a
            href="https://balintelekes.hu"
            target="_blank"
            rel="noreferrer"
            className="text-f1-gold hover:text-white transition-colors"
          >
            Balint Elekes
          </a>
          . All rights reserved.
        </div>
        <div>
          Designed &amp; coded by{' '}
          <a
            href="https://balintelekes.hu"
            target="_blank"
            rel="noreferrer"
            className="text-f1-gold hover:text-white transition-colors"
          >
            Balint Elekes
          </a>
        </div>
      </div>
    </div>
  )
}

export default Login
