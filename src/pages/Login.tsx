import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Card from '../components/Card'
import Input from '../components/Input'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'
import { F125Badge, SimRacingBadge } from '../components/Branding'

const Login: React.FC = () => {
  const { login, currentUser, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: Location } }
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (currentUser && currentUser.status === 'approved') {
      navigate('/', { replace: true })
    }
  }, [currentUser, navigate])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const result = await login(email, password)

    if (!result.success) {
      setError(result.message ?? 'Sikertelen bejelentkezés.')
    } else {
      const from = location.state?.from
      navigate(from?.pathname || '/', { replace: true })
    }

    setIsSubmitting(false)
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
          <Button type="submit" variant="gold" className="w-full" disabled={isSubmitting || loading}>
            {isSubmitting ? 'Bejelentkezés...' : 'Bejelentkezés'}
          </Button>
        </form>

        <div className="rounded-lg border border-f1-light-gray/40 bg-f1-dark/60 px-4 py-3 text-xs text-f1-text-secondary space-y-1">
          <p className="font-medium text-f1-text">Teszt admin fiók</p>
          <p>E-mail: admin@simhub.local</p>
          <p>Jelszó: admin123</p>
        </div>
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
