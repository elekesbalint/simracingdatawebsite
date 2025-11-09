import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Card from '../components/Card'
import Input from '../components/Input'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'
import { F125Badge, SimRacingBadge } from '../components/Branding'

const Register: React.FC = () => {
  const { register, currentUser, loading } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
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
    setMessage(null)
    setIsSubmitting(true)

    const result = await register({ name, email, password })

    if (result.success) {
      setMessage(result.message)
      setName('')
      setEmail('')
      setPassword('')
    } else {
      setError(result.message)
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
          <h1 className="text-3xl font-bold text-f1-text">Regisztráció</h1>
          <p className="text-sm text-f1-text-secondary">
            Hozz létre egy fiókot, majd várj az admin jóváhagyására. Már van fiókod?{' '}
            <Link to="/login" className="text-f1-gold hover:text-white transition-colors">
              Jelentkezz be
            </Link>
            .
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-f1-red/40 bg-f1-red/10 px-4 py-3 text-sm text-f1-red">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
            {message}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Név"
            placeholder="Teljes név"
            value={name}
            onChange={setName}
            required
          />
          <Input
            label="E-mail cím"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={setEmail}
            required
          />
          <Input
            label="Jelszó"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={setPassword}
            required
          />
          <Button type="submit" variant="gold" className="w-full" disabled={isSubmitting || loading}>
            {isSubmitting ? 'Regisztráció...' : 'Regisztráció elküldése'}
          </Button>
        </form>
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

export default Register
