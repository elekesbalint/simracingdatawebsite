import React, { useMemo, useState } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../context/AuthContext'

const AdminPanel: React.FC = () => {
  const { users, approveUserWithTwoFactor, rejectUser, currentUser, loading } = useAuth()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [twoFactorModal, setTwoFactorModal] = useState<{
    userName: string
    userEmail: string
    secret: string
    qrCode: string
  } | null>(null)

  const { pending, approved, rejected } = useMemo(() => {
    const withoutSelf = users.filter((user) => user.id !== currentUser?.id)
    return {
      pending: withoutSelf.filter((user) => user.status === 'pending'),
      approved: withoutSelf.filter((user) => user.status === 'approved'),
      rejected: withoutSelf.filter((user) => user.status === 'rejected')
    }
  }, [users, currentUser])

  const handleApprove = async (userId: string) => {
    setErrorMessage(null)
    setUpdatingUserId(userId)
    try {
      const result = await approveUserWithTwoFactor(userId)
      console.log('Approve result:', result) // DEBUG
      if (!result.success) {
        setErrorMessage(result.message ?? 'Nem sikerült jóváhagyni a felhasználót.')
      } else if (result.secret && result.qrCode && result.userEmail && result.userName) {
        console.log('Setting 2FA modal with:', result) // DEBUG
        setTwoFactorModal({
          userName: result.userName,
          userEmail: result.userEmail,
          secret: result.secret,
          qrCode: result.qrCode
        })
      } else {
        console.warn('Missing data in result:', result) // DEBUG
        setErrorMessage('Jóváhagyás sikeres, de a 2FA adatok hiányoznak.')
      }
    } catch (error) {
      console.error('Approve error:', error) // DEBUG
      setErrorMessage(
        error instanceof Error ? error.message : 'Nem sikerült jóváhagyni a felhasználót.'
      )
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handleReject = async (userId: string) => {
    setErrorMessage(null)
    setUpdatingUserId(userId)
    try {
      await rejectUser(userId)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Nem sikerült elutasítani a felhasználót.'
      )
    } finally {
      setUpdatingUserId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  console.log('AdminPanel render, twoFactorModal:', twoFactorModal) // DEBUG

  return (
    <>
      {twoFactorModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" style={{ position: 'fixed' }}>
          <Card className="max-w-2xl w-full space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-f1-text">Felhasználó jóváhagyva</h2>
                <p className="text-sm text-f1-text-secondary mt-1">
                  {twoFactorModal.userName} ({twoFactorModal.userEmail})
                </p>
              </div>
              <button
                onClick={() => setTwoFactorModal(null)}
                className="text-f1-text-secondary hover:text-f1-text transition-colors"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            <div className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
              ✓ A 2FA automatikusan be lett állítva. Küldd el az alábbi adatokat a felhasználónak.
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="text-sm text-f1-text font-semibold">QR kód</p>
                <div className="rounded-xl border border-f1-light-gray/40 bg-black/30 p-4 flex items-center justify-center">
                  <img src={twoFactorModal.qrCode} alt="2FA QR" className="w-64 h-64" />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-f1-text-secondary mb-2">
                    Manuális kulcs
                  </p>
                  <p className="font-mono text-f1-text text-sm break-all bg-f1-dark/80 border border-f1-light-gray/40 rounded-lg px-3 py-2">
                    {twoFactorModal.secret}
                  </p>
                </div>
                <div className="text-sm text-f1-text-secondary space-y-2">
                  <p>
                    A felhasználó bejelentkezéskor a jelszava mellett meg kell adnia a hitelesítő
                    alkalmazásból származó 6 számjegyű kódot.
                  </p>
                  <p>Ajánlott alkalmazások: Google Authenticator, Microsoft Authenticator.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="gold" onClick={() => setTwoFactorModal(null)}>
                Bezárás
              </Button>
            </div>
          </Card>
        </div>
      )}

      <div className="space-y-10 fade-in">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold gradient-text-gold">Admin panel</h1>
          <p className="text-f1-text-secondary max-w-3xl">
            Kezeld a regisztrációs kérelmeket és tartsd karban a pilóta fiókokat. Csak az elfogadott
            felhasználók tudnak bejelentkezni.
          </p>
        </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="space-y-2">
          <p className="text-sm text-f1-text-secondary uppercase tracking-wide">Folyamatban</p>
          <p className="text-3xl font-bold text-f1-text">{pending.length}</p>
        </Card>
        <Card className="space-y-2">
          <p className="text-sm text-f1-text-secondary uppercase tracking-wide">Jóváhagyott</p>
          <p className="text-3xl font-bold text-emerald-400">{approved.length}</p>
        </Card>
        <Card className="space-y-2">
          <p className="text-sm text-f1-text-secondary uppercase tracking-wide">Elutasított</p>
          <p className="text-3xl font-bold text-f1-red">{rejected.length}</p>
        </Card>
      </section>

      <Card className="space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-f1-text">Jóváhagyásra váró felhasználók</h2>
            <p className="text-sm text-f1-text-secondary">
              Fogadd el vagy utasítsd el a kérelmeket. Az elutasított felhasználók nem tudnak
              bejelentkezni.
            </p>
          </div>
        </header>

        {errorMessage && (
          <div className="rounded-lg border border-f1-red/40 bg-f1-red/10 px-4 py-3 text-sm text-f1-red">
            {errorMessage}
          </div>
        )}

        {pending.length === 0 ? (
          <div className="text-center py-10 text-f1-text-secondary">
            Jelenleg nincs új regisztráció.
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((user) => (
              <div
                key={user.id}
                className="rounded-2xl border border-f1-light-gray/40 bg-f1-dark/60 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div>
                  <p className="text-lg font-semibold text-f1-text">{user.name}</p>
                  <p className="text-sm text-f1-text-secondary">{user.email}</p>
                  <p className="text-xs text-f1-text-secondary mt-1">
                    Regisztrált: {new Date(user.createdAt).toLocaleString('hu-HU')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="gold"
                    onClick={() => handleApprove(user.id)}
                    disabled={updatingUserId === user.id}
                  >
                    {updatingUserId === user.id ? 'Folyamatban...' : 'Jóváhagyás'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleReject(user.id)}
                    disabled={updatingUserId === user.id}
                  >
                    Elutasítás
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-f1-text">Jóváhagyott felhasználók</h2>
          {approved.length === 0 ? (
            <p className="text-sm text-f1-text-secondary">Még senki sem lett jóváhagyva.</p>
          ) : (
            <ul className="space-y-2 text-sm text-f1-text-secondary">
              {approved.map((user) => (
                <li key={user.id} className="flex items-center justify-between">
                  <span className="text-f1-text">{user.name}</span>
                  <span>{user.email}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-f1-text">Elutasított felhasználók</h2>
          {rejected.length === 0 ? (
            <p className="text-sm text-f1-text-secondary">Nincs elutasított felhasználó.</p>
          ) : (
            <ul className="space-y-2 text-sm text-f1-text-secondary">
              {rejected.map((user) => (
                <li key={user.id} className="flex items-center justify-between">
                  <span className="text-f1-text">{user.name}</span>
                  <span>{user.email}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
      </div>
    </>
  )
}

export default AdminPanel
